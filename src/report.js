import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { makePdfUaCompliant } from './pdf-accessibility.js';
import { chromium } from 'playwright';
import { DEFAULT_ACCENT, DEFAULT_PRIMARY, brandColor, escapeHtml } from './report/shared.js';
import { collectProblems, computeImpactWeightedScore } from './report/model.js';
import { computeQuote } from './report/quote-calc.js';
import { buildFontCss } from './report/fonts.js';
import { renderCover } from './report/cover.js';
import { renderSummary } from './report/summary.js';
import { renderDetails } from './report/details.js';
import { renderQuote } from './report/quote.js';
import { renderPageTable, renderLimits } from './report/appendix.js';
import { renderManualReview } from './report/manual-review.js';
import { renderMethodology } from './report/methodology.js';

const STYLE_MODULES = ['base', 'cover', 'summary', 'details', 'quote', 'appendix', 'methodology'];
const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

const readStyle = (name) => readFileSync(new URL(`./report/styles/${name}.css`, import.meta.url), 'utf8');
const STYLES = STYLE_MODULES.map(readStyle).join('\n');
const FONT_CSS = buildFontCss();

const renderRootVariables = (branding) =>
  `:root{--primary:${brandColor(branding.primaryColor, DEFAULT_PRIMARY)};--accent:${brandColor(branding.accentColor, DEFAULT_ACCENT)};}`;

export function buildReportHtml(scan, branding) {
  const problems = collectProblems(scan);
  const score = computeImpactWeightedScore(problems);
  const quote = computeQuote(problems, branding);
  const date = branding.date ?? DATE_FORMAT.format(new Date(scan.generatedAt));
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(`Rapport d'accessibilité - ${branding.client}`)}</title>
<style>${FONT_CSS}
${renderRootVariables(branding)}
${STYLES}</style>
</head>
<body>
${renderCover(scan, branding, date, problems, score)}
${renderSummary(problems, score, quote, branding)}
<div class="flow">${renderDetails(problems)}</div>
${renderQuote(quote, problems, branding)}
${renderPageTable(scan)}
${renderManualReview(scan)}
${renderLimits()}
${renderMethodology(scan)}
</body>
</html>`;
}

export async function renderPdf(html, outPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
      outline: true,
    });
    await writeFile(outPath, makePdfUaCompliant(pdf));
  } finally {
    await browser.close();
  }
}
