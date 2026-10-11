#!/usr/bin/env node
import { readdirSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildReportHtml, renderPdf } from '../src/report.js';
import { buildCorpora } from './layout-lint/corpus.js';
import { findLowContrast } from './layout-lint/contrast-check.js';
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX, probeLayout } from './layout-lint/dom-probe.js';
import { findEmptyPages, measurePages } from './layout-lint/pixels.js';

const BRANDINGS_DIR = new URL('../design/brandings/', import.meta.url);

const loadBrandings = () =>
  readdirSync(BRANDINGS_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ name: name.replace('.json', ''), branding: JSON.parse(readFileSync(new URL(name, BRANDINGS_DIR), 'utf8')) }));

async function lintDom(browser, html) {
  const page = await browser.newPage({ viewport: { width: PAGE_WIDTH_PX, height: Math.round(PAGE_HEIGHT_PX) } });
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    const { findings, samples } = await page.evaluate(probeLayout, { pageHeight: PAGE_HEIGHT_PX });
    return [...findings, ...findLowContrast(samples)];
  } finally {
    await page.close();
  }
}

async function lintPixels(html) {
  const dir = mkdtempSync(join(tmpdir(), 'layout-lint-pdf-'));
  try {
    const pdfPath = join(dir, 'report.pdf');
    await renderPdf(html, pdfPath);
    return findEmptyPages(measurePages(readFileSync(pdfPath)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const dedupe = (defects) => [...new Map(defects.map((defect) => [`${defect.page}|${defect.kind}|${defect.detail}`, defect])).values()];

export async function lintLayout() {
  const corpora = Object.entries(buildCorpora());
  const browser = await chromium.launch();
  try {
    const results = [];
    for (const { name, branding } of loadBrandings()) {
      for (const [corpus, scan] of corpora) {
        const html = buildReportHtml(scan, branding);
        const defects = [...(await lintDom(browser, html)), ...(await lintPixels(html))];
        results.push(...dedupe(defects).map((defect) => ({ branding: name, corpus, ...defect })));
      }
    }
    return results;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const defects = await lintLayout();
  process.stdout.write(`${JSON.stringify(defects, null, 2)}\n`);
  process.exit(defects.length > 0 ? 1 : 0);
}
