import { parseRobots } from './robots.js';

const DEFAULTS = {
  depth: 2,
  maxPages: 50,
  sitemap: true,
  exclude: [],
  delayMs: 250,
  respectRobots: true,
  userAgent: 'a11y-report',
};
const TRACKING_PARAM = /^utm_/i;
const HTML_TYPE = /text\/html|application\/xhtml\+xml/i;
const LINK_HREF = /<a\b[^>]*?\shref\s*=\s*["']([^"']+)["']/gi;
const LOC = /<loc>\s*([^<\s]+)\s*<\/loc>/g;
const SITEMAP_LINE = /^\s*sitemap:\s*(\S+)/gim;
const OK = 200;

export async function crawl(startUrl, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const origin = new URL(startUrl).origin;
  const robotsBody = await readBody(`${origin}/robots.txt`, opts.userAgent);
  const robots = parseRobots(robotsBody);
  const excluded = opts.exclude.map(globToRegExp);
  const seen = new Set();
  const queue = [];
  const enqueue = (href, base, depth, reason) => {
    const url = normalizeUrl(href, base);
    if (!url || new URL(url).origin !== origin || seen.has(url)) return;
    seen.add(url);
    queue.push({ url, depth, reason });
  };

  enqueue(startUrl, startUrl, 0, 'start');
  if (opts.sitemap) {
    for (const loc of await discoverSitemapUrls(origin, robotsBody, opts.userAgent)) enqueue(loc, origin, 0, 'sitemap');
  }

  const pages = [];
  const skipped = [];
  let requested = false;
  for (let index = 0; index < queue.length; index++) {
    const entry = queue[index];
    const reason = refusalReason(entry.url, { ...opts, excluded, robots, pageCount: pages.length });
    if (reason) {
      skipped.push({ url: entry.url, reason });
      continue;
    }
    if (requested) await pause(opts.delayMs);
    requested = true;
    const res = await fetchResource(entry.url, opts.userAgent);
    if (res?.status !== OK) {
      skipped.push({ url: entry.url, reason: res ? `http-${res.status}` : 'unreachable' });
      continue;
    }
    if (!HTML_TYPE.test(res.type)) {
      skipped.push({ url: entry.url, reason: 'non-html' });
      continue;
    }
    pages.push({ url: entry.url, depth: entry.depth, reason: entry.reason });
    if (entry.depth < opts.depth) {
      for (const [, href] of res.body.matchAll(LINK_HREF)) enqueue(href, entry.url, entry.depth + 1, 'link');
    }
  }
  return { pages, skipped };
}

export function normalizeUrl(href, base) {
  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) url.searchParams.delete(key);
  }
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, '');
  return url.href;
}

function refusalReason(url, { excluded, robots, respectRobots, userAgent, maxPages, pageCount }) {
  const { pathname } = new URL(url);
  if (excluded.some((pattern) => pattern.test(pathname))) return 'exclude';
  if (respectRobots && !robots.isAllowed(url, userAgent)) return 'robots';
  if (pageCount >= maxPages) return 'cap';
  return null;
}

function globToRegExp(glob) {
  const body = glob
    .split('**')
    .map((part) => part.split('*').map(escapeRegExp).join('[^/]*'))
    .join('.*');
  return new RegExp(`^${body}$`);
}

const escapeRegExp = (text) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

async function discoverSitemapUrls(origin, robotsBody, userAgent) {
  const declared = [...robotsBody.matchAll(SITEMAP_LINE)].map(([, url]) => url);
  const candidates = new Set([`${origin}/sitemap.xml`, ...declared]);
  const urls = [];
  for (const candidate of candidates) urls.push(...(await readSitemap(candidate, userAgent, new Set())));
  return urls;
}

async function readSitemap(url, userAgent, visited) {
  if (visited.has(url)) return [];
  visited.add(url);
  const body = await readBody(url, userAgent);
  const locs = [...body.matchAll(LOC)].map(([, loc]) => loc);
  if (!body.includes('<sitemapindex')) return locs;
  const urls = [];
  for (const loc of locs) urls.push(...(await readSitemap(loc, userAgent, visited)));
  return urls;
}

async function readBody(url, userAgent) {
  const res = await fetchResource(url, userAgent);
  return res?.status === OK ? res.body : '';
}

async function fetchResource(url, userAgent) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
    const type = res.headers.get('content-type') ?? '';
    return { status: res.status, type, body: await res.text() };
  } catch {
    return null;
  }
}

const pause = (ms) => (ms > 0 ? new Promise((resolvePause) => setTimeout(resolvePause, ms)) : undefined);
