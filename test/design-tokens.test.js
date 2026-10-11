import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { relativeLuminance, contrastRatio, checkPairs } from '../design/contrast.js';
import { loadBranding } from '../src/cli/branding.js';

const DESIGN_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'design');
const BRANDINGS_DIR = join(DESIGN_DIR, 'brandings');
const ROOT_DIR = join(DESIGN_DIR, '..');
const tokens = JSON.parse(readFileSync(join(DESIGN_DIR, 'tokens.json'), 'utf8'));
const BRAND_NAMES = Object.keys(tokens.color.brands);

test('la luminance relative suit la définition WCAG', () => {
  assert.equal(relativeLuminance('#000000'), 0);
  assert.equal(relativeLuminance('#ffffff'), 1);
});

test('le ratio de contraste est 21:1 pour noir sur blanc, symétrique', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
});

test('checkPairs signale une paire sous le seuil', () => {
  const sample = {
    color: { gris: '#777777', blanc: '#ffffff' },
    contrast: { pairs: [{ text: 'color.gris', background: 'color.blanc', kind: 'body' }] },
  };
  const [result] = checkPairs(sample);
  assert.equal(result.pass, false);
  assert.equal(result.required, 4.5);
});

test('checkPairs applique le seuil 3:1 aux grands textes et à l’UI', () => {
  const sample = {
    color: { gris: '#767676', blanc: '#ffffff' },
    contrast: {
      pairs: [
        { text: 'color.gris', background: 'color.blanc', kind: 'large' },
        { text: 'color.gris', background: 'color.blanc', kind: 'ui' },
      ],
    },
  };
  assert.deepEqual(
    checkPairs(sample).map(({ required, pass }) => [required, pass]),
    [[3, true], [3, true]],
  );
});

test('toutes les paires déclarées dans les tokens respectent WCAG AA', () => {
  const failing = checkPairs(tokens).filter(({ pass }) => !pass);
  assert.deepEqual(failing, []);
});

test('chaque marque déclare ses paires texte sur papier et texte sur couleur principale', () => {
  for (const brand of BRAND_NAMES) {
    const declared = tokens.contrast.pairs.filter(({ text }) => text.startsWith(`color.brands.${brand}.`));
    assert.ok(declared.some(({ text }) => text.endsWith('.primary')), `${brand} : primary non testée`);
    assert.ok(declared.some(({ text }) => text.endsWith('.accent')), `${brand} : accent non testée`);
    assert.ok(declared.some(({ text }) => text.endsWith('.onPrimary')), `${brand} : onPrimary non testée`);
  }
});

test('les fichiers de branding existent pour chaque marque des tokens', () => {
  const files = readdirSync(BRANDINGS_DIR).map((name) => name.replace(/\.json$/, '')).sort();
  assert.deepEqual(files, [...BRAND_NAMES].sort());
});

test('chaque branding est valide pour la CLI et reprend les couleurs des tokens', () => {
  for (const brand of BRAND_NAMES) {
    const branding = loadBranding({ branding: join(BRANDINGS_DIR, `${brand}.json`) });
    assert.equal(branding.primaryColor, tokens.color.brands[brand].primary, brand);
    assert.equal(branding.accentColor, tokens.color.brands[brand].accent, brand);
  }
});

test('les familles typographiques sont bundlées via @fontsource', () => {
  for (const pkg of ['ibm-plex-sans', 'ibm-plex-mono', 'source-serif-4']) {
    assert.ok(existsSync(join(ROOT_DIR, 'node_modules', '@fontsource', pkg)), pkg);
  }
  assert.deepEqual(Object.values(tokens.typography.family).sort(), ['IBM Plex Mono', 'IBM Plex Sans', 'Source Serif 4']);
});
