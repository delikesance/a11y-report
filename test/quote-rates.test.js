import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveQuoteRates } from '../src/report/quote-rates.js';

test('resolveQuoteRates applies the defaults: 550 € TJM, 15 % marge, 20 % TVA, minimum of one day', () => {
  assert.deepEqual(resolveQuoteRates({}), { tjm: 550, marge: 0.15, tva: 0.2, minimumPhase: 550 });
});

test('resolveQuoteRates keeps the values given in the branding', () => {
  assert.deepEqual(resolveQuoteRates({ tjm: 600, marge: 0, tva: 0.055, minimumPhase: 300 }), {
    tjm: 600,
    marge: 0,
    tva: 0.055,
    minimumPhase: 300,
  });
});

test('resolveQuoteRates defaults the minimum phase to the TJM when only the TJM is given', () => {
  assert.equal(resolveQuoteRates({ tjm: 700 }).minimumPhase, 700);
});

test('resolveQuoteRates rejects a non-positive TJM', () => {
  assert.throws(() => resolveQuoteRates({ tjm: 0 }), /TJM invalide/);
  assert.throws(() => resolveQuoteRates({ tjm: -10 }), /TJM invalide/);
});

test('resolveQuoteRates rejects a TVA or marge outside [0, 1)', () => {
  assert.throws(() => resolveQuoteRates({ tva: -0.1 }), /TVA invalide/);
  assert.throws(() => resolveQuoteRates({ tva: 1 }), /TVA invalide/);
  assert.throws(() => resolveQuoteRates({ marge: 'abc' }), /Marge invalide/);
});
