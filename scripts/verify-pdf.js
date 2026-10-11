#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERAPDF_IMAGE = 'verapdf/cli:latest';
const FLAVOUR = 'ua1';
const USAGE = 'Usage : npm run verify:pdf -- <fichier.pdf...> (nécessite docker)\n';

export const verapdfAvailable = () => spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0;

const mountArgs = (pdfPath, index) => ['-v', `${dirname(pdfPath)}:/data/${index}:ro`];
const containerPath = (pdfPath, index) => `/data/${index}/${basename(pdfPath)}`;

export function verifyPdfs(pdfPaths) {
  const absolute = pdfPaths.map((pdfPath) => resolve(pdfPath));
  const args = ['run', '--rm'];
  absolute.forEach((pdfPath, index) => args.push(...mountArgs(pdfPath, index)));
  args.push(VERAPDF_IMAGE, '--flavour', FLAVOUR, ...absolute.map(containerPath));
  const result = spawnSync('docker', args, { encoding: 'utf8' });
  return { status: result.status ?? 1, output: `${result.stdout}${result.stderr}` };
}

const runFromCli = (pdfPaths) => {
  if (pdfPaths.length === 0 || !verapdfAvailable()) {
    process.stderr.write(USAGE);
    process.exit(1);
  }
  const { status, output } = verifyPdfs(pdfPaths);
  process.stdout.write(output);
  process.exit(status);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) runFromCli(process.argv.slice(2));
