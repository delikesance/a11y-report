import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSiteCss } from '../scripts/build-site-css.js';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_DIR = join(ROOT_DIR, 'site');
const PAGES = readdirSync(SITE_DIR).filter((name) => name.endsWith('.html'));
const read = (path) => readFileSync(path, 'utf8');
const countMatches = (html, pattern) => (html.match(pattern) || []).length;

test('le CSS du site correspond à sa source (npm run build:site)', () => {
  const tokens = JSON.parse(read(join(ROOT_DIR, 'design', 'tokens.json')));
  const base = read(join(ROOT_DIR, 'scripts', 'site', 'base.css'));
  assert.equal(read(join(SITE_DIR, 'assets', 'site.css')), buildSiteCss(tokens, base));
});

test('les neuf pages attendues existent', () => {
  for (const page of ['index', 'fonctionnalites', 'demo', 'tarifs', 'documentation', 'faq',
    'mentions-legales', 'politique-de-confidentialite', 'declaration-d-accessibilite']) {
    assert.ok(PAGES.includes(`${page}.html`), `${page}.html manquante`);
  }
});

test('chaque page est en français, avec titre, description et lien d\'évitement', () => {
  for (const page of PAGES) {
    const html = read(join(SITE_DIR, page));
    assert.match(html, /<html lang="fr">/, page);
    assert.match(html, /<title>[^<]+<\/title>/, page);
    assert.match(html, /<meta name="description" content="[^"]+">/, page);
    assert.match(html, /<a class="skip-link" href="#contenu">/, page);
    assert.match(html, /<main id="contenu">/, page);
  }
});

test('chaque page a exactement un h1', () => {
  for (const page of PAGES) {
    assert.equal(countMatches(read(join(SITE_DIR, page)), /<h1[\s>]/g), 1, page);
  }
});

test('la navigation principale marque la page courante quand elle y figure', () => {
  const NAV_PAGES = ['index.html', 'fonctionnalites.html', 'demo.html', 'tarifs.html', 'documentation.html', 'faq.html'];
  for (const page of PAGES) {
    const nav = read(join(SITE_DIR, page)).match(/<nav aria-label="Principal">[\s\S]*?<\/nav>/)?.[0] ?? '';
    assert.ok(nav.length > 0, `${page} sans navigation principale`);
    assert.equal(countMatches(nav, /aria-current="page"/g), NAV_PAGES.includes(page) ? 1 : 0, page);
  }
});

test('aucune ressource externe n\'est chargée', () => {
  const css = read(join(SITE_DIR, 'assets', 'site.css'));
  for (const page of PAGES) {
    const html = read(join(SITE_DIR, page));
    assert.doesNotMatch(html, /(src|href)="https?:\/\//, page);
  }
  assert.doesNotMatch(css, /url\(\s*["']?https?:/);
  assert.doesNotMatch(css, /@import/);
});

test('les déclarations de statut et les champs à compléter sont présents', () => {
  const declaration = read(join(SITE_DIR, 'declaration-d-accessibilite.html'));
  assert.match(declaration, /partiellement conforme/);
  assert.match(read(join(SITE_DIR, 'mentions-legales.html')), /\[A COMPLETER PAR L'EDITEUR\]/);
});

test('la feuille de style couvre les thèmes, le mouvement réduit et le focus visible', () => {
  const css = read(join(SITE_DIR, 'assets', 'site.css'));
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
});
