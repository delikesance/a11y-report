import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServer } from './fixtures/server.js';
import { CLI_PATH, BRANDING_ARGS } from './support/run-cli.js';

const PAGE_COUNT = 50;
const CONCURRENCY = 4;
const SAMPLE_INTERVAL_MS = 250;
const RSS_GROWTH_LIMIT_MB = 1536;
const KB_PER_MB = 1024;

const pageHtml = (n) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Page ${n}</title></head>
<body><h1>Page ${n}</h1><img src="logo.png"><p>Contenu ${n}</p><a href="#"></a></body></html>`;

const ps = () =>
  new Promise((resolve, reject) => {
    execFile('ps', ['-eo', 'pid=,ppid=,rss='], (error, stdout) => {
      if (error) return reject(error);
      const rows = stdout.trim().split('\n').map((line) => line.trim().split(/\s+/).map(Number));
      resolve(rows.map(([pid, ppid, rss]) => ({ pid, ppid, rss })));
    });
  });

const descendantsOf = (rows, rootPid) => {
  const found = [];
  let frontier = [rootPid];
  while (frontier.length > 0) {
    const next = rows.filter((row) => frontier.includes(row.ppid));
    found.push(...next);
    frontier = next.map((row) => row.pid);
  }
  return found;
};

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

describe('charge : audit de 50 pages', () => {
  let server;
  let root;

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'a11y-load-'));
    mkdirSync(join(root, 'p'));
    for (let n = 1; n <= PAGE_COUNT; n++) writeFileSync(join(root, 'p', `${n}.html`), pageHtml(n));
    server = await startFixtureServer({ root });
  });

  after(async () => {
    await server.close();
    rmSync(root, { recursive: true, force: true });
  });

  test(`${PAGE_COUNT} pages, --concurrency ${CONCURRENCY} : croissance RSS bornée et aucun chromium résiduel`, async (t) => {
    const outDir = mkdtempSync(join(tmpdir(), 'a11y-load-out-'));
    const urls = Array.from({ length: PAGE_COUNT }, (_, i) => `${server.url}/p/${i + 1}.html`);
    const args = [CLI_PATH, ...urls, '--concurrency', String(CONCURRENCY), '--format', 'json', '--out', outDir, ...BRANDING_ARGS];

    const child = execFile(process.execPath, args);
    const seen = new Set();
    const samples = [];
    const started = Date.now();
    const sample = async () => {
      const rows = await ps().catch(() => []);
      const tree = descendantsOf(rows, child.pid);
      tree.forEach((row) => seen.add(row.pid));
      const totalKb = tree.reduce((sum, row) => sum + row.rss, 0);
      samples.push(totalKb);
    };
    const exited = new Promise((resolve) => child.on('exit', (code) => resolve(code)));
    while (child.exitCode === null && child.signalCode === null) {
      await sample();
      await new Promise((resolve) => setTimeout(resolve, SAMPLE_INTERVAL_MS));
    }
    const code = await exited;
    const durationS = (Date.now() - started) / 1000;

    assert.equal(code, 0);
    assert.equal(JSON.parse(readFileSync(join(outDir, 'rapport.json'), 'utf8')).pages.length, PAGE_COUNT);

    const baselineMb = samples[0] / KB_PER_MB;
    const peakMb = Math.max(...samples) / KB_PER_MB;
    const growthMb = peakMb - baselineMb;
    const leftovers = [...seen].filter(alive);
    t.diagnostic(`durée=${durationS.toFixed(1)}s baseline=${baselineMb.toFixed(0)}MB pic=${peakMb.toFixed(0)}MB croissance=${growthMb.toFixed(0)}MB processus_vus=${seen.size} résiduels=${leftovers.length}`);

    assert.ok(growthMb < RSS_GROWTH_LIMIT_MB, `croissance RSS ${growthMb.toFixed(0)} MB >= ${RSS_GROWTH_LIMIT_MB} MB`);
    assert.deepEqual(leftovers, []);
  });
});
