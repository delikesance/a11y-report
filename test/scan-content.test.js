import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFixtureServer } from './fixtures/server.js';
import { scanPages } from '../src/scan.js';

const FAST = { timeoutMs: 5000, retries: 0, backoffMs: 10 };

let fixture;

before(async () => {
  fixture = await startFixtureServer();
});

after(() => fixture.close());

const scanOne = async (path) => {
  const [page] = (await scanPages([`${fixture.url}${path}`], FAST)).pages;
  return page;
};

describe('scan of valid pages', () => {
  it('audits a slow page that answers after its delay', async () => {
    const page = await scanOne('/slow?ms=200');
    assert.equal(page.audited, true);
    assert.equal(page.error, null);
    assert.equal(page.title, 'Lent');
  });

  it('audits a single-page app once its content has loaded', async () => {
    const page = await scanOne('/spa');
    assert.equal(page.audited, true);
    assert.equal(page.title, 'SPA');
  });

  for (const file of ['latin1', 'windows-1252', 'big5', 'utf8-bom']) {
    it(`audits the ${file} charset fixture`, async () => {
      const page = await scanOne(`/charsets/${file}.html`);
      assert.equal(page.audited, true);
      assert.equal(page.error, null);
    });
  }

  it('keeps axe incomplete results with their nodes', async () => {
    const page = await scanOne('/healthy/home.html');
    assert.ok(Array.isArray(page.incomplete));
    for (const item of page.incomplete) {
      assert.equal(typeof item.id, 'string');
      assert.ok(item.nodes.length > 0);
      assert.equal(typeof item.nodes[0].target, 'string');
      assert.equal(typeof item.nodes[0].html, 'string');
      assert.equal(typeof item.nodes[0].failureSummary, 'string');
    }
  });
});
