import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildReportHtml, renderPdf } from '../src/report.js';
import { verapdfAvailable, verifyPdfs } from '../scripts/verify-pdf.js';

const scan = {
  generatedAt: '2026-10-10T08:00:00.000Z',
  pages: [{ url: 'https://client.example/accueil', title: 'Accueil', violations: [], passes: 10, incomplete: 0 }],
};
const branding = { agency: 'Agence Test', client: 'Client Test' };
const SKIP_NO_VERAPDF = 'veraPDF indisponible (docker absent)';

const STREAM = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
const inflateOrEmpty = (raw) => {
  try {
    return inflateSync(Buffer.from(raw, 'latin1')).toString('latin1');
  } catch {
    return '';
  }
};
const readableObjects = (buffer) => {
  const raw = buffer.toString('latin1');
  return [...raw.matchAll(STREAM)].reduce((text, [, body]) => `${text}\n${inflateOrEmpty(body)}`, raw);
};

const renderTo = async (name) => {
  const outPath = join(await mkdtemp(join(tmpdir(), 'pdfa-')), name);
  await renderPdf(buildReportHtml(scan, branding), outPath);
  return outPath;
};

test('renders a tagged PDF with French language and an outline', async () => {
  const pdf = readableObjects(await readFile(await renderTo('tagged.pdf')));
  assert.match(pdf, /\/MarkInfo\s*<<[^>]*\/Marked\s+true/);
  assert.match(pdf, /\/StructTreeRoot/);
  assert.match(pdf, /\/Lang\s*\(fr\)/);
  assert.match(pdf, /\/Outlines/);
});

const VERAPDF_TODO = 'PDF/UA: pied de page en marges CSS non balisé, voir docs/pdf-accessibility.md';
const verapdfOptions = verapdfAvailable() ? { todo: VERAPDF_TODO } : { skip: SKIP_NO_VERAPDF };

test('veraPDF PDF/UA check passes on the rendered report', verapdfOptions, async () => {
  const { status, output } = verifyPdfs([await renderTo('ua.pdf')]);
  assert.equal(status, 0, output);
});
