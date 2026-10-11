import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import axe from 'axe-core';
import { ROOT, result, run, statusOf } from './lib.js';

const COVERAGE_MIN = 85;
const AXE_RULE_COUNT = 105;
const PACKAGE = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const TEST_DIR = join(ROOT, 'test');
const TEST_FILES = readdirSync(TEST_DIR).filter((name) => name.endsWith('.test.js')).map((name) => `test/${name}`);
const CLI_TEST_FILES = TEST_FILES.filter((file) => /cli\.js|runCli/.test(readFileSync(join(ROOT, file), 'utf8')));

const summary = (output) => output.split('\n').filter((line) => /^# (tests|pass|fail) /.test(line)).join(' ; ');

const hasFlag = (flag) => (line) => line.includes(`'${flag}'`);
const hasFormat = (format) => (line) => hasFlag('--format')(line) && line.includes(format);
const PDF_TEST_TITLE = /test\(\s*'[^']*\bPDF\b/;
/** @type {[string, (line: string) => boolean][]} */
const CLI_OPTIONS = [
  ['--format csv', hasFormat('csv')],
  ['--format json', hasFormat('json')],
  ['--format html', hasFormat('html')],
  ['--format sarif', hasFormat('sarif')],
  ['--format pdf (défaut)', (line) => PDF_TEST_TITLE.test(line)],
  ['--concurrency', hasFlag('--concurrency')],
  ['--viewport', hasFlag('--viewport')],
  ['--crawl', hasFlag('--crawl')],
  ['--ci', hasFlag('--ci')],
];

async function npmTestCheck() {
  const { status, output } = await run('npm', ['test']);
  return result('npm-test', 'npm test', statusOf(status === 0), `exit ${status} ; ${summary(output)}`, output);
}

async function coverageCheck() {
  const { status, output } = await run('node', ['--test', '--experimental-test-coverage', ...TEST_FILES]);
  const line = output.split('\n').find((text) => text.includes('all files')) ?? '';
  const percent = Number(line.split('|')[1]);
  const ok = status === 0 && percent >= COVERAGE_MIN;
  return result('coverage', `Couverture globale >= ${COVERAGE_MIN} %`, statusOf(ok), `ligne ${percent} %`, line);
}

async function rulesCheck() {
  const { status, output } = await run('node', ['--test', 'test/rules-complete.test.js']);
  const installed = axe.getRules().length;
  const ok = status === 0 && installed >= AXE_RULE_COUNT;
  return result('rules', `Règles : complétude ${AXE_RULE_COUNT}/${AXE_RULE_COUNT}`, statusOf(ok), `${installed} règles axe-core installées ; ${summary(output)}`, output);
}

async function optionalScriptCheck(id, script) {
  const name = `npm run ${script}`;
  if (!PACKAGE.scripts?.[script]) return result(id, name, 'SKIP', `script "${script}" absent de package.json`);
  const { status, output } = await run('npm', ['run', script]);
  return result(id, name, statusOf(status === 0), `exit ${status}`, output);
}

function cliOptionCheck() {
  const lines = CLI_TEST_FILES.flatMap((file) =>
    readFileSync(join(ROOT, file), 'utf8').split('\n').map((text, index) => ({ location: `${file}:${index + 1}`, text })));
  const found = CLI_OPTIONS.map(([name, matches]) => ({ name, hit: lines.find(({ text }) => matches(text)) }));
  const missing = found.filter(({ hit }) => !hit).map(({ name }) => name);
  const evidence = found.filter(({ hit }) => hit).map(({ name, hit }) => `${name} -> ${hit?.location}`);
  return result(
    'cli-options',
    "Options CLI couvertes par un test d'intégration",
    statusOf(missing.length === 0),
    missing.length ? `absentes : ${missing.join(', ')}` : `${evidence.length} options couvertes`,
    evidence.join('\n'),
  );
}

export async function testChecks() {
  const npmTest = await npmTestCheck();
  const coverage = await coverageCheck();
  const rules = await rulesCheck();
  const lint = await optionalScriptCheck('lint', 'lint');
  const typecheck = await optionalScriptCheck('typecheck', 'typecheck');
  return [npmTest, coverage, rules, lint, typecheck, cliOptionCheck()];
}
