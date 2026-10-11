import { parseArgs } from 'node:util';
import { DEFAULT_VIEWPORT, parseViewport } from '../viewport.js';
import { FORMATS } from '../formats/index.js';
import { parseThresholdsFlags, readThresholdsFile } from '../ci.js';
import { definedEntries, parseIntOption, splitList } from './values.js';

export const OUTPUT_FORMATS = ['pdf', ...FORMATS];
const CI_FORMATS = ['text', 'github'];
const HTTP_PROTOCOLS = ['http:', 'https:'];
const DEFAULT_FORMAT = 'pdf';
const CONCURRENCY = { flag: '--concurrency', min: 1, max: 16, example: 4 };
const CRAWL_DEPTH = { flag: '--crawl-depth', min: 0, max: 10, example: 2 };
const MAX_PAGES = { flag: '--max-pages', min: 1, max: 1000, example: 50 };
const DELAY = { flag: '--delay', min: 0, max: 60000, example: 500 };
const CRAWL_ONLY_FLAGS = ['crawl-depth', 'max-pages', 'sitemap', 'no-sitemap', 'exclude', 'delay'];
const CI_ONLY_FLAGS = ['seuil', 'seuils-fichier', 'ci-format'];

const OPTIONS = {
  client: { type: 'string' },
  agency: { type: 'string' },
  logo: { type: 'string' },
  color: { type: 'string' },
  contact: { type: 'string' },
  taux: { type: 'string' },
  telephone: { type: 'string' },
  validite: { type: 'string' },
  out: { type: 'string' },
  format: { type: 'string', multiple: true },
  branding: { type: 'string' },
  'from-json': { type: 'string' },
  'save-json': { type: 'string' },
  concurrency: { type: 'string' },
  viewport: { type: 'string', multiple: true },
  crawl: { type: 'boolean' },
  'crawl-depth': { type: 'string' },
  'max-pages': { type: 'string' },
  sitemap: { type: 'boolean' },
  'no-sitemap': { type: 'boolean' },
  exclude: { type: 'string', multiple: true },
  delay: { type: 'string' },
  ci: { type: 'boolean' },
  seuil: { type: 'string' },
  'seuils-fichier': { type: 'string' },
  'ci-format': { type: 'string' },
  help: { type: 'boolean', short: 'h' },
};

function parseHttpUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`URL invalide : ${raw}`);
  }
  if (!HTTP_PROTOCOLS.includes(url.protocol)) {
    throw new Error(`URL invalide (http ou https attendu) : ${raw}`);
  }
  return url.href;
}

function assertNoOrphanFlags(values, parent, flags) {
  const orphan = flags.find((flag) => values[flag] !== undefined);
  if (orphan && !values[parent]) throw new Error(`--${orphan} nécessite --${parent}.`);
}

function parseFormats(values = []) {
  const formats = values.length > 0 ? splitList(values) : [DEFAULT_FORMAT];
  const unknown = formats.find((format) => !OUTPUT_FORMATS.includes(format));
  if (unknown) {
    throw new Error(`Format inconnu : ${unknown} (formats acceptés : ${OUTPUT_FORMATS.join(', ')}). Exemple : --format json`);
  }
  return [...new Set(formats)];
}

function parseViewports(values = []) {
  if (values.length === 0) return [DEFAULT_VIEWPORT];
  return splitList(values).map((value) => parseViewport(value));
}

function parseCrawl(values) {
  assertNoOrphanFlags(values, 'crawl', CRAWL_ONLY_FLAGS);
  if (!values.crawl) return null;
  return definedEntries({
    depth: parseIntOption(values['crawl-depth'], CRAWL_DEPTH),
    maxPages: parseIntOption(values['max-pages'], MAX_PAGES),
    sitemap: values['no-sitemap'] ? false : values.sitemap,
    exclude: values.exclude && splitList(values.exclude),
    delayMs: parseIntOption(values.delay, DELAY),
  });
}

function parseThresholds(values) {
  const fromFile = values['seuils-fichier'] ? readThresholdsFile(values['seuils-fichier']) : {};
  const fromFlag = values.seuil ? parseThresholdsFlags(values.seuil) : {};
  return { ...fromFile, ...fromFlag };
}

function parseCi(values) {
  assertNoOrphanFlags(values, 'ci', CI_ONLY_FLAGS);
  if (!values.ci) return null;
  const format = values['ci-format'] ?? 'text';
  if (!CI_FORMATS.includes(format)) throw new Error(`Format CI inconnu : ${format} (text ou github attendu). Exemple : --ci-format github`);
  return { thresholds: parseThresholds(values), format };
}

function assertFromJsonAlone(values, urls) {
  if (!values['from-json']) return;
  if (urls.length > 0 || values.crawl) {
    throw new Error('--from-json ne peut pas être combiné à des URL ni à --crawl. Exemple : a11y-report --from-json scan.json');
  }
}

export function parseCliArgs(argv) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    throw new Error(`Arguments invalides (${error.message})`);
  }
  const { values, positionals } = parsed;
  const urls = positionals.map(parseHttpUrl);
  assertFromJsonAlone(values, urls);
  return {
    urls,
    options: values,
    settings: {
      formats: parseFormats(values.format),
      concurrency: parseIntOption(values.concurrency, CONCURRENCY) ?? 1,
      viewports: parseViewports(values.viewport),
      crawl: parseCrawl(values),
      ci: parseCi(values),
    },
  };
}
