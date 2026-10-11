import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCliArgs, loadBranding } from '../src/cli.js';

describe('parseCliArgs', () => {
  test('lit les URLs et les options', () => {
    const { urls, options } = parseCliArgs([
      'https://example.com',
      'http://example.org/page',
      '--client', 'Acme',
      '--agency', 'Agence',
      '--color', '#112233',
    ]);
    assert.deepEqual(urls, ['https://example.com/', 'http://example.org/page']);
    assert.equal(options.client, 'Acme');
    assert.equal(options.agency, 'Agence');
    assert.equal(options.color, '#112233');
    assert.equal(options.out, 'rapport.pdf');
  });

  test('accepte --from-json sans URL', () => {
    const { urls, options } = parseCliArgs(['--from-json', 'scan.json']);
    assert.deepEqual(urls, []);
    assert.equal(options['from-json'], 'scan.json');
  });

  test('rejette une URL sans protocole http(s)', () => {
    assert.throws(() => parseCliArgs(['ftp://example.com']), /http ou https attendu/);
  });

  test('rejette une URL malformée', () => {
    assert.throws(() => parseCliArgs(['pas une url']), /URL invalide : pas une url/);
  });

  test('rejette une option inconnue', () => {
    assert.throws(() => parseCliArgs(['https://example.com', '--inconnue']), /Arguments invalides/);
  });
});

describe('loadBranding', () => {
  let dir;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'a11y-cli-'));
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('construit le branding depuis les options', () => {
    const branding = loadBranding({
      agency: 'Agence',
      client: 'Acme',
      logo: 'logo.png',
      color: '#aabbcc',
      contact: 'contact@agence.fr',
    });
    assert.deepEqual(branding, {
      agency: 'Agence',
      client: 'Acme',
      logoPath: 'logo.png',
      primaryColor: '#aabbcc',
      contact: 'contact@agence.fr',
    });
  });

  test('les options l\'emportent sur le fichier --branding', () => {
    const file = join(dir, 'branding.json');
    writeFileSync(file, JSON.stringify({ agency: 'Fichier', client: 'Client fichier', accentColor: '#000000' }));
    const branding = loadBranding({ branding: file, agency: 'Flag' });
    assert.equal(branding.agency, 'Flag');
    assert.equal(branding.client, 'Client fichier');
    assert.equal(branding.accentColor, '#000000');
  });

  test('exige agency et client', () => {
    assert.throws(() => loadBranding({ client: 'Acme' }), /--agency est requis/);
    assert.throws(() => loadBranding({ agency: 'Agence' }), /--client est requis/);
  });

  test('rejette une couleur qui n\'est pas #rrggbb', () => {
    assert.throws(
      () => loadBranding({ agency: 'Agence', client: 'Acme', color: 'rouge' }),
      /Couleur invalide/,
    );
  });

  test('signale un fichier --branding illisible', () => {
    const file = join(dir, 'absent.json');
    assert.throws(
      () => loadBranding({ branding: file, agency: 'Agence', client: 'Acme' }),
      /Fichier JSON illisible ou invalide/,
    );
  });
});
