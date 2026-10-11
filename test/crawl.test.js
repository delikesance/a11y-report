import { it, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { crawl, normalizeUrl } from '../src/crawl.js';
import { startFixtureServer } from './fixtures/server.js';

const NO_DELAY = { delayMs: 0 };
const HOME = '/healthy/home.html';
const urlsOf = (result) => result.pages.map((page) => page.url);
const skippedWith = (result, reason) => result.skipped.filter((item) => item.reason === reason).map((item) => item.url);

describe('normalizeUrl', () => {
  it('drops the fragment, utm parameters and the trailing slash', () => {
    assert.equal(normalizeUrl('https://site.test/a/?utm_source=x&b=1#top', 'https://site.test'), 'https://site.test/a?b=1');
  });

  it('resolves relative links against the base URL', () => {
    assert.equal(normalizeUrl('../c.html', 'https://site.test/a/b/'), 'https://site.test/a/c.html');
  });

  it('rejects non-http schemes', () => {
    assert.equal(normalizeUrl('mailto:contact@site.test', 'https://site.test'), null);
  });
});

describe('crawl on the fixture server', () => {
  let fixture;
  let base;

  before(async () => {
    fixture = await startFixtureServer();
    base = fixture.url;
  });

  after(async () => {
    await fixture.close();
  });

  it('starts with the start URL and reads the sitemap, without duplicates', async () => {
    const urls = urlsOf(await crawl(`${base}${HOME}`, NO_DELAY));
    assert.equal(urls[0], `${base}${HOME}`);
    assert.equal(new Set(urls).size, urls.length);
    assert.ok(urls.some((url) => url.startsWith(`${base}/faulty/`)));
  });

  it('does not include pages disallowed by robots.txt', async () => {
    const result = await crawl(`${base}/private/page.html`, { ...NO_DELAY, sitemap: false });
    assert.deepEqual(urlsOf(result), []);
    assert.deepEqual(skippedWith(result, 'robots'), [`${base}/private/page.html`]);
  });

  it('fetches disallowed pages when respectRobots is false', async () => {
    const result = await crawl(`${base}/private/page.html`, { ...NO_DELAY, sitemap: false, respectRobots: false });
    assert.deepEqual(urlsOf(result), [`${base}/private/page.html`]);
  });

  it('reports non-HTML resources as skipped', async () => {
    const result = await crawl(`${base}/pdf`, { ...NO_DELAY, sitemap: false });
    assert.deepEqual(urlsOf(result), []);
    assert.deepEqual(skippedWith(result, 'non-html'), [`${base}/pdf`]);
  });

  it('skips URLs matching an exclude glob', async () => {
    const result = await crawl(`${base}${HOME}`, { ...NO_DELAY, exclude: ['/faulty/*'] });
    assert.ok(skippedWith(result, 'exclude').length > 0);
    assert.ok(!urlsOf(result).some((url) => url.includes('/faulty/')));
  });

  it('stops at maxPages and reports the remaining URLs as capped', async () => {
    const result = await crawl(`${base}${HOME}`, { ...NO_DELAY, maxPages: 2 });
    assert.equal(result.pages.length, 2);
    assert.ok(skippedWith(result, 'cap').length > 0);
  });

  it('does not follow links beyond depth 0', async () => {
    const result = await crawl(`${base}${HOME}`, { ...NO_DELAY, depth: 0, sitemap: false });
    assert.deepEqual(urlsOf(result), [`${base}${HOME}`]);
  });

  it('waits delayMs between page requests', async () => {
    const delayMs = 100;
    const started = Date.now();
    await crawl(`${base}${HOME}`, { delayMs, maxPages: 3 });
    assert.ok(Date.now() - started >= 2 * delayMs);
  });
});

describe('crawl with a sitemapindex declared in robots.txt', () => {
  let server;
  let site;

  const routes = {
    '/robots.txt': ['text/plain', () => `Sitemap: ${site}/index-sitemap.xml\n`],
    '/index-sitemap.xml': ['application/xml', () => `<sitemapindex><sitemap><loc>${site}/part.xml</loc></sitemap></sitemapindex>`],
    '/part.xml': [
      'application/xml',
      () => `<urlset><url><loc>${site}/a.html?utm_medium=mail#x</loc></url><url><loc>${site}/a.html</loc></url></urlset>`,
    ],
    '/a.html': ['text/html', () => '<h1>A</h1>'],
  };

  const serve = (req, res) => {
    const route = routes[req.url];
    if (!route) return res.writeHead(404).end();
    const [type, body] = route;
    res.writeHead(200, { 'Content-Type': type }).end(body());
  };

  before(async () => {
    server = createServer(serve);
    await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
    site = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    server.closeAllConnections();
  });

  it('follows the sitemapindex and keeps one normalised URL', async () => {
    const result = await crawl(`${site}/`, NO_DELAY);
    assert.deepEqual(urlsOf(result), [`${site}/a.html`]);
    assert.equal(result.pages[0].reason, 'sitemap');
  });
});
