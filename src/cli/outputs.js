import { accessSync, constants, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { renderFormat } from '../formats/index.js';

const DEFAULT_BASENAME = 'rapport';

const isDirectory = (path) => existsSync(path) && statSync(path).isDirectory();
const isDirectoryPath = (path) => path.endsWith('/') || isDirectory(path);
const isDirectoryOutput = (out, formats) => formats.length > 1 || isDirectoryPath(out);

function outputDirectory(out) {
  mkdirSync(out, { recursive: true });
  return out;
}

export function outputPathFor(format, { out, formats }) {
  const fileName = `${DEFAULT_BASENAME}.${format}`;
  if (!out) return fileName;
  if (isDirectoryOutput(out, formats)) return join(outputDirectory(out), fileName);
  return out;
}

function checkedDirectory(out, formats) {
  if (!isDirectoryOutput(out, formats)) return dirname(out);
  return existsSync(out) ? out : dirname(out);
}

export function assertOutWritable(out, formats) {
  if (!out) return;
  const directory = checkedDirectory(out, formats);
  if (!isDirectory(directory)) throw new Error(`Dossier de sortie introuvable : ${directory}. Exemple : --out ./rapports`);
  try {
    accessSync(directory, constants.W_OK);
  } catch {
    throw new Error(`Dossier de sortie non accessible en écriture : ${directory}`);
  }
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
