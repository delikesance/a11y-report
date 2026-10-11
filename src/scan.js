import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const PAGE_TIMEOUT_MS = 30_000;
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

export async function scanPages(urls) {
  const browser = await chromium.launch({ headless: true });
  try {
    const pages = [];
    for (const url of urls) {
      pages.push(await scanPage(browser, url));
    }
    return { generatedAt: new Date().toISOString(), pages };
  } finally {
    await browser.close();
  }
}

async function scanPage(browser, url) {
  const context = await browser.newContext();
  try {
    return await withTimeout(analyzePage(context, url), PAGE_TIMEOUT_MS);
  } catch (error) {
    return { url, title: '', violations: [], passes: 0, incomplete: 0, error: error.message };
  } finally {
    await context.close();
  }
}

async function analyzePage(context, url) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return {
    url,
    title: await page.title(),
    violations: results.violations.map(toViolation),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  };
}

function toViolation(violation) {
  return {
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    description: violation.description,
    helpUrl: violation.helpUrl,
    tags: violation.tags,
    nodes: violation.nodes.map((node) => ({
      html: node.html,
      target: node.target.join(' '),
      failureSummary: node.failureSummary,
    })),
  };
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`délai de ${ms} ms dépassé`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
