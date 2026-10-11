import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/formats/html.js';
import { formatScan } from './support/format-scan.js';

const branding = { agency: 'Agence Test', client: 'Client <Démo>', date: '10 octobre 2026' };
const html = () => render(formatScan, { branding });

test('le document est en français, autonome et sans ressource externe', () => {
  const page = html();
  assert.match(page, /<html lang="fr">/);
  assert.match(page, /<meta charset="utf-8">/);
  assert.doesNotMatch(page, /<link\b|<script\b|src="https?:/);
});

test('les données sont échappées', () => {
  const page = html();
  assert.match(page, /Client &lt;Démo&gt;/);
  assert.doesNotMatch(page, /<b>/);
});

test('la page couvre pages, pages non auditées et points à vérifier', () => {
  const page = html();
  assert.match(page, /<h1>/);
  assert.match(page, /Pages auditées/);
  assert.match(page, /https:\/\/client\.example\/panier/);
  assert.match(page, /HTTP 500/);
  assert.match(page, /Points à vérifier manuellement/);
  assert.match(page, /div\.bg/);
});

test('les tableaux ont des en-têtes de colonne et les impacts sont écrits en toutes lettres', () => {
  const page = html();
  assert.match(page, /<th scope="col">/);
  assert.match(page, /Critique/);
  assert.match(page, /Majeur/);
});

test('le devis est résumé', () => {
  assert.match(html(), /Estimation du devis/);
});
