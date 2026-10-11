import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { IMPACT_FR, IMPACT_ORDER } from './rules-fr.js';
import {
  DEFAULT_ACCENT,
  DEFAULT_PRIMARY,
  EXAMPLES_PER_PROBLEM,
  LIMITS_PARAGRAPHS,
  TOP_PRIORITIES,
  badge,
  brandColor,
  escapeHtml,
  formatDuration,
  renderLogo,
  truncate,
} from './report/shared.js';
import { collectProblems, computeImpactWeightedScore, totalFixMinutes } from './report/model.js';

const css = readFileSync(new URL('./report.css', import.meta.url), 'utf8');

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const FOOTER_TEMPLATE =
  '<div style="font-size:9px;width:100%;text-align:center;color:#666;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></div>';

function renderCover(scan, branding, date) {
  return `<section class="page cover">
  ${renderLogo(branding.logoPath, branding.agency)}
  <p class="agency">${escapeHtml(branding.agency)}</p>
  <h1>Rapport d'accessibilité numérique</h1>
  <p class="client">${escapeHtml(branding.client)}</p>
  <dl class="meta">
    <dt>Date</dt><dd>${escapeHtml(date)}</dd>
    <dt>Pages scannées</dt><dd>${scan.pages.length}</dd>
  </dl>
  <p class="contact">${escapeHtml(branding.contact)}</p>
</section>`;
}

function renderImpactBars(problems) {
  return IMPACT_ORDER.map((impact) => {
    const count = problems.filter((problem) => problem.impact === impact).length;
    const percent = problems.length ? Math.round((count / problems.length) * 100) : 0;
    return `<li class="bar-row"><span>${escapeHtml(IMPACT_FR[impact])}</span><span class="track"><span class="fill ${impact}" style="width:${percent}%"></span></span><span>${count}</span></li>`;
  }).join('');
}

function renderTopPriorities(problems) {
  return problems
    .slice(0, TOP_PRIORITIES)
    .map((problem) => `<li>${escapeHtml(problem.rule.titre)} ${badge(problem.impact)}</li>`)
    .join('');
}

function renderSummary(problems) {
  const score = computeImpactWeightedScore(problems);
  return `<section class="page">
  <h2>Synthèse</h2>
  <div class="score-box"><span class="score">${score}</span><span>/100</span></div>
  <ul class="bars">${renderImpactBars(problems)}</ul>
  <h3>Top ${TOP_PRIORITIES} des priorités</h3>
  <ol class="top">${renderTopPriorities(problems)}</ol>
</section>`;
}

function renderFixTime(problems) {
  const minutes = Math.round(totalFixMinutes(problems));
  return `<section>
  <h2>Estimation du temps de correction</h2>
  <p class="time">${formatDuration(minutes)}</p>
  <p>Estimation : temps moyen par occurrence multiplié par le nombre d'occurrences détectées.</p>
</section>`;
}

function renderExamples(problem) {
  return problem.nodes
    .slice(0, EXAMPLES_PER_PROBLEM)
    .map(
      (node) =>
        `<li><code class="snippet">${escapeHtml(truncate(node.html))}</code><span class="selector">${escapeHtml(node.target)}</span></li>`,
    )
    .join('');
}

function renderProblem(problem, index) {
  return `<article class="problem">
  <h3>${index + 1}. ${escapeHtml(problem.rule.titre)} ${badge(problem.impact)}</h3>
  <p>${escapeHtml(problem.rule.pourquoi)}</p>
  <p class="facts">Occurrences : ${problem.occurrences} · Critère RGAA : ${escapeHtml(problem.rule.rgaa)}</p>
  <h4>Pages concernées</h4>
  <ul>${problem.pages.map((page) => `<li>${escapeHtml(page.url)}</li>`).join('')}</ul>
  <h4>Exemples</h4>
  <ul class="examples">${renderExamples(problem)}</ul>
  <h4>Correction</h4>
  <p>${escapeHtml(problem.rule.correction)}</p>
  <div class="before-after">
    <pre class="before">${escapeHtml(problem.rule.avant)}</pre>
    <pre class="after">${escapeHtml(problem.rule.apres)}</pre>
  </div>
  <p><a href="${escapeHtml(problem.helpUrl)}">Documentation détaillée</a></p>
</article>`;
}

function renderDetails(problems) {
  return `<section><h2>Détail par problème</h2>${problems.map(renderProblem).join('')}</section>`;
}

function renderPageRow(page) {
  const status = page.error ? `Injoignable (${escapeHtml(page.error)})` : 'Scannée';
  return `<tr><td>${escapeHtml(page.url)}</td><td>${escapeHtml(page.title)}</td><td>${page.violations.length}</td><td>${page.passes}</td><td>${page.incomplete}</td><td>${status}</td></tr>`;
}

function renderPageTable(scan) {
  return `<section class="page"><h2>Résultats par page</h2>
  <table>
    <thead><tr><th>Page</th><th>Titre</th><th>Problèmes</th><th>Réussites</th><th>À vérifier</th><th>Statut</th></tr></thead>
    <tbody>${scan.pages.map(renderPageRow).join('')}</tbody>
  </table>
</section>`;
}

function renderLimits() {
  const paragraphs = LIMITS_PARAGRAPHS.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  return `<section class="page limits"><h2>Limites de l'audit automatique</h2>${paragraphs}</section>`;
}

export function buildReportHtml(scan, branding) {
  const problems = collectProblems(scan);
  const date = branding.date ?? DATE_FORMAT.format(new Date(scan.generatedAt));
  const colors = `:root{--primary:${brandColor(branding.primaryColor, DEFAULT_PRIMARY)};--accent:${brandColor(branding.accentColor, DEFAULT_ACCENT)};}`;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(`Rapport d'accessibilité - ${branding.client}`)}</title>
<style>${colors}
${css}</style>
</head>
<body>
${renderCover(scan, branding, date)}
${renderSummary(problems)}
${renderFixTime(problems)}
${renderDetails(problems)}
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
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
  } finally {
    await browser.close();
  }
}
