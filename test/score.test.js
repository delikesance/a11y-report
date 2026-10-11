import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePageScore } from '../src/report/score.js';

const violation = (impact) => ({ id: `rule-${impact}`, impact, nodes: [{ html: '<p>' }] });

test('computePageScore returns 100 for a page without violations', () => {
  assert.equal(computePageScore({ url: 'https://client.example/', violations: [] }), 100);
});

test('computePageScore subtracts one penalty per distinct problem by impact', () => {
  const page = { url: 'https://client.example/', violations: [violation('critical'), violation('serious'), violation('minor')] };
  assert.equal(computePageScore(page), 84);
});

test('computePageScore is null for an unreachable page', () => {
  assert.equal(computePageScore({ url: 'https://client.example/panne', violations: [], error: 'HTTP 500' }), null);
});
