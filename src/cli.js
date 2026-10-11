#!/usr/bin/env node
import { writeFileSync, realpathSync } from 'node:fs';
import { messageOf } from './error-message.js';
import { fileURLToPath } from 'node:url';
import { EXIT_OK, evaluateThresholds } from './ci.js';
import { parseCliArgs } from './cli/options.js';
import { loadBranding } from './cli/branding.js';
import { assertOutWritable, writeOutputs } from './cli/outputs.js';
import { USAGE } from './cli/usage.js';
import { readJson } from './cli/values.js';
import { detectTerminal } from './cli/terminal.js';
import { summaryLines } from './cli/summary.js';

export { parseCliArgs } from './cli/options.js';
export { loadBranding } from './cli/branding.js';

const EXIT_USAGE = 1;

const progress = (message) => process.stderr.write(`${message}\n`);
const silent = () => {};
const errorLine = (term, message) => `${term.symbol('fail')} ${term.paint('red', 'Erreur')} : ${message}`;

async function crawlTargets(urls, crawlSettings, log) {
  const { crawl } = await import('./crawl.js');
  const found = [];
  for (const url of urls) {
    const { pages } = await crawl(url, crawlSettings);
    found.push(...pages.map((page) => page.url));
  }
  const targets = [...new Set(found)];
  log(`Exploration : ${targets.length} page(s) découverte(s).`);
  return targets;
}

async function obtainScan(urls, { options, settings, log }) {
  if (options['from-json']) return readJson(options['from-json']);
  const targets = settings.crawl ? await crawlTargets(urls, settings.crawl, log) : urls;
  log(`Analyse de ${targets.length} page(s)...`);
  const { scanPages } = await import('./scan.js');
  return scanPages(targets, { concurrency: settings.concurrency, viewports: settings.viewports });
}

function runCi(scan, { thresholds, format }) {
  const { lines, exitCode } = evaluateThresholds(scan, { ...thresholds, format });
  for (const line of lines) process.stdout.write(`${line}\n`);
  return exitCode;
}

async function run(argv, term) {
  const { urls, options, settings } = parseCliArgs(argv);
  if (options.help) {
    process.stdout.write(USAGE);
    return EXIT_OK;
  }
  if (urls.length === 0 && !options['from-json']) {
    process.stderr.write(`${errorLine(term, 'aucune URL fournie.')}\n\n${USAGE}`);
    return EXIT_USAGE;
  }

  assertOutWritable(options.out, settings.formats);
  const branding = loadBranding(options);
  const log = settings.ci ? silent : progress;
  const scan = await obtainScan(urls, { options, settings, log });
  if (options['save-json']) writeFileSync(options['save-json'], JSON.stringify(scan, null, 2));
  for (const line of summaryLines(scan, term)) log(line);

  log('Génération des rapports...');
  for (const path of await writeOutputs(scan, { formats: settings.formats, out: options.out, branding })) {
    log(`Rapport écrit : ${path}`);
  }
  return settings.ci ? runCi(scan, settings.ci) : EXIT_OK;
}

async function main(argv) {
  const term = detectTerminal(process.stderr, { argv });
  try {
    return await run(argv, term);
  } catch (error) {
    process.stderr.write(`${errorLine(term, messageOf(error))}\n`);
    return EXIT_USAGE;
  }
}

const isEntrypoint = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) process.exitCode = await main(process.argv.slice(2));
