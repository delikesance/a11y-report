import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { detectTerminal, stripAnsi, visibleLength } from '../src/cli/terminal.js';
import { renderTable } from '../src/cli/table.js';
import { summaryLines } from '../src/cli/summary.js';
import { formatScan } from './support/format-scan.js';

const WIDTHS = [60, 80, 120];
const SNAPSHOT_DIR = fileURLToPath(new URL('./fixtures/terminal/', import.meta.url));
const UTF8_ENV = { LANG: 'fr_FR.UTF-8' };

const ttyStream = (columns = 80) => ({ isTTY: true, columns });
const pipeStream = () => ({ isTTY: false });
/** @param {{isTTY?: boolean, columns?: number}} stream @param {{env?: Record<string, string>, argv?: string[]}} [options] */
const termFor = (stream, { env = UTF8_ENV, argv = [] } = {}) => detectTerminal(stream, { env, argv });

const snapshotPath = (width) => `${SNAPSHOT_DIR}summary-w${width}.txt`;

describe('détection du terminal', () => {
  test('pas de couleur hors TTY', () => {
    assert.equal(termFor(pipeStream()).color, false);
  });

  test('couleur sur TTY, désactivée par NO_COLOR et --no-color', () => {
    assert.equal(termFor(ttyStream()).color, true);
    assert.equal(termFor(ttyStream(), { env: { ...UTF8_ENV, NO_COLOR: '1' } }).color, false);
    assert.equal(termFor(ttyStream(), { argv: ['--no-color'] }).color, false);
  });

  test('FORCE_COLOR force la couleur hors TTY, NO_COLOR reste prioritaire', () => {
    assert.equal(termFor(pipeStream(), { env: { ...UTF8_ENV, FORCE_COLOR: '1' } }).color, true);
    assert.equal(termFor(pipeStream(), { env: { ...UTF8_ENV, FORCE_COLOR: '1', NO_COLOR: 'x' } }).color, false);
  });

  test('repli ASCII hors locale UTF-8 ou TERM=dumb', () => {
    assert.equal(termFor(ttyStream(), { env: { LANG: 'C' } }).unicode, false);
    assert.equal(termFor(ttyStream(), { env: { ...UTF8_ENV, TERM: 'dumb' } }).unicode, false);
    assert.equal(stripAnsi(termFor(ttyStream()).symbol('ok')), '✔');
    assert.equal(stripAnsi(termFor(ttyStream(), { env: { LANG: 'C' } }).symbol('ok')), 'OK');
  });

  test('largeur : colonnes du TTY, COLUMNS hors TTY, 80 par défaut', () => {
    assert.equal(termFor(ttyStream(120)).width, 120);
    assert.equal(termFor(pipeStream(), { env: { COLUMNS: '60' } }).width, 60);
    assert.equal(termFor(pipeStream(), { env: {} }).width, 80);
  });
});

describe('tableau', () => {
  const columns = [
    { key: 'page', label: 'Page', flex: true },
    { key: 'n', label: 'N', align: 'right' },
  ];
  const plain = termFor(pipeStream(), { env: { LANG: 'C' } });

  test('la colonne flexible est tronquée pour tenir dans la largeur', () => {
    const [, , row] = renderTable({ columns, rows: [{ page: 'https://exemple.fr/'.padEnd(120, 'x'), n: '3' }], width: 40, term: plain });
    assert.ok(visibleLength(row) <= 40, row);
    assert.match(row, /\.\.\.\s+3$/);
  });

  test('les cellules colorées gardent un alignement correct', () => {
    const colored = termFor(ttyStream(), { env: { LANG: 'C' } });
    const lines = renderTable({ columns, rows: [{ page: 'a', n: colored.paint('red', '12') }], width: 40, term: colored });
    assert.equal(visibleLength(lines[2]), visibleLength(lines[0]));
  });
});

describe('instantanés du résumé', () => {
  for (const width of WIDTHS) {
    test(`résumé à ${width} colonnes, sans couleur ni ASCII par défaut`, () => {
      const term = termFor(pipeStream(), { env: { ...UTF8_ENV, COLUMNS: String(width) } });
      const lines = summaryLines(formatScan, term);
      for (const line of lines) assert.ok(visibleLength(line) <= width, `${width} : ${line}`);
      assert.equal(lines.map((line) => `${line}\n`).join(''), readFileSync(snapshotPath(width), 'utf8'));
    });
  }

  test('sortie identique sans couleur, avec ANSI retirées sur TTY', () => {
    const plain = summaryLines(formatScan, termFor(pipeStream(), { env: UTF8_ENV }));
    const colored = summaryLines(formatScan, termFor(ttyStream(80), { env: UTF8_ENV }));
    assert.deepEqual(colored.map(stripAnsi), plain);
  });
});
