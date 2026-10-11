import { IMPACT_FR } from '../rules-fr.js';
import { EXAMPLES_PER_PROBLEM, escapeHtml, formatDuration, truncate } from './shared.js';

const uniqueUrls = (pages) => [...new Set(pages.map((page) => page.url))];

function displayUrls(urls) {
  const origins = new Set(urls.map((url) => new URL(url).origin));
  if (origins.size > 1) return urls;
  return urls.map((url) => new URL(url).pathname);
}

function renderChip(impact) {
  return `<span class="dt-chip dt-impact-${escapeHtml(impact)}">${escapeHtml(IMPACT_FR[impact])}</span>`;
}

function renderPageCount(count) {
  return `${count} ${count > 1 ? 'pages concernées' : 'page concernée'}`;
}

function renderNode(node) {
  return `<div class="dt-mono dt-node"><code>${escapeHtml(truncate(node.html))}</code><span class="dt-target">${escapeHtml(node.target)}</span></div>`;
}

function renderLocation(problem) {
  const urls = displayUrls(uniqueUrls(problem.pages)).map(escapeHtml).join('<br>');
  const nodes = problem.nodes.slice(0, EXAMPLES_PER_PROBLEM).map(renderNode).join('');
  return `<div class="dt-mono dt-urls">${urls}</div>${nodes}`;
}

function renderCompare({ avant, apres }) {
  return `<div class="dt-compare">
    <div class="dt-before"><div class="dt-compare-label">AVANT</div><pre class="dt-mono">${escapeHtml(avant)}</pre></div>
    <div class="dt-after"><div class="dt-compare-label">APRÈS</div><pre class="dt-mono">${escapeHtml(apres)}</pre></div>
  </div>`;
}

function renderFooter(problem) {
  return `<div class="dt-footer">
    <div><div class="dt-stat-label">Temps de correction</div><strong>${formatDuration(problem.rule.minutesParOccurrence)} par occurrence</strong></div>
    <div><div class="dt-stat-label">Occurrences</div><strong>${problem.occurrences}</strong></div>
  </div>`;
}

function renderFiche(problem, priority) {
  const { rule } = problem;
  return `<article class="dt-fiche">
    <div class="dt-meta">${renderChip(problem.impact)}<span>Priorité ${priority} · Critère RGAA ${escapeHtml(rule.rgaa)} · ${renderPageCount(uniqueUrls(problem.pages).length)}</span></div>
    <h3 class="dt-title">${escapeHtml(rule.titre)}</h3>
    <h4 class="dt-label">Ce que vit l'utilisateur</h4>
    <p class="dt-text">${escapeHtml(rule.pourquoi)}</p>
    <h4 class="dt-label">Où le trouver</h4>
    ${renderLocation(problem)}
    <h4 class="dt-label">La correction</h4>
    <p class="dt-text">${escapeHtml(rule.correction)}</p>
    ${renderCompare(rule)}
    ${renderFooter(problem)}
  </article>`;
}

export function renderDetails(problems) {
  const fiches = problems.map((problem, index) => renderFiche(problem, index + 1)).join('');
  return `<section class="dt-section">
    <header class="dt-header"><h2>Détail des problèmes</h2><p>${problems.length} problèmes distincts, par ordre de priorité</p></header>
    ${fiches}
  </section>`;
}
