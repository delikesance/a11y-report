import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startFixtureServer } from './fixtures/server.js';
import { scanPages } from '../src/scan.js';

const FAST = { timeoutMs: 1000, retries: 1, backoffMs: 10 };

let fixture;

before(async () => {
  fixture = await startFixtureServer();
});

after(() => fixture.close());

const scanOne = async (path, options = FAST) => {
  const [page] = (await scanPages([`${fixture.url}${path}`], options)).pages;
  return page;
};

describe('scan of HTTP errors', () => {
  for (const [code, cause] of [[404, 'page en erreur'], [500, 'erreur serveur'], [503, 'erreur serveur']]) {
    it(`/status/${code} is not audited and carries the French cause`, async () => {
      const page = await scanOne(`/status/${code}`);
      assert.equal(page.status, code);
      assert.equal(page.audited, false);
      assert.equal(page.error, `HTTP ${code} : ${cause}`);
      assert.deepEqual(page.violations, []);
    });
  }
});

describe('scan of redirects', () => {
  it('follows a chain of 3 redirects and records each hop', async () => {
    const page = await scanOne('/redirect/3');
    assert.equal(page.redirects.length, 3);
    assert.equal(page.finalUrl, `${fixture.url}/healthy/home.html`);
    assert.equal(page.audited, true);
    assert.equal(page.error, null);
  });

  it('refuses a redirect loop without auditing', async () => {
    const page = await scanOne('/redirect-loop');
    assert.equal(page.audited, false);
    assert.equal(page.error, 'boucle de redirection');
  });

  it('refuses more than 10 redirects', async () => {
    const page = await scanOne('/redirect/11');
    assert.equal(page.audited, false);
    assert.equal(page.error, 'trop de redirections (plus de 10)');
  });
});

describe('scan of unusable responses', () => {
  it('reports a page that never answers as a timeout', async () => {
    const page = await scanOne('/timeout');
    assert.equal(page.audited, false);
    assert.equal(page.error, 'délai de réponse dépassé');
  });

  it('refuses an empty page', async () => {
    const page = await scanOne('/empty');
    assert.equal(page.audited, false);
    assert.equal(page.error, 'page vide');
  });

  it('refuses a non-HTML content type', async () => {
    const page = await scanOne('/pdf');
    assert.equal(page.audited, false);
    assert.equal(page.error, 'fichier téléchargé au lieu d\'une page HTML');
  });
});
