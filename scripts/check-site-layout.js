import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_DIR = join(ROOT_DIR, 'site');
export const WIDTHS = [360, 768, 1280];
const HEIGHT = 800;
const TOLERANCE_PX = 1;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.js': 'text/javascript' };

const serve = () =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      const urlPath = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
      const filePath = join(SITE_DIR, urlPath === '/' ? 'index.html' : urlPath);
      try {
        const body = readFileSync(filePath);
        response.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        response.end(body);
      } catch {
        response.writeHead(404).end();
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });

function measureOverflow(tolerance) {
  const viewport = document.documentElement.clientWidth;
  const overflowingPage = document.documentElement.scrollWidth - viewport > tolerance;
  const outside = [...document.body.querySelectorAll('*')]
    .filter((el) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && (box.right > viewport + tolerance || box.left < -tolerance);
    })
    .map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
  return { overflowingPage, outside: outside.slice(0, 5) };
}

export async function checkLayout(baseUrl, pages, widths = WIDTHS) {
  const browser = await chromium.launch();
  const failures = [];
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: HEIGHT } });
      for (const name of pages) {
        await page.goto(`${baseUrl}/${name}`, { waitUntil: 'load' });
        const { overflowingPage, outside } = await page.evaluate(measureOverflow, TOLERANCE_PX);
        if (overflowingPage) failures.push(`${name} @${width}: défilement horizontal`);
        if (outside.length > 0) failures.push(`${name} @${width}: hors écran ${outside.join(', ')}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return failures;
}

async function main() {
  const server = await serve();
  const pages = readdirSync(SITE_DIR).filter((name) => name.endsWith('.html'));
  const { port } = server.address();
  const failures = await checkLayout(`http://127.0.0.1:${port}`, pages);
  server.close();
  for (const line of failures) console.log(`KO ${line}`);
  console.log(`${pages.length} pages x ${WIDTHS.length} largeurs : ${failures.length} échec(s)`);
  process.exitCode = failures.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
