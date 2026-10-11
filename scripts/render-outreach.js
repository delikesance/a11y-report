#!/usr/bin/env node
// Génère des .eml à partir des gabarits d'outreach/<variante>/ et de prospects/agences.csv.
// N'envoie jamais rien : les fichiers sont écrits dans out/ (ignoré par git).
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRecords, planOutput } from './outreach/render.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VARIANTS = ['freelance', 'studio', 'agence'];
const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const index = argv.indexOf(name);
  return index === -1 ? fallback : argv[index + 1];
};

const loadTemplates = (dir) => readdirSync(dir)
  .filter((name) => name.endsWith('.eml'))
  .sort()
  .map((name) => ({ name, text: readFileSync(join(dir, name), 'utf8') }));

const main = () => {
  const variant = argv[0];
  if (!VARIANTS.includes(variant)) throw new Error(`Variante attendue : ${VARIANTS.join(', ')}`);
  const csvPath = option('--csv', join(ROOT, 'prospects', 'agences.csv'));
  const senderPath = option('--expediteur', join(ROOT, 'outreach', 'expediteur.json'));
  const outDir = option('--out', join(ROOT, 'out', 'outreach'));
  const files = planOutput({
    rows: csvRecords(readFileSync(csvPath, 'utf8')),
    sender: JSON.parse(readFileSync(senderPath, 'utf8')),
    templates: loadTemplates(join(ROOT, 'outreach', variant)),
  });
  for (const { relPath, content } of files) {
    const target = join(outDir, variant, relPath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  console.log(`${files.length} fichier(s) .eml écrits dans ${join(outDir, variant)}`);
};

try {
  main();
} catch (error) {
  console.error(`Rendu refusé : ${error.message}`);
  process.exitCode = 1;
}
