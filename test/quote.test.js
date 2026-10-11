import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeQuote } from '../src/report/quote-calc.js';
import { renderQuote } from '../src/report/quote.js';

const problem = (id, titre, impact, occurrences, minutesParOccurrence) => ({
  id,
  impact,
  occurrences,
  nodes: Array.from({ length: occurrences }, (_, index) => ({ html: `<${id}-${index}>`, target: `#${id}-${index}` })),
  rule: { titre, minutesParOccurrence },
});

const problems = [
  problem('image-alt', 'Images sans alternative', 'critical', 2, 30),
  problem('color-contrast', 'Contraste insuffisant', 'serious', 1, 20),
  problem('region', 'Contenu hors repère', 'minor', 4, 10),
];

const branding = {
  agency: 'Studio Exemple',
  contact: 'contact@studio.example',
  phone: '01 23 45 67 89',
};

const render = (overrides = {}) => renderQuote(computeQuote(problems, { tjm: 60 }), problems, { ...branding, ...overrides });

test('renderQuote lists each phase with its count, severity and first titles', () => {
  const html = render();

  assert.match(html, /1 problème critique : Images sans alternative/);
  assert.match(html, /1 problème majeur : Contraste insuffisant/);
  assert.match(html, /1 problème modéré ou mineur : Contenu hors repère/);
});

test('renderQuote shows phase hours, phase prices and the total', () => {
  const html = render();

  assert.match(html, /<strong class="qt-cell__value">1 h<\/strong>/);
  assert.match(html, /198 € HT/);
});

test('renderQuote shows the validity, contact and phone from branding', () => {
  const html = render();

  assert.match(html, /Devis valable 30 jours/);
  assert.match(html, /contact@studio\.example/);
  assert.match(html, /01 23 45 67 89/);
});

test('renderQuote uses branding quoteValidityDays when provided', () => {
  assert.match(render({ quoteValidityDays: 45 }), /Devis valable 45 jours/);
});

test('renderQuote marks an empty phase as having no problem', () => {
  const onlyCritical = [problems[0]];
  const html = renderQuote(computeQuote(onlyCritical, {}), onlyCritical, branding);

  assert.match(html, /qt-phase--genants qt-phase--empty/);
  assert.match(html, /Aucun problème/);
  assert.match(html, /<strong class="qt-cell__value">—<\/strong>/);
});

test('renderQuote escapes branding values', () => {
  const html = render({ contact: '<script>alert(1)</script>' });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('renderQuote does not mention third-party tools', () => {
  assert.doesNotMatch(render(), /axe|deque|playwright|chromium/i);
});
