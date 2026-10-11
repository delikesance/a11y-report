import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapWithConcurrency } from '../src/scan/pool.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('mapWithConcurrency keeps the input order whatever the completion order', async () => {
  const results = await mapWithConcurrency([30, 5, 15, 1], 4, async (ms) => {
    await delay(ms);
    return ms;
  });
  assert.deepEqual(results, [30, 5, 15, 1]);
});

test('mapWithConcurrency never runs more than the requested number of tasks at once', async () => {
  let running = 0;
  let peak = 0;
  await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 3, async (ms) => {
    running += 1;
    peak = Math.max(peak, running);
    await delay(ms);
    running -= 1;
  });
  assert.equal(peak, 3);
});

test('mapWithConcurrency waits for running tasks before rejecting', async () => {
  let finished = 0;
  await assert.rejects(
    mapWithConcurrency([1, 2], 2, async (ms) => {
      await delay(ms * 20);
      finished += 1;
      if (ms === 1) throw new Error('échec');
    }),
    /échec/,
  );
  assert.equal(finished, 2);
});
