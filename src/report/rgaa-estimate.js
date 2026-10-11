import { collectProblems } from './model.js';
import { AUTOMATABLE_CRITERIA } from './rgaa-criteria.js';

const PERCENT = 100;

export function computeRgaaEstimate(scan) {
  const testable = AUTOMATABLE_CRITERIA.length;
  if (!scan.pages.some((page) => !page.error)) return { testable, passing: null, percent: null };
  const failed = new Set(collectProblems(scan).map((problem) => problem.rule.rgaa));
  const passing = AUTOMATABLE_CRITERIA.filter(({ id }) => !failed.has(id)).length;
  return { testable, passing, percent: Math.round((passing / testable) * PERCENT) };
}
