import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteDefects } from '../scripts/dod/quote-checks.js';
import { renderTable } from '../scripts/check-dod.js';

const phase = (key, problemCount, price) => ({ key, problemCount, price });
const quote = (overrides = {}) => ({
  phases: [phase('bloquants', 2, 300), phase('genants', 0, null), phase('finitions', 0, null)],
  rates: { tva: 0.2 },
  totalPrice: 300,
  tva: 60,
  ttc: 360,
  ...overrides,
});

test('un devis conforme ne produit aucun défaut', () => {
  assert.deepEqual(quoteDefects(quote()), []);
});

test('une phase avec problèmes facturée 0 EUR est signalée', () => {
  assert.deepEqual(quoteDefects(quote({ phases: [phase('bloquants', 1, 0)], totalPrice: null, tva: null, ttc: null })), ['bloquants : prix 0']);
});

test('HT + TVA différent du TTC au-delà d un centime est signalé', () => {
  assert.deepEqual(quoteDefects(quote({ ttc: 361 })), ['HT + TVA != TTC']);
});

test('une TVA qui ne correspond pas au taux est signalée', () => {
  assert.deepEqual(quoteDefects(quote({ tva: 50, ttc: 350 })), ['TVA != 0.2 x HT']);
});

test('le tableau aligne les colonnes et garde chaque contrôle sur une ligne', () => {
  const table = renderTable([{ id: 'a', status: 'PASS', name: 'Contrôle', evidence: 'ok' }]);
  assert.equal(table.split('\n').length, 3);
  assert.match(table, /^ID\s+Statut\s+Contrôle\s+Preuve/);
});
