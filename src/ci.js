import { readFileSync } from 'node:fs';
import { computePageScore } from './report/score.js';
import { IMPACT_FR } from './rules-fr.js';

export const EXIT_OK = 0;
export const EXIT_THRESHOLD = 2;
export const EXIT_UNAUDITED = 3;

const DEFAULTS = {
  maxCritical: 0,
  maxSerious: 0,
  maxModerate: Infinity,
  maxMinor: Infinity,
  minScore: 0,
  failOnUnaudited: false,
  format: 'text',
};

const IMPACT_LIMITS = [
  ['critical', 'maxCritical'],
  ['serious', 'maxSerious'],
  ['moderate', 'maxModerate'],
  ['minor', 'maxMinor'],
];

const THRESHOLD_OPTIONS = {
  critical: 'maxCritical',
  serious: 'maxSerious',
  moderate: 'maxModerate',
  minor: 'maxMinor',
  score: 'minScore',
  unaudited: 'failOnUnaudited',
};

const escapeAnnotation = (text) => text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

const ANNOTATION_PREFIX = '::error title=Accessibilité::';

const FORMATTERS = {
  text: (failure) => failure.message,
  github: (failure) => `${ANNOTATION_PREFIX}${escapeAnnotation(failure.message)}`,
};

function validateThreshold(key, value) {
  const valid = key === 'unaudited' ? typeof value === 'boolean' : Number.isFinite(value) && value >= 0;
  if (!valid) throw new Error(`Seuil invalide : ${key}=${value}`);
  return value;
}

export function normalizeThresholds(raw) {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => {
      const option = THRESHOLD_OPTIONS[key];
      if (!option) throw new Error(`Seuil inconnu : ${key}`);
      return [option, validateThreshold(key, value)];
    }),
  );
}

function parseFlagValue(key, raw) {
  if (key === 'unaudited') return raw === 'true' || raw === 'false' ? raw === 'true' : raw;
  const number = Number(raw);
  return raw && Number.isFinite(number) ? number : raw;
}

function splitThresholdPair(pair) {
  const separator = pair.indexOf('=');
  const key = pair.slice(0, separator === -1 ? undefined : separator).trim();
  if (separator === -1) throw new Error(`Seuil invalide : "${key}" (attendu : ${key}=0)`);
  return [key, pair.slice(separator + 1).trim()];
}

export function parseThresholdsFlags(text) {
  const raw = {};
  for (const pair of text.split(',')) {
    const [key, value] = splitThresholdPair(pair);
    if (Object.hasOwn(raw, key)) throw new Error(`Seuil en double : ${key}`);
    raw[key] = parseFlagValue(key, value);
  }
  return normalizeThresholds(raw);
}

export function readThresholdsFile(path) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`Fichier de seuils illisible : ${path}`);
  }
  return normalizeThresholds(raw);
}

const violationsOf = (page) => page.violations ?? [];

function countNodes(scan, impact) {
  return scan.pages
    .flatMap(violationsOf)
    .filter((violation) => violation.impact === impact)
    .reduce((total, violation) => total + violation.nodes.length, 0);
}

function impactFailures(scan, thresholds) {
  return IMPACT_LIMITS.flatMap(([impact, option]) => {
    const count = countNodes(scan, impact);
    const limit = thresholds[option];
    if (count <= limit) return [];
    return [{ message: `${count} occurrence(s) ${IMPACT_FR[impact]} (seuil ${limit})` }];
  });
}

function scoreFailures(scan, { minScore }) {
  return scan.pages.flatMap((page) => {
    const score = computePageScore(page);
    if (score === null || score >= minScore) return [];
    return [{ message: `Score ${score}/100 (seuil ${minScore}) : ${page.url}` }];
  });
}

function unauditedFailures(scan) {
  return scan.pages
    .filter((page) => page.error)
    .map((page) => ({ message: `Page non auditée : ${page.url} (${page.error})` }));
}

function exitCodeFor(failures, unaudited) {
  if (failures.length > 0) return EXIT_THRESHOLD;
  if (unaudited.length > 0) return EXIT_UNAUDITED;
  return EXIT_OK;
}

function formatLines({ passed, failures, unaudited, format }) {
  const formatFailure = FORMATTERS[format];
  if (!formatFailure) throw new Error(`Format CI inconnu : ${format}`);
  const summary = passed ? 'Seuils CI respectés' : 'Seuils CI non respectés';
  return [summary, ...[...failures, ...unaudited].map(formatFailure)];
}

export function evaluateThresholds(scan, options = {}) {
  const { format, ...thresholds } = { ...DEFAULTS, ...options };
  const failures = [...impactFailures(scan, thresholds), ...scoreFailures(scan, thresholds)];
  const unaudited = thresholds.failOnUnaudited ? unauditedFailures(scan) : [];
  const exitCode = exitCodeFor(failures, unaudited);
  const passed = exitCode === EXIT_OK;
  return { passed, exitCode, lines: formatLines({ passed, failures, unaudited, format }) };
}
