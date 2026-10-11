import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMATS, renderFormat } from '../src/formats/index.js';
import { formatScan } from './support/format-scan.js';

test('la liste des formats couvre json, html, csv et sarif', () => {
  assert.deepEqual(FORMATS, ['json', 'html', 'csv', 'sarif']);
});

test('renderFormat délègue au rendu du format demandé', () => {
  assert.equal(renderFormat('json', formatScan), JSON.stringify(formatScan, null, 2));
  assert.match(renderFormat('csv', formatScan), /^page,rule,impact/);
  assert.match(renderFormat('html', formatScan), /^<!DOCTYPE html>/);
  assert.match(renderFormat('sarif', formatScan), /"version": "2\.1\.0"/);
});

test('un format inconnu lève une erreur explicite', () => {
  assert.throws(() => renderFormat('pdf', formatScan), /Format inconnu : pdf/);
  assert.throws(() => renderFormat('toString', formatScan), /Format inconnu : toString/);
});
