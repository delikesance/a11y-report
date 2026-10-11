import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServer } from './fixtures/server.js';
import { runCli, BRANDING_ARGS } from './support/run-cli.js';

const HEALTHY = '/healthy/home.html';
const FAULTY = '/faulty/img-no-alt.html';
const ALL_IMPACTS_OFF = 'critical=1000,serious=1000,moderate=1000,minor=1000';

describe('a11y-report (CLI, serveur de fixtures)', () => {
  let server;
  let dir;
  let scanPath;

  before(async () => {
    server = await startFixtureServer();
    dir = mkdtempSync(join(tmpdir(), 'a11y-run-'));
    scanPath = join(dir, 'scan.json');
    const saved = await runCli([`${server.url}${FAULTY}`, `${server.url}${HEALTHY}`, '--format', 'json', '--save-json', scanPath, ...BRANDING_ARGS], { cwd: dir });
    assert.equal(saved.code, 0, saved.stderr);
  });

  after(async () => {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const workDir = () => mkdtempSync(join(dir, 'w-'));
  const readJsonFile = (path) => JSON.parse(readFileSync(path, 'utf8'));

  describe('aide et erreurs d\'usage', () => {
    test('--help affiche l\'aide française et des exemples, code 0', async () => {
      const { code, stdout } = await runCli(['--help']);
      assert.equal(code, 0);
      assert.match(stdout, /Exemples :/);
      assert.match(stdout, /Codes de retour :/);
      assert.match(stdout, /--ci-format github\|text/);
    });

    test('--concurrency invalide donne un message actionnable et le code 1', async () => {
      const { code, stderr } = await runCli([`${server.url}${HEALTHY}`, '--concurrency', 'abc', ...BRANDING_ARGS]);
      assert.equal(code, 1);
      assert.match(stderr, /Erreur : --concurrency doit être un entier entre 1 et 16 \(reçu : abc\)\. Exemple : --concurrency 4/);
    });

    test('--format inconnu est refusé avant tout audit', async () => {
      const { code, stderr } = await runCli([`${server.url}${HEALTHY}`, '--format', 'docx', ...BRANDING_ARGS]);
      assert.equal(code, 1);
      assert.match(stderr, /Format inconnu : docx/);
    });

    test('aucune URL ni --from-json : aide et code 1', async () => {
      const { code, stderr } = await runCli([...BRANDING_ARGS]);
      assert.equal(code, 1);
      assert.match(stderr, /aucune URL fournie/);
    });
  });

  describe('--format et --out', () => {
    test('par défaut, produit un PDF rapport.pdf', async () => {
      const cwd = workDir();
      const { code, stderr } = await runCli([`${server.url}${HEALTHY}`, ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0, stderr);
      assert.equal(readFileSync(join(cwd, 'rapport.pdf')).subarray(0, 4).toString(), '%PDF');
    });

    test('--format json écrit un scan JSON avec la page auditée', async () => {
      const cwd = workDir();
      const { code } = await runCli([`${server.url}${HEALTHY}`, '--format', 'json', ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0);
      assert.equal(readJsonFile(join(cwd, 'rapport.json')).pages.length, 1);
    });

    test('--format répété : un fichier par format dans le dossier --out', async () => {
      const cwd = workDir();
      const outDir = join(cwd, 'rapports');
      const { code, stderr } = await runCli([`${server.url}${HEALTHY}`, '--format', 'json,csv', '--format', 'sarif', '--out', outDir, ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0, stderr);
      assert.deepEqual(readdirSync(outDir).sort(), ['rapport.csv', 'rapport.json', 'rapport.sarif']);
    });

    test('--format html avec --out fichier explicite', async () => {
      const cwd = workDir();
      const { code } = await runCli([`${server.url}${HEALTHY}`, '--format', 'html', '--out', 'bilan.html', ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0);
      assert.match(readFileSync(join(cwd, 'bilan.html'), 'utf8'), /<html/i);
    });

    test('plusieurs formats vers un --out qui ressemble à un fichier : dossier créé', async () => {
      const cwd = workDir();
      const { code } = await runCli([`${server.url}${HEALTHY}`, '--format', 'json,csv', '--out', 'bilan.pdf', ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0);
      assert.match(readFileSync(join(cwd, 'bilan.pdf', 'rapport.json'), 'utf8'), /"pages"/);
    });

    test('--out dans un dossier parent inexistant : erreur avant le scan', async () => {
      const cwd = workDir();
      const { code, stderr } = await runCli([`${server.url}${HEALTHY}`, '--out', 'absent/rapport.json', ...BRANDING_ARGS], { cwd });
      assert.equal(code, 1);
      assert.match(stderr, /Dossier de sortie introuvable/);
    });
  });

  describe('--viewport', () => {
    test('chaque viewport produit une passe d\'audit', async () => {
      const cwd = workDir();
      const { code, stderr } = await runCli([`${server.url}${HEALTHY}`, '--viewport', 'mobile', '--viewport', '800x600', '--format', 'json', ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0, stderr);
      const names = readJsonFile(join(cwd, 'rapport.json')).pages.map((page) => page.viewport);
      assert.deepEqual(names.sort(), ['800x600', 'mobile']);
    });

    test('viewport invalide refusé', async () => {
      const { code, stderr } = await runCli([`${server.url}${HEALTHY}`, '--viewport', '0x0', ...BRANDING_ARGS]);
      assert.equal(code, 1);
      assert.match(stderr, /Viewport invalide « 0x0 »/);
    });
  });

  describe('--concurrency', () => {
    test('--concurrency 4 audite plusieurs pages et conserve toutes les pages', async () => {
      const cwd = workDir();
      const urls = [HEALTHY, FAULTY, '/healthy/form.html', '/healthy/article.html'].map((path) => `${server.url}${path}`);
      const { code, stderr } = await runCli([...urls, '--concurrency', '4', '--format', 'json', ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0, stderr);
      assert.equal(readJsonFile(join(cwd, 'rapport.json')).pages.length, 4);
    });
  });

  describe('--crawl', () => {
    test('--crawl-depth 0 ne retient que la page de départ', async () => {
      const cwd = workDir();
      const { code, stderr } = await runCli([`${server.url}${HEALTHY}`, '--crawl', '--crawl-depth', '0', '--no-sitemap', '--format', 'json', ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0, stderr);
      assert.match(stderr, /Exploration : 1 page\(s\) découverte\(s\)/);
      assert.equal(readJsonFile(join(cwd, 'rapport.json')).pages.length, 1);
    });

    test('--max-pages borne le nombre de pages découvertes', async () => {
      const cwd = workDir();
      const { code } = await runCli([server.url, '--crawl', '--max-pages', '2', '--format', 'json', ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0);
      assert.equal(readJsonFile(join(cwd, 'rapport.json')).pages.length, 2);
    });

    test('--exclude écarte les URLs correspondant au motif', async () => {
      const cwd = workDir();
      const args = [server.url, '--crawl', '--crawl-depth', '0', '--exclude', '*/faulty/*', '--delay', '0', '--format', 'json', ...BRANDING_ARGS];
      const { code } = await runCli(args, { cwd });
      assert.equal(code, 0);
      const urls = readJsonFile(join(cwd, 'rapport.json')).pages.map((page) => page.url);
      assert.ok(urls.length > 0);
      assert.ok(urls.every((url) => !url.includes('/faulty/')));
    });

    test('--crawl-depth non numérique refusé', async () => {
      const { code, stderr } = await runCli([server.url, '--crawl', '--crawl-depth', 'deux', ...BRANDING_ARGS]);
      assert.equal(code, 1);
      assert.match(stderr, /--crawl-depth doit être un entier entre 0 et 10/);
    });
  });

  describe('--ci', () => {
    test('seuils dépassés : code 2 et sortie réduite sur stdout', async () => {
      const { code, stdout, stderr } = await runCli(['--from-json', scanPath, '--ci', '--seuil', 'critical=0', ...BRANDING_ARGS]);
      assert.equal(code, 2);
      assert.match(stdout, /Seuils CI non respectés/);
      assert.equal(stderr, '');
    });

    test('seuils respectés : code 0', async () => {
      const { code, stdout } = await runCli(['--from-json', scanPath, '--ci', '--seuil', ALL_IMPACTS_OFF, ...BRANDING_ARGS]);
      assert.equal(code, 0);
      assert.match(stdout, /Seuils CI respectés/);
    });

    test('--ci-format github produit des annotations ::error', async () => {
      const { code, stdout } = await runCli(['--from-json', scanPath, '--ci', '--ci-format', 'github', ...BRANDING_ARGS]);
      assert.equal(code, 2);
      assert.match(stdout, /^::error title=Accessibilité::/m);
    });

    test('--seuils-fichier lit les seuils JSON', async () => {
      const seuils = join(dir, 'seuils-ok.json');
      writeFileSync(seuils, JSON.stringify({ critical: 1000, serious: 1000, moderate: 1000, minor: 1000 }));
      const { code } = await runCli(['--from-json', scanPath, '--ci', '--seuils-fichier', seuils, ...BRANDING_ARGS]);
      assert.equal(code, 0);
    });

    test('clé de seuil inconnue : code 1 avec message', async () => {
      const { code, stderr } = await runCli(['--from-json', scanPath, '--ci', '--seuil', 'bogus=1', ...BRANDING_ARGS]);
      assert.equal(code, 1);
      assert.match(stderr, /Seuil inconnu : bogus/);
    });

    test('--ci écrit quand même les rapports demandés', async () => {
      const cwd = workDir();
      const out = join(cwd, 'ci.json');
      const { code } = await runCli(['--from-json', scanPath, '--ci', '--seuil', ALL_IMPACTS_OFF, '--format', 'json', '--out', out, ...BRANDING_ARGS], { cwd });
      assert.equal(code, 0);
      assert.equal(existsSync(out), true);
    });
  });
});
