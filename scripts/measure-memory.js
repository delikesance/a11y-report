import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { startFixtureServer } from '../test/fixtures/server.js';
import { scanPages } from '../src/scan.js';

const SAMPLE_INTERVAL_MS = 500;
const BYTES_PER_MB = 1024 * 1024;
const KB_PER_MB = 1024;
const [pageCount, concurrency] = process.argv.slice(2).map(Number);
const run = promisify(execFile);

const pageHtml = (n) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Page ${n}</title></head>
<body><h1>Page ${n}</h1><img src="logo.png"><p>Contenu ${n}</p><a href="#"></a></body></html>`;

async function childrenStats() {
  const { stdout } = await run('ps', ['-eo', 'pid=,ppid=,rss=,comm=']);
  const rows = stdout.trim().split('\n').map((line) => line.trim().split(/\s+/));
  const processes = rows.map(([pid, ppid, rss, comm]) => ({ pid: Number(pid), ppid: Number(ppid), rss: Number(rss), comm }));
  const found = [];
  let frontier = [process.pid];
  while (frontier.length > 0) {
    const next = processes.filter(({ ppid, comm }) => frontier.includes(ppid) && comm !== 'ps');
    found.push(...next);
    frontier = next.map(({ pid }) => pid);
  }
  return { count: found.length, mb: found.reduce((sum, { rss }) => sum + rss, 0) / KB_PER_MB };
}

const root = mkdtempSync(join(tmpdir(), 'a11y-mem-'));
mkdirSync(join(root, 'p'));
for (let n = 1; n <= pageCount; n++) writeFileSync(join(root, 'p', `${n}.html`), pageHtml(n));
const server = await startFixtureServer({ root });
const urls = Array.from({ length: pageCount }, (_, i) => `${server.url}/p/${i + 1}.html`);

let peakHeap = 0;
let peakRss = 0;
let peakChildrenMb = 0;
let peakChildren = 0;
const timer = setInterval(async () => {
  const { heapUsed, rss } = process.memoryUsage();
  peakHeap = Math.max(peakHeap, heapUsed);
  peakRss = Math.max(peakRss, rss);
  const children = await childrenStats().catch(() => ({ count: 0, mb: 0 }));
  peakChildrenMb = Math.max(peakChildrenMb, children.mb);
  peakChildren = Math.max(peakChildren, children.count);
}, SAMPLE_INTERVAL_MS);

global.gc();
const heapBefore = process.memoryUsage().heapUsed;
const scan = await scanPages(urls, { concurrency });
clearInterval(timer);
global.gc();
const heapAfter = process.memoryUsage().heapUsed;
const leftover = await childrenStats();
await server.close();
rmSync(root, { recursive: true, force: true });

const mb = (bytes) => Number((bytes / BYTES_PER_MB).toFixed(1));
console.log(JSON.stringify({
  pageCount,
  concurrency,
  audited: scan.pages.filter((page) => page.audited).length,
  heapAfterGcMb: mb(heapAfter),
  heapDeltaGcMb: mb(heapAfter - heapBefore),
  peakHeapMb: mb(peakHeap),
  peakRssMb: mb(peakRss),
  peakChildrenMb: Math.round(peakChildrenMb),
  peakChildren,
  leftoverChildren: leftover.count,
}));
