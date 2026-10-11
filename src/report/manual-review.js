import { breakableUrl, escapeHtml } from './shared.js';

const listOrEmpty = (value) => (Array.isArray(value) ? value : []);

const renderUnauditedItem = (entry) => `<li>${breakableUrl(entry.url ?? entry)}</li>`;

const renderIncompleteItem = ({ page, violation }) =>
  `<li><span class="strong">${escapeHtml(violation.help)}</span> : ${breakableUrl(page.url)} (${escapeHtml(violation.nodes.length)} élément(s))</li>`;

const renderBlock = (title, items) =>
  items.length ? `<h3 class="ap-subtitle">${title}</h3><ul class="mr-list">${items.join('')}</ul>` : '';

export function renderManualReview(scan) {
  const unaudited = listOrEmpty(scan.unauditedPages).map(renderUnauditedItem);
  const pending = scan.pages.flatMap((page) =>
    listOrEmpty(page.incomplete).map((violation) => renderIncompleteItem({ page, violation })),
  );
  if (!unaudited.length && !pending.length) return '';
  return `<section class="page ap-page">
  <h2 class="ap-title">Pages non auditées et points à vérifier manuellement</h2>
  ${renderBlock('Pages non auditées', unaudited)}
  ${renderBlock('À vérifier manuellement', pending)}
</section>`;
}
