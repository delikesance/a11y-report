import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findLowContrast } from '../scripts/layout-lint/contrast-check.js';
import { lintLayout } from '../scripts/layout-lint.js';
import { contentEnd, findEmptyPages, longestBlankBand, parsePgm } from '../scripts/layout-lint/pixels.js';

const WHITE = 255;
const INK = 0;
const WIDTH = 4;

const image = (rows) => ({ width: WIDTH, height: rows.length, pixels: Uint8Array.from(rows.flatMap((ink) => Array(WIDTH).fill(ink ? INK : WHITE))) });

test('parsePgm reads dimensions and pixel data', () => {
  const buffer = Buffer.concat([Buffer.from('P5\n2 2\n255\n'), Buffer.from([0, 255, 255, 0])]);
  const { width, height, pixels } = parsePgm(buffer);
  assert.deepEqual([width, height, pixels.length], [2, 2, 4]);
});

test('contentEnd returns the fraction of height where ink stops', () => {
  const rows = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  assert.equal(contentEnd(image(rows)), 0.1);
});

test('longestBlankBand ignores margins and measures the gap between inks', () => {
  const rows = [0, 1, 0, 0, 0, 1, 0, 0];
  assert.equal(longestBlankBand(image(rows)), 3 / 8);
});

test('findEmptyPages skips cover and last page', () => {
  const measures = [
    { end: 0.1, band: 0 },
    { end: 0.3, band: 0 },
    { end: 0.9, band: 0.5 },
    { end: 0.2, band: 0 },
  ];
  assert.deepEqual(
    findEmptyPages(measures).map(({ page, kind }) => [page, kind]),
    [[2, 'nearly-empty'], [3, 'blank-band']],
  );
});

test('findLowContrast applies the large-text threshold', () => {
  const sample = (size, fg) => ({ page: 1, selector: 'p', text: 't', size, weight: 400, fg, bg: [255, 255, 255] });
  const grey = [140, 140, 140];
  const defects = findLowContrast([sample(12, grey), sample(30, grey), sample(12, [0, 0, 0])]);
  assert.equal(defects.length, 1);
  assert.equal(defects[0].kind, 'low-contrast');
});

test('report layout has no defect across brandings and corpora', async () => {
  assert.deepEqual(await lintLayout(), []);
});
