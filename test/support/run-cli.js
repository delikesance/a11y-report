import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const CLI_PATH = fileURLToPath(new URL('../../src/cli.js', import.meta.url));
export const BRANDING_ARGS = ['--client', 'Acme', '--agency', 'Agence'];
const CLI_TIMEOUT_MS = 240_000;

/** @param {string[]} args @param {{cwd?: string}} [options] */
export function runCli(args, { cwd } = {}) {
  return new Promise((resolve) => {
    execFile(process.execPath, [CLI_PATH, ...args], { cwd, timeout: CLI_TIMEOUT_MS }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, stdout, stderr });
    });
  });
}
