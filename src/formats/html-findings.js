import { describeRule } from '../rules-fr.js';
import { collectAuditGaps } from '../report/model.js';
import { computeQuote } from '../report/quote-calc.js';
import { formatNumber } from '../report/quote-text.js';
import { badge, escapeHtml, formatDuration, truncate } from '../report/shared.js';

const NOT_PRICED = 'Non chiffré';
const euros = (value) => (value === null ? NOT_PRICED : `${formatNumber(value)} €`);

const renderProblem = (problem) => {
  const { titre, correction, rgaa, wcag } = problem.rule;
  return `<article class="problem">
<h3>${escapeHtml(titre)}</h3>
<p>${badge(problem.impact)} <span class="muted">${problem.occurrences} occurrence(s) sur ${problem.pages.length} page(s)</span></p>
<dl>
<dt>Critères RGAA</dt><dd>${escapeHtml(rgaa)}</dd>
<dt>Critères WCAG</dt><dd>${escapeHtml(wcag)}</dd>
<dt>Correction</dt><dd>${escapeHtml(correction ?? '')}</dd>
</dl>
</article>`;
};

export function renderProblems({ problems }) {
  const content = problems.length === 0 ? '<p>Aucune violation détectée.</p>' : problems.map(renderProblem).join('');
  return `<section aria-labelledby="problemes">
<h2 id="problemes">Problèmes constatés</h2>
${content}
</section>`;
}

const renderIncompleteRow = ({ pageUrl, id, target, failureSummary }) =>
  `<tr><td>${escapeHtml(pageUrl)}</td><td>${escapeHtml(describeRule(id).titre)}</td><td><code>${escapeHtml(target)}</code></td><td>${escapeHtml(truncate(failureSummary))}</td></tr>`;

export function renderIncomplete({ scan }) {
  const rows = collectAuditGaps(scan).incomplete.flatMap((violation) =>
    violation.nodes.map((node) => ({ ...node, pageUrl: violation.pageUrl, id: violation.id })),
  );
  const content = rows.length === 0
    ? '<p>Aucun point à vérifier.</p>'
    : `<table>
<caption>Constats à confirmer à la main</caption>
<thead><tr><th scope="col">Page</th><th scope="col">Règle</th><th scope="col">Élément</th><th scope="col">Constat</th></tr></thead>
<tbody>${rows.map(renderIncompleteRow).join('')}</tbody>
</table>`;
  return `<section aria-labelledby="a-verifier">
<h2 id="a-verifier">Points à vérifier manuellement</h2>
${content}
</section>`;
}

export function renderQuote({ problems, branding }) {
  const quote = computeQuote(problems, branding);
  const priced = quote.totalPrice !== null;
  return `<section aria-labelledby="devis">
<h2 id="devis">Estimation du devis</h2>
<dl>
<dt>Temps de correction estimé</dt><dd>${escapeHtml(formatDuration(Math.round(quote.totalHours * 60)))}</dd>
<dt>Montant HT</dt><dd>${euros(quote.totalPrice)}</dd>
<dt>Fourchette HT</dt><dd>${priced ? `${euros(quote.totalLow)} à ${euros(quote.totalHigh)}` : NOT_PRICED}</dd>
<dt>TVA</dt><dd>${euros(quote.tva)}</dd>
<dt>Montant TTC</dt><dd>${euros(quote.ttc)}</dd>
</dl>
</section>`;
}
