import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFixtureServer } from './fixtures/server.js';
import { scanPages } from '../src/scan.js';
import { parseViewport } from '../src/viewport.js';

const RESPONSIVE_PAGE = '/viewport/responsive.html';
const HEALTHY_PAGES = ['/healthy/home.html', '/healthy/article.html', '/healthy/form.html'];
const DESKTOP = parseViewport('desktop');
const MOBILE = parseViewport('mobile');

describe('scanPages concurrency and viewports', () => {
  let fixture;
  let urls;

  before(async () => {
    fixture = await startFixtureServer();
    urls = [...HEALTHY_PAGES, RESPONSIVE_PAGE].map((path) => `${fixture.url}${path}`);
  });

  after(async () => {
    await fixture.close();
  });

  it('concurrency 4 gives the same results as concurrency 1', async () => {
    const sequential = await scanPages(urls, { concurrency: 1, viewports: [DESKTOP] });
    const parallel = await scanPages(urls, { concurrency: 4, viewports: [DESKTOP] });
    assert.deepEqual(parallel.pages, sequential.pages);
  });

  it('returns one result per viewport and URL, in input order, each tagged with its viewport', async () => {
    const scan = await scanPages(urls.slice(0, 2), { concurrency: 2, viewports: [DESKTOP, MOBILE] });
    assert.deepEqual(
      scan.pages.map((page) => [page.url, page.viewport]),
      [
        [urls[0], 'desktop'], [urls[1], 'desktop'],
        [urls[0], 'mobile'], [urls[1], 'mobile'],
      ],
    );
  });

  it('a viewport changes the rendered layout the audit sees', async () => {
    const [desktop, mobile] = (await scanPages([`${fixture.url}${RESPONSIVE_PAGE}`], {
      viewports: [DESKTOP, MOBILE],
    })).pages;
    const buttonName = (page) => page.violations.filter((violation) => violation.id === 'button-name');
    assert.equal(buttonName(desktop).length, 0);
    assert.equal(buttonName(mobile).length, 1);
  });
});

describe('scanPages option validation', () => {
  it('rejects a concurrency below 1', async () => {
    await assert.rejects(scanPages([], { concurrency: 0 }), /Concurrence invalide/);
  });
});
