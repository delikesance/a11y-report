import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRgaaEstimate } from '../src/report/rgaa-estimate.js';
import { AUTOMATABLE_CRITERIA, RGAA_CRITERIA_COUNT } from '../src/report/rgaa-criteria.js';

const page = (violations, error) => ({ url: 'https://client.example/', violations, ...(error ? { error } : {}) });
const imageAlt = { id: 'image-alt', impact: 'critical', nodes: [{ html: '<img>' }] };

test('RGAA criteria list covers 106 criteria with 29 automatable ones', () => {
  assert.equal(RGAA_CRITERIA_COUNT, 106);
  assert.equal(AUTOMATABLE_CRITERIA.length, 29);
});

test('computeRgaaEstimate counts automatable criteria without detected anomaly', () => {
  assert.deepEqual(computeRgaaEstimate({ pages: [page([])] }), { testable: 29, passing: 29, percent: 100 });
});

test('computeRgaaEstimate removes criteria failed by a violation', () => {
  assert.deepEqual(computeRgaaEstimate({ pages: [page([imageAlt])] }), { testable: 29, passing: 28, percent: 97 });
});

test('computeRgaaEstimate gives no percentage when no page was audited', () => {
  assert.deepEqual(computeRgaaEstimate({ pages: [page([], 'HTTP 500')] }), { testable: 29, passing: null, percent: null });
});
