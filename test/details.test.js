import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDetails } from '../src/report/details.js';

const problem = (overrides = {}) => ({
  id: 'select-name',
  impact: 'critical',
  occurrences: 2,
  nodes: [
    { html: '<select onchange="location.href = this.value;">', target: ['#ville'] },
    { html: '<select id="pays">', target: ['#pays'] },
  ],
  pages: [
    { url: 'https://client.example/accueil' },
    { url: 'https://client.example/contact' },
  ],
  rule: {
    titre: 'Liste déroulante sans nom accessible',
    pourquoi: "Un lecteur d'écran annonce « liste déroulante » sans dire à quoi elle sert.",
    correction: 'Associer un libellé visible à la liste.',
    avant: '<select><option>Paris</option></select>',
    apres: '<label for="ville">Ville</label><select id="ville"></select>',
    minutesParOccurrence: 15,
    rgaa: '11.1',
  },
  ...overrides,
});

test('renderDetails renders one card per problem with its key data', () => {
  const html = renderDetails([problem()]);

  assert.match(html, /Priorité 1 · Critère RGAA 11\.1 · 2 pages concernées/);
  assert.match(html, /Liste déroulante sans nom accessible/);
  assert.match(html, /Associer un libellé visible/);
  assert.match(html, /15 min par occurrence/);
  assert.match(html, /<strong>2<\/strong>/);
  assert.match(html, /Critique/);
});

test('renderDetails shows paths only when all pages share an origin', () => {
  const html = renderDetails([problem()]);

  assert.match(html, /\/accueil<br>\/contact/);
  assert.doesNotMatch(html, /https:\/\/client\.example/);
});

test('renderDetails keeps full URLs when origins differ', () => {
  const html = renderDetails([
    problem({ pages: [{ url: 'https://client.example/accueil' }, { url: 'https://autre.example/contact' }] }),
  ]);

  assert.match(html, /https:\/\/client\.example\/accueil/);
  assert.match(html, /https:\/\/autre\.example\/contact/);
});

test('renderDetails truncates and escapes snippets and text', () => {
  const trap = '<script>alert(1)</script>';
  const html = renderDetails([
    problem({ nodes: [{ html: `<p>${'x'.repeat(300)}</p>`, target: ['p'] }] }),
    problem({ rule: { ...problem().rule, titre: trap } }),
  ]);

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /…/);
});

test('renderDetails shows at most three nodes per problem', () => {
  const nodes = [1, 2, 3, 4].map((index) => ({ html: `<img id="i${index}">`, target: [`#i${index}`] }));
  const html = renderDetails([problem({ nodes })]);

  assert.match(html, /#i3/);
  assert.doesNotMatch(html, /#i4/);
});

test('renderDetails names no third-party tool', () => {
  const html = renderDetails([problem()]);

  assert.doesNotMatch(html, /axe|deque|playwright|chromium/i);
});
