import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildReportHtml, renderPdf } from '../src/report.js';

const scan = {
  generatedAt: '2026-10-10T08:00:00.000Z',
  pages: [
    {
      url: 'https://client.example/accueil',
      title: 'Accueil <b>',
      passes: 40,
      incomplete: 2,
      violations: [
        {
          id: 'image-alt',
          impact: 'critical',
          help: 'Images must have alternate text',
          description: 'Images need alt text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
          tags: ['wcag2a'],
          nodes: [
            { html: '<img src="logo.png"><script>alert(1)</script>', target: 'img.logo', failureSummary: 'Add alt' },
            { html: '<img src="hero.jpg">', target: 'img.hero', failureSummary: 'Add alt' },
          ],
        },
      ],
    },
    {
      url: 'https://client.example/contact',
      title: 'Contact',
      passes: 30,
      incomplete: 0,
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          help: 'Elements must meet contrast',
          description: 'Low contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
          tags: ['wcag2aa'],
          nodes: [{ html: '<p class="lead">Texte</p>', target: 'p.lead', failureSummary: 'Raise contrast' }],
        },
      ],
    },
    {
      url: 'https://client.example/panne',
      title: '',
      passes: 0,
      incomplete: 0,
      violations: [],
      error: 'net::ERR_NAME_NOT_RESOLVED',
    },
  ],
};

const branding = {
  agency: 'Agence Lumière',
  client: 'Client Alpha',
  primaryColor: '#123456',
  accentColor: '#abcdef',
  contact: 'contact@agence.example',
  date: '11 octobre 2026',
};

const withoutLinks = (html) => html.replace(/href="[^"]*"/g, '');

test('escapes HTML coming from scanned pages', () => {
  const html = buildReportHtml(scan, branding);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('Accueil &lt;b&gt;'));
});

test('applies agency colors and falls back on invalid ones', () => {
  const html = buildReportHtml(scan, branding);
  assert.ok(html.includes('--primary:#123456'));
  assert.ok(html.includes('--accent:#abcdef'));
  assert.ok(html.includes('Agence Lumière'));

  const unsafe = buildReportHtml(scan, { ...branding, primaryColor: 'red;background:url(x)' });
  assert.ok(unsafe.includes('--primary:#1f3a5f'));
});

test('computes score, fix time and severity order', () => {
  const html = buildReportHtml(scan, branding);
  assert.match(html, /class="score">85</);
  assert.ok(html.includes('<p class="time">15 min</p>'));
  assert.ok(html.indexOf('Titre image-alt') < html.indexOf('Titre color-contrast'));
});

test('does not mention any third-party brand outside links', () => {
  const html = withoutLinks(buildReportHtml(scan, branding));
  assert.doesNotMatch(html, /axe|deque|playwright|chromium/i);
});

test('renders a valid PDF', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'report-'));
  const outPath = join(dir, 'rapport.pdf');
  await renderPdf(buildReportHtml(scan, branding), outPath);
  const header = (await readFile(outPath)).subarray(0, 4).toString('latin1');
  assert.equal(header, '%PDF');
  assert.ok((await stat(outPath)).size > 10 * 1024);
});
