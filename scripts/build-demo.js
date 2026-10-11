#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { copyFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFixtureServer } from '../test/fixtures/server.js';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CLI_PATH = join(ROOT_DIR, 'src', 'cli.js');
export const SITE_ASSETS_DIR = join(ROOT_DIR, 'site', 'assets');
export const DEMO_PAGES = [
  '/healthy/home.html',
  '/healthy/article.html',
  '/healthy/form.html',
  '/faulty/img-no-alt.html',
  '/faulty/form-no-label.html',
  '/faulty/heading-order.html',
  '/faulty/low-contrast.html',
];
export const DEMO_BRANDING = [
  '--agency', 'Atelier Démo',
  '--client', 'Boutique Exemple',
  '--contact', 'contact@atelier-demo.example',
  '--color', '#1d4ed8',
];
export const DEMO_OUTPUTS = ['rapport.pdf', 'rapport.html'];
export const DEMO_ASSET_NAMES = { 'rapport.pdf': 'exemple-rapport.pdf', 'rapport.html': 'exemple-rapport.html' };

export const cliArgs = (urls, outDir) => [...urls, ...DEMO_BRANDING, '--format', 'pdf,html', '--out', outDir];

const runCli = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve(undefined) : reject(new Error(`CLI en échec (code ${code})`))));
  });

export async function buildDemo({ assetsDir = SITE_ASSETS_DIR } = {}) {
  const server = await startFixtureServer();
  const outDir = await mkdtemp(join(tmpdir(), 'a11y-demo-'));
  try {
    const urls = DEMO_PAGES.map((page) => `${server.url}${page}`);
    await runCli(cliArgs(urls, `${outDir}/`));
  } finally {
    await server.close();
  }
  for (const name of DEMO_OUTPUTS) {
    await copyFile(join(outDir, name), join(assetsDir, DEMO_ASSET_NAMES[name]));
  }
  return DEMO_OUTPUTS.map((name) => join(assetsDir, DEMO_ASSET_NAMES[name]));
}

const isEntrypoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntrypoint) {
  const written = await buildDemo();
  for (const path of written) process.stdout.write(`Rapport démo écrit : ${path}\n`);
}
