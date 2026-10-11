import { describeRule, IMPACT_ORDER } from '../rules-fr.js';

export const IMPACT_PENALTY = { critical: 10, serious: 5, moderate: 2, minor: 1 };
const QUOTE_PHASES = [
  { key: 'bloquants', label: 'Bloquants', impacts: ['critical'] },
  { key: 'genants', label: 'Gênants', impacts: ['serious'] },
  { key: 'finitions', label: 'Finitions', impacts: ['moderate', 'minor'] },
];

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

export const totalFixMinutes = (problems) =>
  problems.reduce((sum, problem) => sum + problem.rule.minutesParOccurrence * problem.occurrences, 0);

const roundUpToHalfHour = (hours) => Math.ceil(hours * 2) / 2;

function buildPhase({ key, label, impacts }, problems, hourlyRate) {
  const phaseProblems = problems.filter((problem) => impacts.includes(problem.impact));
  const minutes = totalFixMinutes(phaseProblems);
  const hours = roundUpToHalfHour(minutes / 60);
  const price = hourlyRate == null ? null : hours * hourlyRate;
  return { key, label, problemCount: phaseProblems.length, minutes, hours, price };
}

export function computeQuote(problems, hourlyRate) {
  const phases = QUOTE_PHASES.map((phase) => buildPhase(phase, problems, hourlyRate));
  const totalHours = phases.reduce((sum, phase) => sum + phase.hours, 0);
  const totalPrice = hourlyRate == null ? null : phases.reduce((sum, phase) => sum + phase.price, 0);
  return { phases, totalHours, totalPrice };
}
