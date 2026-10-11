import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCliArgs } from '../src/cli.js';
import { assertOutWritable, outputPathFor } from '../src/cli/outputs.js';

const URL_ARG = 'https://example.com';
const sandbox = () => mkdtempSync(join(tmpdir(), 'a11y-out-'));

describe('parseCliArgs : --from-json exclusif', () => {
  test('refuse --from-json combiné à une URL', () => {
    assert.throws(() => parseCliArgs(['--from-json', 'scan.json', URL_ARG]), /--from-json .*URL/);
  });

  test('refuse --from-json combiné à --crawl', () => {
    assert.throws(() => parseCliArgs(['--from-json', 'scan.json', '--crawl']), /--from-json .*--crawl/);
  });

  test('accepte --from-json seul', () => {
    assert.equal(parseCliArgs(['--from-json', 'scan.json']).urls.length, 0);
  });
});

describe('assertOutWritable : validation avant le scan', () => {
  test('refuse un dossier parent inexistant', () => {
    assert.throws(() => assertOutWritable('/nonexistent-a11y-dir/rapport.json', ['json']), /Dossier de sortie introuvable/);
  });

  test('accepte un fichier dont le dossier parent existe', () => {
    assert.doesNotThrow(() => assertOutWritable(join(sandbox(), 'rapport.json'), ['json']));
  });
});

describe('sorties multi-formats : --out est un dossier', () => {
  test('./a.b.c avec plusieurs formats désigne un dossier', () => {
    const dir = join(sandbox(), 'a.b.c');
    mkdirSync(dir);
    assert.equal(outputPathFor('json', { out: dir, formats: ['json', 'csv'] }), join(dir, 'rapport.json'));
    assert.doesNotThrow(() => assertOutWritable(join(sandbox(), 'x.y.z'), ['json', 'csv']));
  });
});
