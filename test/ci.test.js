import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateThresholds, normalizeThresholds, parseThresholdsFlags, readThresholdsFile } from '../src/ci.js';

const NODE = { html: '<a href="#">x</a>', target: ['a'], failureSummary: 'Fix it' };
const violation = (impact, nodeCount = 1) => ({
  id: `rule-${impact}`,
  impact,
  help: 'aide',
  description: 'description',
  helpUrl: 'https://example.test/rule',
  tags: [],
  nodes: Array.from({ length: nodeCount }, () => NODE),
});
/** @param {string} url @param {any[]} [violations] @param {string | null} [error] */
const page = (url, violations = [], error = null) => ({ url, title: '', violations, passes: 0, incomplete: [], error });
const scanOf = (...pages) => ({ generatedAt: '2026-10-11T00:00:00.000Z', pages });
const CLEAN = scanOf(page('https://site.test/'));
const ANNOTATION_PREFIX = '::error title=Accessibilité::';

describe('evaluateThresholds : seuils par impact', () => {
  test('un scan sans violation passe avec le code 0', () => {
    const result = evaluateThresholds(CLEAN);
    assert.equal(result.passed, true);
    assert.equal(result.exitCode, 0);
  });

  test('par défaut, une seule occurrence critique dépasse le seuil 0 (code 2)', () => {
    const scan = scanOf(page('https://site.test/', [violation('critical')]));
    assert.equal(evaluateThresholds(scan).exitCode, 2);
  });

  test('compte les occurrences (nœuds) et non les règles', () => {
    const scan = scanOf(page('https://site.test/', [violation('critical', 3)]));
    assert.equal(evaluateThresholds(scan, { maxCritical: 2 }).exitCode, 2);
    assert.equal(evaluateThresholds(scan, { maxCritical: 3 }).exitCode, 0);
  });

  test('maxSerious par défaut à 0 et accepte la valeur donnée', () => {
    const scan = scanOf(page('https://site.test/', [violation('serious', 2)]));
    assert.equal(evaluateThresholds(scan).exitCode, 2);
    assert.equal(evaluateThresholds(scan, { maxSerious: 2 }).exitCode, 0);
  });

  test('moderate et minor sont sans limite par défaut', () => {
    const scan = scanOf(page('https://site.test/', [violation('moderate', 100), violation('minor', 100)]));
    assert.equal(evaluateThresholds(scan).exitCode, 0);
  });

  test('maxModerate et maxMinor bornent leurs impacts', () => {
    const scan = scanOf(page('https://site.test/', [violation('moderate', 11), violation('minor', 2)]));
    assert.equal(evaluateThresholds(scan, { maxModerate: 10 }).exitCode, 2);
    assert.equal(evaluateThresholds(scan, { maxMinor: 1 }).exitCode, 2);
    assert.equal(evaluateThresholds(scan, { maxModerate: 11, maxMinor: 2 }).exitCode, 0);
  });

  test('additionne les occurrences de toutes les pages', () => {
    const scan = scanOf(
      page('https://site.test/a', [violation('critical', 2)]),
      page('https://site.test/b', [violation('critical', 2)]),
    );
    assert.equal(evaluateThresholds(scan, { maxCritical: 3 }).exitCode, 2);
  });
});

describe('evaluateThresholds : score minimum', () => {
  test('une page sous le score minimum fait échouer (code 2)', () => {
    const scan = scanOf(page('https://site.test/', [violation('serious')]));
    assert.equal(evaluateThresholds(scan, { maxSerious: 1, minScore: 100 }).exitCode, 2);
  });

  test('une page propre atteint le score minimum 100', () => {
    assert.equal(evaluateThresholds(CLEAN, { minScore: 100 }).exitCode, 0);
  });

  test('une page non auditée n est pas notée', () => {
    const scan = scanOf(page('https://site.test/', [], 'net::ERR_NAME_NOT_RESOLVED'));
    assert.equal(evaluateThresholds(scan, { minScore: 100 }).exitCode, 0);
  });
});

