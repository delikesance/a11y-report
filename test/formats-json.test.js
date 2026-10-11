import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/formats/json.js';
import { formatScan } from './support/format-scan.js';

test('le JSON reprend le scan tel quel, indenté comme --save-json', () => {
  const text = render(formatScan);
  assert.equal(text, JSON.stringify(formatScan, null, 2));
  assert.deepEqual(JSON.parse(text), formatScan);
});
