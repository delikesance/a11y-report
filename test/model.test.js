import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectProblems, computeImpactWeightedScore, computeQuote } from '../src/report/model.js';

const problem = (impact, occurrences, minutesParOccurrence) => ({
  impact,
  occurrences,
  rule: { minutesParOccurrence },
});

const scan = {
  generatedAt: '2026-10-10T08:00:00.000Z',
  pages: [
    {
      url: 'https://client.example/accueil',
      violations: [
        { id: 'image-alt', impact: 'critical', nodes: [{ html: '<img>' }, { html: '<img>' }] },
        { id: 'color-contrast', impact: 'serious', nodes: [{ html: '<p>' }] },
      ],
    },
    {
      url: 'https://client.example/contact',
      violations: [{ id: 'image-alt', impact: 'critical', nodes: [{ html: '<img>' }] }],
    },
  ],
};

test('computeQuote groups problems into phases and sums hours and prices', () => {
  const problems = [problem('critical', 2, 30), problem('serious', 1, 20), problem('minor', 4, 10)];

  const quote = computeQuote(problems, 60);

  assert.deepEqual(
    quote.phases.map(({ key, label, problemCount }) => ({ key, label, problemCount })),
    [
      { key: 'bloquants', label: 'Bloquants', problemCount: 1 },
      { key: 'genants', label: 'Gênants', problemCount: 1 },
      { key: 'finitions', label: 'Finitions', problemCount: 1 },
    ],
  );
  assert.equal(quote.phases[0].minutes, 60);
  assert.equal(quote.phases[0].hours, 1);
  assert.equal(quote.phases[0].price, 60);
  assert.equal(quote.phases[2].minutes, 40);
  assert.equal(quote.totalHours, 1 + 0.5 + 1);
  assert.equal(quote.totalPrice, 60 + 30 + 60);
});

test('computeQuote rounds each phase up to the next half hour', () => {
  const quote = computeQuote([problem('critical', 1, 61), problem('serious', 1, 60)], 100);

  assert.equal(quote.phases[0].hours, 1.5);
  assert.equal(quote.phases[0].price, 150);
  assert.equal(quote.phases[1].hours, 1);
  assert.equal(quote.totalHours, 2.5);
});

test('computeQuote gives no price when hourlyRate is missing', () => {
  const quote = computeQuote([problem('critical', 1, 30)], undefined);

  assert.equal(quote.phases[0].hours, 0.5);
  assert.equal(quote.phases[0].price, null);
  assert.equal(quote.totalPrice, null);
  assert.equal(computeQuote([problem('critical', 1, 30)], null).totalPrice, null);
});

test('computeQuote handles an empty phase as zero hours', () => {
  const quote = computeQuote([problem('serious', 1, 30)], 50);

  assert.deepEqual(quote.phases[0], {
    key: 'bloquants',
    label: 'Bloquants',
    problemCount: 0,
    minutes: 0,
    hours: 0,
    price: 0,
  });
  assert.equal(quote.totalHours, 0.5);
});

test('collectProblems merges occurrences per rule and sorts by impact', () => {
  const problems = collectProblems(scan);

  assert.deepEqual(
    problems.map(({ id, occurrences }) => ({ id, occurrences })),
    [
      { id: 'image-alt', occurrences: 3 },
      { id: 'color-contrast', occurrences: 1 },
    ],
  );
  assert.equal(problems[0].pages.length, 2);
});

test('computeImpactWeightedScore subtracts impact penalties from 100', () => {
  assert.equal(computeImpactWeightedScore(collectProblems(scan)), 85);
  assert.equal(computeImpactWeightedScore([]), 100);
});
