import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { scanPages } from '../src/scan.js';

const KNOWN_PAGE = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Page de test</title></head>
<body>
  <img src="logo.png">
  <button></button>
  <p style="color:#aaa;background:#fff">Texte à faible contraste</p>
</body>
</html>`;

const IMPACTS = ['critical', 'serious', 'moderate', 'minor'];

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(KNOWN_PAGE);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function closedPortUrl() {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(`http://127.0.0.1:${port}/`));
    });
  });
}

describe('scanPages', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = await startServer();
    baseUrl = `http://127.0.0.1:${server.address().port}/`;
  });

  after(() => new Promise((resolve) => server.close(resolve)));

  it('reports known violations with impacts and nodes', async () => {
    const scan = await scanPages([baseUrl]);

    assert.ok(!Number.isNaN(Date.parse(scan.generatedAt)));
    assert.equal(scan.pages.length, 1);
    const [page] = scan.pages;
    assert.equal(page.error, null);
    assert.equal(page.audited, true);
    assert.equal(page.title, 'Page de test');
    assert.equal(typeof page.passes, 'number');
    assert.ok(Array.isArray(page.incomplete));

    for (const expectedId of ['image-alt', 'button-name', 'color-contrast']) {
      const violation = page.violations.find((v) => v.id === expectedId);
      assert.ok(violation, `violation ${expectedId} absente`);
      assert.ok(IMPACTS.includes(violation.impact));
      assert.ok(violation.nodes.length > 0);
      assert.equal(typeof violation.nodes[0].target, 'string');
      assert.equal(typeof violation.nodes[0].html, 'string');
    }
  });

  it('reports an unreachable page as an error without throwing', async () => {
    const unreachableUrl = await closedPortUrl();

    const scan = await scanPages([unreachableUrl]);

    const [page] = scan.pages;
    assert.equal(page.url, unreachableUrl);
    assert.equal(typeof page.error, 'string');
    assert.deepEqual(page.violations, []);
  });
});
