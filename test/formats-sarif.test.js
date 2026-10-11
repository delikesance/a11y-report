import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, levelFor } from '../src/formats/sarif.js';
import { formatScan } from './support/format-scan.js';

const LEVELS = ['none', 'note', 'warning', 'error'];
const sarif = () => JSON.parse(render(formatScan));

test('le document respecte la structure requise de SARIF 2.1.0', () => {
  const log = sarif();
  assert.equal(log.version, '2.1.0');
  assert.match(log.$schema, /sarif-schema-2\.1\.0\.json$/);
  assert.equal(log.runs.length, 1);
  const [run] = log.runs;
  assert.ok(run.tool.driver.name.length > 0);
  assert.ok(Array.isArray(run.results));
});

test('chaque règle a un identifiant unique et chaque résultat pointe vers elle', () => {
  const log = sarif();
  const { driver } = log.runs[0].tool;
  const ids = driver.rules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ['image-alt', 'color-contrast']);
  for (const result of log.runs[0].results) {
    assert.equal(driver.rules[result.ruleIndex].id, result.ruleId);
    assert.ok(result.message.text.length > 0);
    assert.ok(LEVELS.includes(result.level));
  }
});

test('chaque résultat localise la page et l’élément concerné', () => {
  const results = sarif().runs[0].results;
  assert.equal(results.length, 3);
  for (const result of results) {
    const [location] = result.locations;
    assert.match(location.physicalLocation.artifactLocation.uri, /^https:\/\//);
    assert.equal(typeof location.logicalLocations[0].name, 'string');
  }
});

test('le niveau SARIF suit l’impact', () => {
  assert.equal(levelFor('critical'), 'error');
  assert.equal(levelFor('serious'), 'error');
  assert.equal(levelFor('moderate'), 'warning');
  assert.equal(levelFor('minor'), 'note');
  assert.equal(levelFor('inconnu'), 'note');
});
