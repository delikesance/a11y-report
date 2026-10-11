import { collectProblems } from './model.js';
import { AUTOMATABLE_CRITERIA } from './rgaa-criteria.js';

const PERCENT = 100;
const AUTOMATABLE_IDS = new Set(AUTOMATABLE_CRITERIA.map(({ id }) => id));

const criteriaOf = (problem) => problem.rule.rgaa.split(', ');

// Une règle sans critère automatisable compte comme échec non rattaché : le taux ne peut pas atteindre 100 %.
export function computeRgaaEstimate(scan) {
  const testable = AUTOMATABLE_CRITERIA.length;
  if (!scan.pages.some((page) => !page.error)) return { testable, passing: null, unmapped: null, percent: null };
  const failed = new Set();
  let unmapped = 0;
  for (const problem of collectProblems(scan)) {
    const mapped = criteriaOf(problem).filter((id) => AUTOMATABLE_IDS.has(id));
    if (mapped.length === 0) unmapped += 1;
    mapped.forEach((id) => failed.add(id));
  }
  const passing = AUTOMATABLE_CRITERIA.filter(({ id }) => !failed.has(id)).length;
  return { testable, passing, unmapped, percent: Math.round((passing / (testable + unmapped)) * PERCENT) };
}
