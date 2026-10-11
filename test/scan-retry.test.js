import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withRetries } from '../src/scan/retry.js';

const SETTINGS = { retries: 2, backoffMs: 1 };

test('withRetries returns the first result that is not retryable', async () => {
  const results = [{ retryable: true }, { retryable: false, value: 'ok' }];
  const result = await withRetries(async () => results.shift(), SETTINGS);
  assert.equal(result.value, 'ok');
});

test('withRetries stops after the configured number of retries', async () => {
  let calls = 0;
  const result = await withRetries(async () => {
    calls += 1;
    return { retryable: true, value: calls };
  }, SETTINGS);
  assert.equal(calls, 3);
  assert.equal(result.value, 3);
});

test('withRetries never retries a non-retryable failure', async () => {
  let calls = 0;
  await withRetries(async () => {
    calls += 1;
    return { retryable: false };
  }, SETTINGS);
  assert.equal(calls, 1);
});
