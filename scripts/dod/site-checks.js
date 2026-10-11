import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { startFixtureServer } from '../../test/fixtures/server.js';
import { OUT_DIR, ROOT, result, run, statusOf } from './lib.js';

const SITE_DIR = join(ROOT, 'site');
const SITE_AUDIT_PATH = join(OUT_DIR, 'dod-site-audit.json');
const SITE_AUDIT_ARGS = ['--crawl', '--crawl-depth', '10', '--max-pages', '200', '--delay', '0', '--format', 'json', '--client', 'Audit DoD', '--agency', 'a11y-reports'];
const PRESENCE_PATHS = ['docs/marche.md', 'docs/sources.md', 'prospects', 'outreach', 'docs/prospection-rgpd.md'];
const BLOCKERS_PATH = join(ROOT, 'BLOCKERS.md');

async function scriptGate(id, name, script) {
  const { status, output } = await run('node', [script]);
  return result(id, name, statusOf(status === 0), `exit ${status}`, output);
}

async function layoutLintCheck() {
  const { status, output } = await run('node', ['scripts/layout-lint.js']);
  const clean = output.trim() === '[]';
  return result('lint-layout', 'npm run lint:layout sans défaut', statusOf(status === 0 && clean), `exit ${status}, ${clean ? 'aucun défaut' : 'défauts signalés'}`, output);
}

async function siteAuditCheck() {
  const server = await startFixtureServer({ root: SITE_DIR });
  try {
    const { status, output } = await run('node', ['src/cli.js', `${server.url}/`, ...SITE_AUDIT_ARGS, '--out', SITE_AUDIT_PATH]);
    const scan = JSON.parse(readFileSync(SITE_AUDIT_PATH, 'utf8'));
    const violations = scan.pages.flatMap((page) => page.violations ?? []).length;
    const ok = status === 0 && scan.pages.length > 0 && violations === 0;
    return result('site-audit', 'Audit CLI du site : 0 violation', statusOf(ok), `exit ${status}, ${scan.pages.length} pages, ${violations} violation(s)`, output);
  } catch (error) {
    return result('site-audit', 'Audit CLI du site : 0 violation', 'FAIL', `échec : ${error.message}`);
  } finally {
    await server.close();
  }
}

function presenceCheck() {
  const missing = PRESENCE_PATHS.filter((path) => !existsSync(join(ROOT, path)));
  const evidence = missing.length ? `absents : ${missing.join(', ')}` : `${PRESENCE_PATHS.length} chemins présents`;
  return result('presence', 'Documents marché, sources, prospection et RGPD présents', statusOf(missing.length === 0), evidence);
}

function blockersCheck() {
  if (!existsSync(BLOCKERS_PATH)) return result('blockers', 'BLOCKERS.md absent ou justifié', 'PASS', 'BLOCKERS.md absent');
  const text = readFileSync(BLOCKERS_PATH, 'utf8').trim();
  return result('blockers', 'BLOCKERS.md absent ou justifié', statusOf(text.length > 0), text ? 'BLOCKERS.md justifié' : 'BLOCKERS.md vide');
}

export async function siteChecks() {
  const [links, layout, lintLayout, audit] = await Promise.all([
    scriptGate('check-links', 'npm run check:links', 'scripts/check-links.js'),
    scriptGate('check-site-layout', 'npm run check:site-layout', 'scripts/check-site-layout.js'),
    layoutLintCheck(),
    siteAuditCheck(),
  ]);
  return [links, layout, lintLayout, audit, presenceCheck(), blockersCheck()];
}
