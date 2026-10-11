import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_DIR = join(ROOT_DIR, 'site');
const SOURCES_PATH = join(ROOT_DIR, 'docs', 'sources.md');
const REF_PATTERN = /\b(?:href|src)="([^"]+)"/g;
const ID_PATTERN = /\sid="([^"]+)"/g;
const EXTERNAL_PATTERN = /^https?:\/\//;
const CSS_URL_PATTERN = /url\("?([^")]+)"?\)/g;
const SOURCE_URL_PATTERN = /https?:\/\/[^\s)>"]+/g;
const HEAD_TIMEOUT_MS = 10000;

export const extractRefs = (html) => [...html.matchAll(REF_PATTERN)].map((match) => match[1]);

const idsOf = (html) => new Set([...html.matchAll(ID_PATTERN)].map((match) => match[1]));

const isExternal = (ref) => EXTERNAL_PATTERN.test(ref);

export function checkPage(siteDir, pageName) {
  const pagePath = join(siteDir, pageName);
  const html = readFileSync(pagePath, 'utf8');
  const broken = [];
  for (const ref of extractRefs(html)) {
    if (isExternal(ref) || ref.startsWith('mailto:')) continue;
    const [pathPart, fragment] = ref.split('#');
    const targetPath = pathPart ? resolve(dirname(pagePath), pathPart) : pagePath;
    if (!existsSync(targetPath)) {
      broken.push(`${pageName} -> ${ref} (fichier absent)`);
      continue;
    }
    if (fragment && !idsOf(readFileSync(targetPath, 'utf8')).has(fragment)) {
      broken.push(`${pageName} -> ${ref} (identifiant absent)`);
    }
  }
  return { broken, externals: extractRefs(html).filter(isExternal) };
}

export function checkCss(cssPath) {
  const css = readFileSync(cssPath, 'utf8');
  return [...css.matchAll(CSS_URL_PATTERN)]
    .map((match) => match[1])
    .filter((ref) => !isExternal(ref) && !existsSync(resolve(dirname(cssPath), ref)))
    .map((ref) => `${cssPath} -> ${ref} (fichier absent)`);
}

export function checkSite(siteDir = SITE_DIR) {
  const pages = readdirSync(siteDir).filter((name) => name.endsWith('.html'));
  const results = pages.map((page) => checkPage(siteDir, page));
  const cssPaths = readdirSync(join(siteDir, 'assets'))
    .filter((name) => name.endsWith('.css'))
    .map((name) => join(siteDir, 'assets', name));
  return {
    pages: pages.length,
    broken: [...results.flatMap((result) => result.broken), ...cssPaths.flatMap(checkCss)],
    externals: [...new Set(results.flatMap((result) => result.externals))],
  };
}

export async function verifyHead(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: 'HEAD',
    redirect: 'follow',
    signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
  });
  return response.status < 400;
}

export function sourceUrls(sourcesPath = SOURCES_PATH) {
  return new Set(readFileSync(sourcesPath, 'utf8').match(SOURCE_URL_PATTERN) ?? []);
}

async function main() {
  const { pages, broken, externals } = checkSite();
  const cited = sourceUrls();
  const toVerify = externals.filter((url) => cited.has(url));
  const headFailures = [];
  if (process.argv.includes('--verify-sources')) {
    for (const url of toVerify) {
      if (!(await verifyHead(url))) headFailures.push(url);
    }
  }
  console.log(`Pages : ${pages}, liens externes : ${externals.length}, cités dans sources.md : ${toVerify.length}`);
  for (const line of [...broken, ...headFailures]) console.log(`KO ${line}`);
  process.exitCode = broken.length + headFailures.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
