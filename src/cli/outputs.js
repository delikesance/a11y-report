import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { renderFormat } from '../formats/index.js';

const DEFAULT_BASENAME = 'rapport';

const isDirectoryPath = (path) => path.endsWith('/') || (existsSync(path) && statSync(path).isDirectory());

function outputDirectory(out) {
  if (extname(out)) throw new Error(`--out doit être un dossier quand plusieurs formats sont demandés (reçu : ${out}). Exemple : --out ./rapports`);
  mkdirSync(out, { recursive: true });
  return out;
}

export function outputPathFor(format, { out, formats }) {
  const fileName = `${DEFAULT_BASENAME}.${format}`;
  if (!out) return fileName;
  if (formats.length > 1) return join(outputDirectory(out), fileName);
  return isDirectoryPath(out) ? join(outputDirectory(out), fileName) : out;
}

async function writeFormat(format, scan, { branding, path }) {
  if (format !== 'pdf') return writeFileSync(path, renderFormat(format, scan, { branding }));
  const { buildReportHtml, renderPdf } = await import('../report.js');
  await renderPdf(buildReportHtml(scan, branding), path);
}

export async function writeOutputs(scan, { formats, out, branding }) {
  const written = [];
  for (const format of formats) {
    const path = outputPathFor(format, { out, formats });
    await writeFormat(format, scan, { branding, path });
    written.push(path);
  }
  return written;
}
