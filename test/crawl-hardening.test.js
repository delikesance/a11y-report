import { it, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { crawl } from '../src/crawl.js';

const NO_DELAY = { delayMs: 0 };
const html = (links = '') => `<!doctype html><html><body>${links}</body></html>`;

function listen(handler) {
  return new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}
const baseOf = (server) => `http://127.0.0.1:${server.address().port}`;
const pagesOf = (result) => result.pages.map((item) => item.url);

describe('crawl : délai maximal par requête', () => {
  let server;

  before(async () => {
    server = await listen((req, res) => {
      if (req.url === '/hang') return;
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html());
    });
  });

  after(() => {
    server.closeAllConnections();
    server.close();
  });

  it('abandonne une page qui ne répond pas après timeoutMs', async () => {
    const result = await crawl(`${baseOf(server)}/hang`, { ...NO_DELAY, sitemap: false, timeoutMs: 100 });
    assert.deepEqual(result.pages, []);
    assert.equal(result.skipped[0].reason, 'unreachable');
  });
});

describe('crawl : entités HTML dans les liens et le sitemap', () => {
  let server;

  before(async () => {
    server = await listen((req, res) => {
      if (req.url === '/sitemap.xml') {
        res.writeHead(200, { 'content-type': 'application/xml' });
        return res.end(`<urlset><url><loc>${baseOf(server)}/b?x=1&amp;y=2</loc></url></urlset>`);
      }
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html('<a href="/c?x=1&amp;y=3">c</a>'));
    });
  });

  after(() => {
    server.close();
  });

  it('décode &amp; dans les href et les loc du sitemap', async () => {
    const urls = pagesOf(await crawl(baseOf(server), { ...NO_DELAY }));
    assert.ok(urls.includes(`${baseOf(server)}/b?x=1&y=2`));
    assert.ok(urls.includes(`${baseOf(server)}/c?x=1&y=3`));
  });
});

describe('crawl : redirection hors origine', () => {
  let foreign;
  let local;

  before(async () => {
    foreign = await listen((req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html());
    });
    local = await listen((req, res) => {
      if (req.url === '/out') {
        res.writeHead(302, { location: `${baseOf(foreign)}/elsewhere` });
        return res.end();
      }
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html('<a href="/out">out</a>'));
    });
  });

  after(() => {
    foreign.close();
    local.close();
  });

  it('ignore la page finale hors origine et la signale offsite-redirect', async () => {
    const result = await crawl(baseOf(local), { ...NO_DELAY, sitemap: false });
    assert.deepEqual(pagesOf(result), [`${baseOf(local)}/`]);
    assert.ok(result.skipped.some((item) => item.url === `${baseOf(local)}/out` && item.reason === 'offsite-redirect'));
  });
});
