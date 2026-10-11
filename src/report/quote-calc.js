import { resolveQuoteRates } from './quote-rates.js';
import { normaliseImpact } from './model.js';

const QUOTE_PHASES = [
  { key: 'bloquants', label: 'Bloquants', impacts: ['critical'] },
  { key: 'genants', label: 'Gênants', impacts: ['serious'] },
  { key: 'finitions', label: 'Finitions', impacts: ['moderate', 'minor'] },
];
const MINUTES_BY_IMPACT = { critical: 30, serious: 20, moderate: 10, minor: 5 };
const HALF_HOURS_PER_HOUR = 2;
const MINUTES_PER_HOUR = 60;
const CENTS = 100;
const RANGE_LOW = 0.8;
const RANGE_HIGH = 1.3;

const toCents = (euros) => Math.round(euros * CENTS);
const toEuros = (cents) => (cents === null ? null : cents / CENTS);
const sumOf = (items, pick) => items.reduce((total, item) => total + (pick(item) ?? 0), 0);
const roundUpToHalfHour = (hours) => Math.ceil(hours * HALF_HOURS_PER_HOUR) / HALF_HOURS_PER_HOUR;

const minutesPerOccurrence = (problem) =>
  problem.rule.minutesParOccurrence ?? MINUTES_BY_IMPACT[normaliseImpact(problem.impact)];
const nodeKey = ({ html, target }) => `${html}\u0000${target}`;
const occurrencesOf = (problem) => Math.max(1, new Set(problem.nodes.map(nodeKey)).size);
const problemMinutes = (problem) => minutesPerOccurrence(problem) * occurrencesOf(problem);

function priceCentsFor(hours, rates) {
  const workCents = toCents(hours * rates.tjm * (1 + rates.marge));
  return Math.max(toCents(rates.minimumPhase), workCents);
}

function emptyPhase({ key, label }) {
  return { key, label, problemCount: 0, occurrences: 0, minutes: 0, hours: 0, priceCents: null, lowCents: null, highCents: null };
}

function pricedPhase({ key, label }, phaseProblems, rates) {
  const minutes = sumOf(phaseProblems, problemMinutes);
  const hours = roundUpToHalfHour(minutes / MINUTES_PER_HOUR);
  const priceCents = priceCentsFor(hours, rates);
  return {
    key,
    label,
    problemCount: phaseProblems.length,
    occurrences: sumOf(phaseProblems, occurrencesOf),
    minutes,
    hours,
    priceCents,
    lowCents: Math.round(priceCents * RANGE_LOW),
    highCents: Math.round(priceCents * RANGE_HIGH),
  };
}

function buildPhase(phase, problems, rates) {
  const phaseProblems = problems.filter((problem) => phase.impacts.includes(normaliseImpact(problem.impact)));
  return phaseProblems.length === 0 ? emptyPhase(phase) : pricedPhase(phase, phaseProblems, rates);
}

function toPublicPhase({ priceCents, lowCents, highCents, ...phase }) {
  return { ...phase, price: toEuros(priceCents), low: toEuros(lowCents), high: toEuros(highCents) };
}

function sumTotals(phases, htCents) {
  if (htCents === 0) return { totalPrice: null, totalLow: null, totalHigh: null };
  const totalLowCents = sumOf(phases, (phase) => phase.lowCents);
  const totalHighCents = sumOf(phases, (phase) => phase.highCents);
  return {
    totalPrice: toEuros(htCents),
    totalLow: toEuros(totalLowCents),
    totalHigh: toEuros(totalHighCents),
  };
}

export function computeQuote(problems, branding) {
  const rates = resolveQuoteRates(branding);
  const phases = QUOTE_PHASES.map((phase) => buildPhase(phase, problems, rates));
  const htCents = sumOf(phases, (phase) => phase.priceCents);
  const ttcCents = Math.round(htCents * (1 + rates.tva));
  const totals = sumTotals(phases, htCents);
  return {
    rates,
    phases: phases.map(toPublicPhase),
    totalHours: sumOf(phases, (phase) => phase.hours),
    ...totals,
    tva: totals.totalPrice === null ? null : toEuros(ttcCents - htCents),
    ttc: totals.totalPrice === null ? null : toEuros(ttcCents),
  };
}
