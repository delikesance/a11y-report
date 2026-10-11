import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMethodology } from '../src/report/methodology.js';
import { renderManualReview } from '../src/report/manual-review.js';
import { buildReportHtml } from '../src/report.js';

const scan = {
  generatedAt: '2026-10-10T08:00:00.000Z',
  pages: [{ url: 'https://client.example/', title: 'Accueil', violations: [], passes: 10, incomplete: 0 }],
};

test('methodology page explains the score, tools and partial RGAA estimate', () => {
  const html = renderMethodology(scan);
  assert.match(html, /Méthodologie/);
  assert.match(html, /Moteur de règles d&#39;accessibilité : version 4\.\d+\.\d+/);
  assert.match(html, /[Ee]stimation partielle/);
  assert.match(html, /n'est pas une déclaration d'accessibilité/);
});

test('manual review section is omitted when the scan has no unaudited or incomplete fields', () => {
  assert.equal(renderManualReview(scan), '');
});

test('manual review section lists unaudited pages and incomplete points when present', () => {
  const extended = {
    ...scan,
    unauditedPages: ['https://client.example/panne'],
    pages: [{ ...scan.pages[0], incomplete: [{ id: 'color-contrast', help: 'Contraste', nodes: [{ html: '<p>', target: 'p' }] }] }],
  };
  const html = renderManualReview(extended);
  assert.match(html, /https:\/\/client\.example\/panne/);
  assert.match(html, /Contraste/);
});

test('report includes the methodology page and a per-page score column', () => {
  const html = buildReportHtml(scan, { agency: 'Agence', client: 'Client' });
  assert.match(html, /Méthodologie/);
  assert.match(html, /<th class="ap-count">Score<\/th>/);
});
