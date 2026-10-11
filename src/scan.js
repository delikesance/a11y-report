import { chromium } from 'playwright';
import { scanPage } from './scan/page.js';

const DEFAULT_SETTINGS = { timeoutMs: 30_000, retries: 2, backoffMs: 500 };

export async function scanPages(urls, options = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...options };
  const browser = await chromium.launch({ headless: true });
  try {
    const pages = [];
    for (const url of urls) {
      pages.push(await scanPage(browser, url, settings));
    }
    return { generatedAt: new Date().toISOString(), pages };
  } finally {
    await browser.close();
  }
}
