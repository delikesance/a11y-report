import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { DEFAULT_ACCENT, DEFAULT_PRIMARY, brandColor, escapeHtml } from './report/shared.js';
import { collectProblems, computeImpactWeightedScore, computeQuote } from './report/model.js';
import { buildFontCss } from './report/fonts.js';
import { renderCover } from './report/cover.js';
import { renderSummary } from './report/summary.js';
import { renderDetails } from './report/details.js';
import { renderQuote } from './report/quote.js';
import { renderPageTable, renderLimits } from './report/appendix.js';

const STYLE_MODULES = ['base', 'cover', 'summary', 'details', 'quote', 'appendix'];
const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

const readStyle = (name) => readFileSync(new URL(`./report/styles/${name}.css`, import.meta.url), 'utf8');
const STYLES = STYLE_MODULES.map(readStyle).join('\n');
const FONT_CSS = buildFontCss();

const cssString = (text) => JSON.stringify(text).replace(/</g, '\\3c ');

function renderRootVariables(scan, branding) {
  const footerLeft = `${branding.client} · ${scan.pages.length} pages scannées`;
  return `:root{--primary:${brandColor(branding.primaryColor, DEFAULT_PRIMARY)};--accent:${brandColor(branding.accentColor, DEFAULT_ACCENT)};--footer-left:${cssString(footerLeft)};}`;
}

export function buildReportHtml(scan, branding) {
  const problems = collectProblems(scan);
  const score = computeImpactWeightedScore(problems);
  const quote = computeQuote(problems, branding.hourlyRate);
  const date = branding.date ?? DATE_FORMAT.format(new Date(scan.generatedAt));
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(`Rapport d'accessibilité - ${branding.client}`)}</title>
<style>${FONT_CSS}
${renderRootVariables(scan, branding)}
${STYLES}</style>
</head>
<body>
${renderCover(scan, branding, date, problems, score)}
${renderSummary(problems, score, quote, branding)}
<div class="flow">${renderDetails(problems)}</div>
${renderQuote(quote, problems, branding)}
${renderPageTable(scan)}
${renderLimits()}
</body>
</html>`;
}

export async function renderPdf(html, outPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}
