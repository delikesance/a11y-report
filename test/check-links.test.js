import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkSite, extractRefs } from '../scripts/check-links.js';

const makeSite = (files) => {
  const dir = mkdtempSync(join(tmpdir(), 'links-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
};

test('extrait les href et src', () => {
  assert.deepEqual(extractRefs('<a href="a.html">x</a><img src="assets/i.svg">'), ['a.html', 'assets/i.svg']);
});

test('signale fichier absent, identifiant absent et url CSS cassée', () => {
  const dir = makeSite({
    'index.html': '<a href="missing.html">m</a><a href="other.html#nope">o</a><a href="#ok">k</a><h2 id="ok">t</h2>',
    'other.html': '<p>rien</p>',
    'assets/site.css': 'a{background:url("fonts/absent.woff2")}',
  });
  const { broken } = checkSite(dir);
  assert.equal(broken.length, 3);
  assert.match(broken.join('\n'), /missing\.html/);
  assert.match(broken.join('\n'), /#nope/);
  assert.match(broken.join('\n'), /absent\.woff2/);
});

test('le site livré ne contient aucun lien interne cassé', () => {
  assert.deepEqual(checkSite().broken, []);
});
