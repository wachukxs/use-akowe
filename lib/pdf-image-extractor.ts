/**
 * PDF image extractor using pdfjs-dist + node-canvas.
 *
 * For every page that contains image operators, the embedded image XObjects
 * are decoded to raw pixel data, drawn onto a Node.js canvas, exported as
 * PNG, and uploaded to Cloudinary.
 *
 * Returns Map<pageNumber (1-based), Cloudinary URL[]> so the caller can
 * inject <img> tags into the correct section content.
 */
import { createCanvas } from 'canvas';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';

// ---------------------------------------------------------------------------
// Internal types for pdfjs internals not exposed in the public types
// ---------------------------------------------------------------------------

interface PdfjsImageData {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
  kind: 1 | 2 | 3; // ImageKind: GRAYSCALE_1BPP | RGB_24BPP | RGBA_32BPP
}

interface PdfjsObjStore {
  get(id: string, callback: (value: unknown) => void): void;
}

type PdfjsPageWithObjs = PDFPageProxy & { objs: PdfjsObjStore };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Skip images smaller than this in either dimension (icons, bullets, etc.)
const MIN_IMAGE_DIMENSION_PX = 80;

// Per-image upload timeout in ms
const OBJ_FETCH_TIMEOUT_MS = 5_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert raw pdfjs pixel data to a PNG Buffer via node-canvas, then upload
 * to Cloudinary. Returns null if the image is too small or conversion fails.
 */
async function pixelsToCloudinaryUrl(img: PdfjsImageData): Promise<string | null> {
  const { data, width, height, kind } = img;

  if (width < MIN_IMAGE_DIMENSION_PX || height < MIN_IMAGE_DIMENSION_PX) {
    return null;
  }

  // Build a flat RGBA Uint8ClampedArray regardless of the source pixel format.
  let rgba: Uint8ClampedArray;

  if (kind === 3 /* RGBA_32BPP */) {
    rgba = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data.buffer);
  } else if (kind === 2 /* RGB_24BPP */) {
    rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      rgba[i * 4]     = data[i * 3];
      rgba[i * 4 + 1] = data[i * 3 + 1];
      rgba[i * 4 + 2] = data[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
  } else if (kind === 1 /* GRAYSCALE_1BPP */) {
    // 1-bit packed grayscale → RGBA (expand each bit to a full pixel)
    rgba = new Uint8ClampedArray(width * height * 4);
    for (let byte = 0; byte < data.length; byte++) {
      for (let bit = 7; bit >= 0; bit--) {
        const px = byte * 8 + (7 - bit);
        if (px >= width * height) break;
        const v = ((data[byte] >> bit) & 1) ? 255 : 0;
        rgba[px * 4]     = v;
        rgba[px * 4 + 1] = v;
        rgba[px * 4 + 2] = v;
        rgba[px * 4 + 3] = 255;
      }
    }
  } else {
    return null; // Unknown format
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  imgData.data.set(rgba);
  ctx.putImageData(imgData, 0, 0);

  const pngBuffer = canvas.toBuffer('image/png');
  return uploadBufferToCloudinary(pngBuffer, 'image/png');
}

/**
 * Fetch a pdfjs page object by name, resolving a Promise when ready.
 * Rejects after OBJ_FETCH_TIMEOUT_MS to prevent hanging on corrupt images.
 */
function fetchPageObj(objs: PdfjsObjStore, name: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for pdfjs obj: ${name}`)),
      OBJ_FETCH_TIMEOUT_MS
    );
    objs.get(name, (value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract all embedded images from a PDF Buffer.
 *
 * @returns Map where keys are 1-based page numbers and values are arrays of
 *          Cloudinary secure URLs for images found on that page.
 */
export async function extractPDFImages(
  buffer: Buffer
): Promise<Map<number, string[]>> {
  const pageImages = new Map<number, string[]>();

  try {
    // Dynamic import keeps this server-only module out of the browser bundle,
    // and avoids ESM/CJS conflicts at the module graph level.
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const pdf = (await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0,
    }).promise) as PDFDocumentProxy;

    // Operator numbers that indicate an image is drawn on the page
    const IMAGE_OPS = new Set([
      pdfjsLib.OPS.paintImageXObject,
      pdfjsLib.OPS.paintInlineImageXObject,
      pdfjsLib.OPS.paintImageXObjectRepeat,
    ]);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = (await pdf.getPage(pageNum)) as PdfjsPageWithObjs;
      const opList = await page.getOperatorList();

      // Collect unique XObject names referenced on this page
      const imageNames = new Set<string>();
      for (let i = 0; i < opList.fnArray.length; i++) {
        if (IMAGE_OPS.has(opList.fnArray[i])) {
          const name = opList.argsArray[i]?.[0];
          if (typeof name === 'string') imageNames.add(name);
        }
      }

      if (imageNames.size === 0) {
        page.cleanup();
        continue;
      }

      const urls: string[] = [];

      for (const name of imageNames) {
        try {
          const raw = (await fetchPageObj(page.objs, name)) as PdfjsImageData | null;
          if (!raw?.data) continue;

          const url = await pixelsToCloudinaryUrl(raw);
          if (url) urls.push(url);
        } catch {
          // Individual image failures are non-fatal
        }
      }

      if (urls.length > 0) pageImages.set(pageNum, urls);

      page.cleanup();
    }

    await (pdf as unknown as { destroy(): Promise<void> }).destroy();
  } catch (err) {
    // Non-fatal: return whatever was successfully extracted
    console.error('[pdf-image-extractor]', err);
  }

  return pageImages;
}