describe('evaluateThresholds : pages non auditées', () => {
  const unreachable = scanOf(page('https://site.test/down', [], 'net::ERR_NAME_NOT_RESOLVED'));

  test('sans failOnUnaudited, une page injoignable ne fait pas échouer', () => {
    assert.equal(evaluateThresholds(unreachable).exitCode, 0);
  });

  test('avec failOnUnaudited, une page injoignable donne le code 3', () => {
    assert.equal(evaluateThresholds(unreachable, { failOnUnaudited: true }).exitCode, 3);
  });

  test('le dépassement de seuil (2) l emporte sur les pages non auditées (3)', () => {
    const scan = scanOf(page('https://site.test/', [violation('critical')]), unreachable.pages[0]);
    assert.equal(evaluateThresholds(scan, { failOnUnaudited: true }).exitCode, 2);
  });
});

describe('evaluateThresholds : sorties lisibles', () => {
  const failing = scanOf(page('https://site.test/', [violation('critical')]));

  test('le format text n utilise pas d annotation GitHub', () => {
    const { lines } = evaluateThresholds(failing, { format: 'text' });
    assert.ok(lines.length > 1);
    assert.ok(lines.every((line) => !line.startsWith('::')));
  });

  test('la première ligne est le résumé', () => {
    assert.equal(evaluateThresholds(CLEAN).lines[0], 'Seuils CI respectés');
    assert.equal(evaluateThresholds(failing).lines[0], 'Seuils CI non respectés');
  });

  test('le format github préfixe chaque échec par une annotation ::error', () => {
    const { lines } = evaluateThresholds(failing, { format: 'github' });
    const failures = lines.slice(1);
    assert.ok(failures.length > 0);
    assert.ok(failures.every((line) => line.startsWith(ANNOTATION_PREFIX)));
  });

  test('le format github échappe les retours à la ligne des messages', () => {
    const scan = scanOf(page('https://site.test/', [], 'erreur\nligne 2'));
    const { lines } = evaluateThresholds(scan, { failOnUnaudited: true, format: 'github' });
    assert.ok(lines.some((line) => line.includes('erreur%0Aligne 2')));
  });

  test('un format inconnu lève une erreur', () => {
    assert.throws(() => evaluateThresholds(CLEAN, { format: 'jenkins' }), /Format CI inconnu : jenkins/);
  });
});

describe('parseThresholdsFlags', () => {
  test('lit la chaîne critical=0,serious=5,score=80', () => {
    assert.deepEqual(parseThresholdsFlags('critical=0,serious=5,score=80'), {
      maxCritical: 0,
      maxSerious: 5,
      minScore: 80,
    });
  });

  test('lit unaudited=true comme failOnUnaudited', () => {
    assert.deepEqual(parseThresholdsFlags('unaudited=true'), { failOnUnaudited: true });
  });

  test('rejette une clé inconnue', () => {
    assert.throws(() => parseThresholdsFlags('foo=1'), /Seuil inconnu : foo/);
  });

  test('rejette une valeur non numérique ou négative', () => {
    assert.throws(() => parseThresholdsFlags('critical=abc'), /Seuil invalide : critical=abc/);
    assert.throws(() => parseThresholdsFlags('serious=-1'), /Seuil invalide : serious=-1/);
  });

  test('rejette unaudited sans booléen', () => {
    assert.throws(() => parseThresholdsFlags('unaudited=oui'), /Seuil invalide : unaudited=oui/);
  });
});

describe('readThresholdsFile', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ci-thresholds-'));
  const write = (name, content) => {
    const path = join(dir, name);
    writeFileSync(path, content);
    return path;
  };

  test('lit les seuils depuis un JSON', () => {
    const path = write('seuils.json', JSON.stringify({ critical: 0, moderate: 10, score: 75, unaudited: true }));
    assert.deepEqual(readThresholdsFile(path), {
      maxCritical: 0,
      maxModerate: 10,
      minScore: 75,
      failOnUnaudited: true,
    });
  });

  test('rejette un JSON invalide', () => {
    const path = write('casse.json', '{ pas du json');
    assert.throws(() => readThresholdsFile(path), /Fichier de seuils illisible/);
  });

  test('rejette un seuil inconnu du JSON', () => {
    assert.throws(() => normalizeThresholds({ bogus: 1 }), /Seuil inconnu : bogus/);
  });

  test('supprime le dossier temporaire', () => {
    rmSync(dir, { recursive: true, force: true });
  });
});
