import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, escapeCsvField } from '../src/formats/csv.js';
import { formatScan } from './support/format-scan.js';

const FIELD_SEPARATOR = ',';
const RECORD_SEPARATOR = '\r\n';

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === FIELD_SEPARATOR) {
      row.push(field);
      field = '';
    } else if (text.startsWith(RECORD_SEPARATOR, i)) {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
    } else field += char;
  }
  return rows;
};

test('une ligne par nœud de violation, avec les colonnes attendues', () => {
  const rows = parseCsv(render(formatScan));
  assert.deepEqual(rows[0], ['page', 'rule', 'impact', 'rgaa', 'wcag', 'target', 'html']);
  assert.equal(rows.length, 4);
  assert.equal(rows[1][0], 'https://client.example/accueil');
  assert.equal(rows[1][1], 'image-alt');
  assert.equal(rows[1][2], 'critical');
  assert.equal(rows[1][5], 'img.logo');
});

test('les virgules, guillemets et retours à la ligne sont échappés et restitués', () => {
  const rows = parseCsv(render(formatScan));
  assert.equal(rows[2][6], '<img src="hero.jpg" title="a, "b"">\nsuite');
});

test('escapeCsvField ne touche pas les champs simples', () => {
  assert.equal(escapeCsvField('image-alt'), 'image-alt');
  assert.equal(escapeCsvField('a,b'), '"a,b"');
  assert.equal(escapeCsvField('say "hi"'), '"say ""hi"""');
});

test('le BOM UTF-8 est optionnel', () => {
  assert.equal(render(formatScan).startsWith('﻿'), false);
  assert.equal(render(formatScan, { bom: true }).startsWith('﻿'), true);
});
