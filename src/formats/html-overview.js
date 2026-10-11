import { computePageScore } from '../report/score.js';
import { computeRgaaEstimate } from '../report/rgaa-estimate.js';
import { collectAuditGaps, computeImpactWeightedScore } from '../report/model.js';
import { escapeHtml } from '../report/shared.js';

const orDash = (value) => (value === null || value === undefined ? '—' : escapeHtml(value));

const renderDefinition = (label, value) => `<dt>${escapeHtml(label)}</dt><dd>${value}</dd>`;

export function renderIntro({ branding, date }) {
  return `<header>
<h1>Rapport d'accessibilité</h1>
<p>${orDash(branding.client)} · Audit réalisé par ${orDash(branding.agency)} · ${escapeHtml(date)}</p>
</header>`;
}

export function renderSummary({ scan, problems }) {
  const score = computeImpactWeightedScore(problems);
  const { percent } = computeRgaaEstimate(scan);
  const audited = scan.pages.filter((page) => page.audited).length;
  return `<section aria-labelledby="synthese">
<h2 id="synthese">Synthèse</h2>
<dl>
${renderDefinition('Score global', `${score} / 100`)}
${renderDefinition('Taux RGAA indicatif', percent === null ? 'Non calculé' : `${percent} %`)}
${renderDefinition('Pages auditées', `${audited} / ${scan.pages.length}`)}
${renderDefinition('Problèmes distincts', String(problems.length))}
</dl>
</section>`;
}

const renderPageRow = (page) => {
  const score = computePageScore(page);
  return `<tr><td><a href="${escapeHtml(page.url)}">${escapeHtml(page.url)}</a></td><td>${escapeHtml(page.title)}</td><td>${orDash(score)}</td><td>${page.violations.length}</td><td>${page.incomplete.length}</td><td>${escapeHtml(page.error ?? 'Audité')}</td></tr>`;
};

export function renderPages({ scan }) {
  return `<section aria-labelledby="pages">
<h2 id="pages">Pages auditées</h2>
<table>
<caption>Score et résultats par page</caption>
<thead><tr><th scope="col">Adresse</th><th scope="col">Titre</th><th scope="col">Score</th><th scope="col">Violations</th><th scope="col">À vérifier</th><th scope="col">Statut</th></tr></thead>
<tbody>${scan.pages.map(renderPageRow).join('')}</tbody>
</table>
</section>`;
}

export function renderUnaudited({ scan }) {
  const { unauditedPages } = collectAuditGaps(scan);
  const items = unauditedPages.map((page) => `<li>${escapeHtml(page.url)}</li>`).join('');
  const content = unauditedPages.length === 0 ? '<p>Toutes les pages ont été auditées.</p>' : `<ul>${items}</ul>`;
  return `<section aria-labelledby="non-audite">
<h2 id="non-audite">Pages non auditées</h2>
${content}
</section>`;
}
