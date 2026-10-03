/**
 * Regenerates public/akowe-investor-pitch-deck.pdf from the investor page.
 * Run whenever the investor page content changes:
 *   npm run build:investor-pdf                      (renders https://useakowe.com)
 *   INVESTOR_URL=http://localhost:3000 npm run build:investor-pdf
 */
import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.INVESTOR_URL || 'https://useakowe.com';
const out = path.join(process.cwd(), 'public', 'akowe-investor-pitch-deck.pdf');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.goto(`${baseUrl}/investor?pdf=true`, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    mkdirSync(path.dirname(out), { recursive: true });
    await page.pdf({
      path: out,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    console.log(`Wrote ${out}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
