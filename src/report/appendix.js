import { IMPACT_FR, IMPACT_ORDER } from '../rules-fr.js';
import { LIMITS_PARAGRAPHS, escapeHtml } from './shared.js';

const countByImpact = (page, impact) => page.violations.filter((violation) => violation.impact === impact).length;

function renderPageRow(page) {
  const counts = IMPACT_ORDER.map((impact) => `<td class="ap-count ${impact}">${countByImpact(page, impact)}</td>`).join('');
  return `<tr><td>${escapeHtml(page.url)}</td><td>${escapeHtml(page.title)}</td>${counts}</tr>`;
}

export function renderPageTable(scan) {
  const headers = IMPACT_ORDER.map((impact) => `<th class="ap-count ${impact}">${IMPACT_FR[impact]}</th>`).join('');
  return `<section class="page ap-page">
  <h2 class="ap-title">Résultats par page</h2>
  <table class="ap-table">
    <thead><tr><th>Page</th><th>Titre</th>${headers}</tr></thead>
    <tbody>${scan.pages.map(renderPageRow).join('')}</tbody>
  </table>
</section>`;
}

export function renderLimits() {
  const paragraphs = LIMITS_PARAGRAPHS.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  return `<section class="page ap-page ap-limits">
  <h2 class="ap-title">Limites de l'audit automatique</h2>
  ${paragraphs}
</section>`;
}
