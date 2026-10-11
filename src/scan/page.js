import AxeBuilder from '@axe-core/playwright';
import { withRetries } from './retry.js';
import { WCAG_TAGS, toViolation } from './axe.js';
import {
  MAX_REDIRECTS,
  failureCause,
  isRetryableError,
  isRetryableStatus,
  isTimeout,
  skipCause,
} from './causes.js';

export async function scanPage(browser, url, settings) {
  const { page } = await withRetries(() => attemptPage(browser, url, settings), settings);
  return page;
}

async function attemptPage(browser, url, settings) {
  const context = await browser.newContext();
  try {
    return await withTimeout(auditUrl(context, url, settings), settings.timeoutMs);
  } catch (error) {
    return { page: failedPage(url, failureCause(error)), retryable: isRetryableError(error) };
  } finally {
    await context.close();
  }
}

async function auditUrl(context, url, settings) {
  const playwrightPage = await context.newPage();
  const response = await playwrightPage.goto(url, { waitUntil: 'load', timeout: settings.timeoutMs });
  const redirects = redirectChain(response);
  const status = response?.status() ?? null;
  const contentType = response?.headers()['content-type'] ?? null;
  const base = { url, finalUrl: playwrightPage.url(), status, redirects, contentType };

  const cause = skipCause({ status, contentType, redirectCount: redirects.length });
  if (cause) return { page: { ...failedPage(url, cause), ...base }, retryable: isRetryableStatus(status) };
  if (await isEmptyPage(playwrightPage)) return { page: { ...failedPage(url, 'page vide'), ...base }, retryable: false };

  const results = await new AxeBuilder({ page: playwrightPage }).withTags(WCAG_TAGS).analyze();
  const page = {
    ...base,
    error: null,
    audited: true,
    title: await playwrightPage.title(),
    violations: results.violations.map(toViolation),
    passes: results.passes.length,
    incomplete: results.incomplete.map(toViolation),
  };
  return { page, retryable: false };
}

function redirectChain(response) {
  const chain = [];
  let request = response?.request().redirectedFrom();
  while (request && chain.length <= MAX_REDIRECTS) {
    chain.unshift(request.url());
    request = request.redirectedFrom();
  }
  return chain;
}

const isEmptyPage = (playwrightPage) =>
  playwrightPage.evaluate(() => !document.body || (document.body.children.length === 0 && !document.body.textContent.trim()));

function failedPage(url, error) {
  return {
    url,
    finalUrl: url,
    status: null,
    redirects: [],
    contentType: null,
    error,
    audited: false,
    title: '',
    violations: [],
    passes: 0,
    incomplete: [],
  };
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`délai de ${ms} ms dépassé`);
      error.name = 'TimeoutError';
      reject(error);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
