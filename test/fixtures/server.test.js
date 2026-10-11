import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServer } from './server.js';

/** @type {RequestInit} */
const MANUAL = { redirect: 'manual' };
const SLOW_MS = 200;
const TIMEOUT_MS = 300;
const BIG_ELEMENT_COUNT = 5000;

let fixture;
let base;

before(async () => {
  fixture = await startFixtureServer();
  base = fixture.url;
});

after(async () => {
  await fixture.close();
});

/** @param {string} path @param {RequestInit} [init] */
const get = (path, init = MANUAL) => fetch(`${base}${path}`, init);

describe('status routes', () => {
  for (const code of [404, 500, 503]) {
    test(`/status/${code} answers ${code}`, async () => {
      const res = await get(`/status/${code}`);
      assert.equal(res.status, code);
      assert.match(res.headers.get('content-type') ?? '', /^text\/html/);
    });
  }
});

describe('redirect routes', () => {
  test('/redirect/N chains N hops before the home page', async () => {
    let path = '/redirect/3';
    let hops = 0;
    while (path.startsWith('/redirect/')) {
      const res = await get(path);
      assert.equal(res.status, 302);
      path = res.headers.get('location') ?? '';
      hops += 1;
    }
    assert.equal(hops, 3);
    assert.equal(path, '/healthy/home.html');
  });

  test('/redirect-loop redirects to itself', async () => {
    const res = await get('/redirect-loop');
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), '/redirect-loop');
  });
});

describe('timing routes', () => {
  test('/slow?ms=N delays the response by at least N ms', async () => {
    const started = Date.now();
    const res = await get(`/slow?ms=${SLOW_MS}`);
    assert.equal(res.status, 200);
    assert.ok(Date.now() - started >= SLOW_MS - 10);
  });

  test('/timeout never responds', async () => {
    await assert.rejects(get('/timeout', { signal: AbortSignal.timeout(TIMEOUT_MS) }), { name: 'TimeoutError' });
  });
});

describe('content routes', () => {
  test('/empty answers 200 with an empty body', async () => {
    const res = await get('/empty');
    assert.equal(res.status, 200);
    assert.equal(await res.text(), '');
  });

  test('/pdf is served as application/pdf', async () => {
    const res = await get('/pdf');
    assert.equal(res.headers.get('content-type'), 'application/pdf');
    assert.ok((await res.text()).startsWith('%PDF'));
  });

  test('/robots.txt disallows /private/', async () => {
    const res = await get('/robots.txt');
    assert.equal(res.status, 200);
    assert.match(await res.text(), /Disallow: \/private\//);
  });

  test('/private/page.html is served', async () => {
    const res = await get('/private/page.html');
    assert.equal(res.status, 200);
  });

  test('/sitemap.xml is an XML urlset', async () => {
    const res = await get('/sitemap.xml');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^application\/xml/);
    assert.match(await res.text(), /<urlset[\s>]/);
  });

  test('/spa renders a container and a script that injects content later', async () => {
    const body = await (await get('/spa')).text();
    assert.match(body, /<main id="app"><\/main>/);
    assert.match(body, /insertAdjacentHTML/);
  });

  test('/big contains 5000 paragraph elements', async () => {
    const body = await (await get('/big')).text();
    assert.equal((body.match(/<p>/g) ?? []).length, BIG_ELEMENT_COUNT);
  });
});

describe('static serving', () => {
  test('unknown path answers 404', async () => {
    const res = await get('/does-not-exist.html');
    assert.equal(res.status, 404);
  });

  test('text files carry a utf-8 charset and MIME type from the extension', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fixtures-'));
    try {
      await writeFile(join(dir, 'style.css'), 'body{}');
      const server = await startFixtureServer({ root: dir });
      try {
        const res = await fetch(`${server.url}/style.css`);
        assert.equal(res.headers.get('content-type'), 'text/css; charset=utf-8');
      } finally {
        await server.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('files under charsets/ honor the charset in their name', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fixtures-'));
    try {
      await mkdir(join(dir, 'charsets'));
      await writeFile(join(dir, 'charsets', 'latin.iso-8859-1.html'), Buffer.from('<p>café</p>', 'latin1'));
      const server = await startFixtureServer({ root: dir });
      try {
        const res = await fetch(`${server.url}/charsets/latin.iso-8859-1.html`);
        assert.equal(res.headers.get('content-type'), 'text/html; charset=iso-8859-1');
        const decoded = new TextDecoder('iso-8859-1').decode(await res.arrayBuffer());
        assert.equal(decoded, '<p>café</p>');
      } finally {
        await server.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
