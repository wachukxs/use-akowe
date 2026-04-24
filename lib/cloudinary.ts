import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFolder = () =>
  process.env.CLOUDINARY_UPLOAD_FOLDER || 'akowe/editor-images';

/**
 * Upload a raw Buffer (with a known MIME type) to Cloudinary.
 * Returns the public secure URL.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: uploadFolder(),
    resource_type: 'image',
    unique_filename: true,
    tags: ['editor-image'],
  });

  return result.secure_url;
}

/**
 * Upload a File object (from a browser FormData upload) to Cloudinary.
 * Returns the public secure URL.
 */
export async function uploadFileToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return uploadBufferToCloudinary(buffer, file.type);
}
