import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_ASSET_NAMES, DEMO_BRANDING, DEMO_OUTPUTS, DEMO_PAGES, cliArgs } from '../scripts/build-demo.js';

const FIXTURES_DIR = fileURLToPath(new URL('./fixtures', import.meta.url));

test('demo pages exist in the fixtures', () => {
  for (const page of DEMO_PAGES) assert.ok(existsSync(join(FIXTURES_DIR, page)), page);
});

test('demo CLI call audits every URL with the fictional agency branding and both formats', () => {
  const args = cliArgs(['http://x/a.html', 'http://x/b.html'], '/out/');
  assert.deepEqual(args.slice(0, 2), ['http://x/a.html', 'http://x/b.html']);
  assert.ok(args.includes('--format') && args[args.indexOf('--format') + 1] === 'pdf,html');
  assert.equal(args[args.indexOf('--out') + 1], '/out/');
  assert.equal(DEMO_BRANDING[DEMO_BRANDING.indexOf('--agency') + 1], 'Atelier Démo');
});

test('every generated demo output has a published asset name', () => {
  for (const name of DEMO_OUTPUTS) assert.ok(DEMO_ASSET_NAMES[name].startsWith('exemple-rapport.'));
});
