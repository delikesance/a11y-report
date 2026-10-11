import { describeRule, IMPACT_ORDER } from '../rules-fr.js';

const IMPACT_PENALTY = { critical: 10, serious: 5, moderate: 2, minor: 1 };

export function collectProblems(scan) {
  const problemsById = new Map();
  for (const page of scan.pages) {
    for (const violation of page.violations) {
      const problem = problemsById.get(violation.id) ?? { ...violation, nodes: [], pages: [] };
      problem.nodes.push(...violation.nodes);
      problem.pages.push(page);
      problemsById.set(violation.id, problem);
    }
  }
  return [...problemsById.values()]
    .map((problem) => ({ ...problem, occurrences: problem.nodes.length, rule: describeRule(problem.id) }))
    .sort(
      (a, b) =>
        IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact) ||
        b.occurrences - a.occurrences,
    );
}

// Score sur 100: chaque problème distinct retire un nombre de points selon son impact.
export function computeImpactWeightedScore(problems) {
  const penalty = problems.reduce((sum, problem) => sum + IMPACT_PENALTY[problem.impact], 0);
  return Math.max(0, 100 - penalty);
}

export function collectAuditGaps(scan) {
  return {
    unauditedPages: scan.pages.filter((page) => !page.audited),
    incomplete: scan.pages.flatMap((page) => page.incomplete.map((violation) => ({ ...violation, pageUrl: page.url }))),
  };
}
