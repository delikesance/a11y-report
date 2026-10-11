import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectProblems, computeImpactWeightedScore } from '../src/report/model.js';

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

test('computeImpactWeightedScore gives an unknown or null impact the lowest penalty, never NaN', () => {
  const unknownImpacts = [{ impact: 'blocker' }, { impact: null }];

  assert.equal(computeImpactWeightedScore(unknownImpacts), 98);
});
