import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseThresholdsFlags } from '../src/ci.js';

describe('parseThresholdsFlags : formes invalides', () => {
  test('une clé sans "=" est refusée avec un exemple', () => {
    assert.throws(() => parseThresholdsFlags('critical'), /Seuil invalide : "critical" \(attendu : critical=0\)/);
  });

  test('une clé en double est refusée', () => {
    assert.throws(() => parseThresholdsFlags('critical=0,serious=1,critical=2'), /Seuil en double : critical/);
  });
});
