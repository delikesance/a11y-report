import { IMPACT_FR, IMPACT_ORDER } from '../rules-fr.js';
import { computePageScore } from '../report/score.js';
import { visibleLength } from './terminal.js';
import { renderTable, truncate } from './table.js';

const NO_VALUE = '-';
const MIN_URL_WIDTH = 12;

const nodeCount = (page, impact) =>
  (page.violations ?? [])
    .filter((violation) => violation.impact === impact)
    .reduce((total, violation) => total + violation.nodes.length, 0);

const totalCount = (page) => IMPACT_ORDER.reduce((sum, impact) => sum + nodeCount(page, impact), 0);

function pageStatus(page) {
  if (page.error) return 'fail';
  return totalCount(page) === 0 ? 'ok' : 'warn';
}

export function pageLine(page, term) {
  const detail = page.error ?? `${totalCount(page)} occurrence(s), score ${computePageScore(page) ?? NO_VALUE}/100`;
  const prefix = `${term.symbol(pageStatus(page))} `;
  const urlWidth = Math.max(MIN_URL_WIDTH, term.width - visibleLength(prefix) - visibleLength(` : ${detail}`));
  return `${prefix}${truncate(page.url, urlWidth, term.ellipsis)} : ${detail}`;
}

function pageRow(page) {
  if (page.error) return { page: page.url, ...Object.fromEntries(columns.slice(1).map(({ key }) => [key, NO_VALUE])) };
  const counts = Object.fromEntries(IMPACT_ORDER.map((impact) => [impact, String(nodeCount(page, impact))]));
  return { page: page.url, ...counts, score: String(computePageScore(page) ?? NO_VALUE) };
}

const columns = [
  { key: 'page', label: 'Page', flex: true },
  ...IMPACT_ORDER.map((impact) => ({ key: impact, label: IMPACT_FR[impact], align: 'right' })),
  { key: 'score', label: 'Score', align: 'right' },
];

export function summaryLines(scan, term) {
  const failed = scan.pages.filter((page) => page.error).length;
  const occurrences = scan.pages.reduce((sum, page) => sum + totalCount(page), 0);
  const totals = `Total : ${scan.pages.length} page(s), ${occurrences} occurrence(s), ${failed} en erreur`;
  return [
    ...scan.pages.map((page) => pageLine(page, term)),
    '',
    ...renderTable({ columns, rows: scan.pages.map(pageRow), width: term.width, term }),
    '',
    totals,
  ];
}
