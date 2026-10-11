#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUT_DIR, ensureOutDir } from './dod/lib.js';
import { testChecks } from './dod/tests-checks.js';
import { quoteChecks } from './dod/quote-checks.js';
import { siteChecks } from './dod/site-checks.js';

const HEADER = ['ID', 'Statut', 'Contrôle', 'Preuve'];
const REPORT_PATH = join(OUT_DIR, 'dod.json');

const pad = (cell, width) => cell.padEnd(width);

export function renderTable(checks) {
  const rows = checks.map(({ id, status, name, evidence }) => [id, status, name, evidence]);
  const widths = HEADER.map((title, column) => Math.max(title.length, ...rows.map((row) => row[column].length)));
  const line = (cells) => cells.map((cell, column) => pad(cell, widths[column])).join('  ').trimEnd();
  return [line(HEADER), line(widths.map((width) => '-'.repeat(width))), ...rows.map(line)].join('\n');
}

const failureDetails = (checks) =>
  checks
    .filter(({ status, output }) => status === 'FAIL' && output)
    .map(({ id, output }) => `--- ${id}\n${output}`)
    .join('\n');

async function main() {
  ensureOutDir();
  const tests = await testChecks();
  const [quotesAndPdf, site] = await Promise.all([quoteChecks(), siteChecks()]);
  const checks = [...tests, ...quotesAndPdf, ...site];
  const ok = checks.every(({ status }) => status !== 'FAIL');
  writeFileSync(REPORT_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), ok, checks }, null, 2)}\n`);
  process.stdout.write(`${renderTable(checks)}\n`);
  const details = failureDetails(checks);
  if (details) process.stdout.write(`\n${details}\n`);
  process.stdout.write(`\nRapport : ${REPORT_PATH} (${ok ? 'OK' : 'ÉCHEC'})\n`);
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
