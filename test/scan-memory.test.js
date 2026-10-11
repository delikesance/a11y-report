import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/measure-memory.js', import.meta.url));
const SMALL_RUN = 10;
const LARGE_RUN = 50;
const CONCURRENCY = 4;
const HEAP_PLATEAU_TOLERANCE_MB = 5;
const run = promisify(execFile);

const measure = async (pages) => {
  const { stdout } = await run(process.execPath, ['--expose-gc', SCRIPT, String(pages), String(CONCURRENCY)]);
  return JSON.parse(stdout.trim().split('\n').pop());
};

test(`le tas Node plafonne après GC entre ${SMALL_RUN} et ${LARGE_RUN} pages, sans processus résiduel`, async () => {
  const small = await measure(SMALL_RUN);
  const large = await measure(LARGE_RUN);

  assert.equal(small.audited, SMALL_RUN);
  assert.equal(large.audited, LARGE_RUN);
  assert.deepEqual([small.leftoverChildren, large.leftoverChildren], [0, 0]);
  const growth = large.heapAfterGcMb - small.heapAfterGcMb;
  assert.ok(growth < HEAP_PLATEAU_TOLERANCE_MB, `tas après GC +${growth.toFixed(1)} Mo entre ${SMALL_RUN} et ${LARGE_RUN} pages`);
});
