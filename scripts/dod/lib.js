import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const OUT_DIR = `${ROOT}out`;
const TAIL_LINES = 12;

export const ensureOutDir = () => mkdirSync(OUT_DIR, { recursive: true });

export function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT });
    let output = '';
    const collect = (chunk) => {
      output += chunk;
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', (error) => resolve({ status: 1, output: `${error}` }));
    child.on('close', (status) => resolve({ status: status ?? 1, output }));
  });
}

export const tail = (text) => text.trim().split('\n').slice(-TAIL_LINES).join('\n');

export const statusOf = (ok) => (ok ? 'PASS' : 'FAIL');

export const result = (id, name, status, evidence, output = '') => ({
  id,
  name,
  status,
  evidence: evidence.replace(/\s+/g, ' ').trim(),
  output: tail(output),
});
