import { chromium } from 'playwright';
import { scanPage } from './scan/page.js';
import { mapWithConcurrency } from './scan/pool.js';
import { DEFAULT_VIEWPORT } from './viewport.js';

const DEFAULT_SETTINGS = {
  concurrency: 1,
  timeoutMs: 30_000,
  retries: 2,
  backoffMs: 500,
  viewports: [DEFAULT_VIEWPORT],
};

export async function scanPages(urls, options = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...options };
  assertConcurrency(settings.concurrency);
  const jobs = viewportJobs(urls, settings.viewports);
  const browser = await chromium.launch({ headless: true });
  try {
    const pages = await mapWithConcurrency(jobs, settings.concurrency, ({ url, viewport }) =>
      auditOne(browser, url, { ...settings, viewport }));
    return { generatedAt: new Date().toISOString(), pages };
  } finally {
    await browser.close();
  }
}

const viewportJobs = (urls, viewports) =>
  viewports.flatMap((viewport) => urls.map((url) => ({ url, viewport })));

async function auditOne(browser, url, settings) {
  const page = await scanPage(browser, url, settings);
  return { ...page, viewport: settings.viewport.name };
}

function assertConcurrency(concurrency) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`Concurrence invalide « ${concurrency} » : entier supérieur ou égal à 1 attendu`);
  }
}
