import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCover } from '../src/report/cover.js';
import { renderSummary } from '../src/report/summary.js';
import { computeQuote } from '../src/report/model.js';

const TRAP = '<script>alert(1)</script>';
const THIRD_PARTY_BRAND = /axe|deque|playwright|chromium/i;

const problem = (id, impact, occurrences, titre) => ({
  id,
  impact,
  occurrences,
  nodes: [],
  pages: [],
  rule: { titre, minutesParOccurrence: 30 },
});

const problems = [
  problem('image-alt', 'critical', 2, 'Image sans texte alternatif'),
  problem('select-name', 'serious', 1, 'Liste déroulante sans nom accessible'),
  problem('html-has-lang', 'minor', 1, 'Langue de la page non déclarée'),
];
const scan = { pages: [{}, {}, {}] };
const score = 55;
const date = '11 octobre 2026';

const branding = {
  agency: 'Studio Exemple',
  client: TRAP,
  contact: 'contact@studio-exemple.fr',
};

test('cover shows client, score, problem counts and date', () => {
  const html = renderCover(scan, branding, date, problems, score);

  assert.match(html, /55<span class="cv-score-max">\/100<\/span>/);
  assert.match(html, /<strong>3 problèmes<\/strong>/);
  assert.match(html, /<strong>1 critiques<\/strong>/);
  assert.match(html, /Constat chiffré sur 3 pages/);
  assert.match(html, /11 octobre 2026/);
  assert.match(html, /contact@studio-exemple\.fr/);
});

test('cover escapes branding values', () => {
  const html = renderCover(scan, branding, date, problems, score);

  assert.ok(!html.includes(TRAP));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('cover uses a dash when contact is missing', () => {
  const html = renderCover(scan, { ...branding, contact: undefined }, date, problems, score);

  assert.match(html, /Contact<\/div>—/);
});

test('summary shows severity bars, estimated hours, projected score and priorities', () => {
  const quote = computeQuote(problems, 60);
  const html = renderSummary(problems, score, quote, branding);

  assert.match(html, /class="sy-bar critical"/);
  assert.match(html, /2 heures/);
  assert.match(html, /99 \/ 100/);
  assert.match(html, /Image sans texte alternatif/);
  assert.match(html, /Liste déroulante sans nom accessible/);
});

test('summary escapes problem titles', () => {
  const trapped = [problem('image-alt', 'critical', 1, TRAP)];
  const quote = computeQuote(trapped, 60);
  const html = renderSummary(trapped, score, quote, branding);

  assert.ok(!html.includes(TRAP));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('cover and summary carry no third-party brand', () => {
  const quote = computeQuote(problems, 60);

  assert.doesNotMatch(renderCover(scan, branding, date, problems, score), THIRD_PARTY_BRAND);
  assert.doesNotMatch(renderSummary(problems, score, quote, branding), THIRD_PARTY_BRAND);
});
