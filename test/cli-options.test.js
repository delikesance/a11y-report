import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseCliArgs } from '../src/cli.js';
import { outputPathFor } from '../src/cli/outputs.js';
import { DEFAULT_VIEWPORT } from '../src/viewport.js';

const URL_ARG = 'https://example.com';

describe('parseCliArgs : formats et sorties', () => {
  test('format par défaut : pdf', () => {
    assert.deepEqual(parseCliArgs([URL_ARG]).settings.formats, ['pdf']);
  });

  test('accepte --format répété et séparé par des virgules, sans doublon', () => {
    const { settings } = parseCliArgs([URL_ARG, '--format', 'json,html', '--format', 'html,csv']);
    assert.deepEqual(settings.formats, ['json', 'html', 'csv']);
  });

  test('rejette un format inconnu avec un exemple', () => {
    assert.throws(() => parseCliArgs([URL_ARG, '--format', 'docx']), /Format inconnu : docx .* Exemple : --format json/);
  });
});

describe('parseCliArgs : audit', () => {
  test('concurrence par défaut : 1', () => {
    assert.equal(parseCliArgs([URL_ARG]).settings.concurrency, 1);
  });

  test('accepte une concurrence entre 1 et 16', () => {
    assert.equal(parseCliArgs([URL_ARG, '--concurrency', '16']).settings.concurrency, 16);
  });

  test('rejette une concurrence hors bornes avec un message actionnable', () => {
    assert.throws(
      () => parseCliArgs([URL_ARG, '--concurrency', '17']),
      /--concurrency doit être un entier entre 1 et 16 \(reçu : 17\)\. Exemple : --concurrency 4/,
    );
  });

  test('rejette une concurrence non entière', () => {
    assert.throws(() => parseCliArgs([URL_ARG, '--concurrency', 'abc']), /reçu : abc/);
  });

  test('viewport par défaut : desktop', () => {
    assert.deepEqual(parseCliArgs([URL_ARG]).settings.viewports, [DEFAULT_VIEWPORT]);
  });

  test('accepte plusieurs viewports, préréglages ou LxH', () => {
    const names = parseCliArgs([URL_ARG, '--viewport', 'mobile,800x600', '--viewport', 'tablet']).settings.viewports.map((v) => v.name);
    assert.deepEqual(names, ['mobile', '800x600', 'tablet']);
  });

  test('rejette un viewport invalide', () => {
    assert.throws(() => parseCliArgs([URL_ARG, '--viewport', 'géant']), /Viewport invalide « géant »/);
  });
});

describe('parseCliArgs : crawl', () => {
  test('pas de crawl par défaut', () => {
    assert.equal(parseCliArgs([URL_ARG]).settings.crawl, null);
  });

  test('traduit les options de crawl en réglages', () => {
    const { settings } = parseCliArgs([
      URL_ARG, '--crawl', '--crawl-depth', '1', '--max-pages', '20', '--no-sitemap',
      '--exclude', '*/admin/*,*/tmp/*', '--exclude', '*.pdf', '--delay', '0',
    ]);
    assert.deepEqual(settings.crawl, {
      depth: 1,
      maxPages: 20,
      sitemap: false,
      exclude: ['*/admin/*', '*/tmp/*', '*.pdf'],
      delayMs: 0,
    });
  });

  test('le sitemap est lu par défaut et --sitemap ne retire rien', () => {
    assert.equal(parseCliArgs([URL_ARG, '--crawl', '--sitemap']).settings.crawl?.sitemap, true);
    const { crawl } = parseCliArgs([URL_ARG, '--crawl']).settings;
    assert.ok(crawl);
    assert.equal(crawl.sitemap, undefined);
  });

  test('refuse une option de crawl sans --crawl', () => {
    assert.throws(() => parseCliArgs([URL_ARG, '--max-pages', '5']), /--max-pages nécessite --crawl\./);
  });

  test('rejette une profondeur hors bornes', () => {
    assert.throws(() => parseCliArgs([URL_ARG, '--crawl', '--crawl-depth', '11']), /--crawl-depth doit être un entier entre 0 et 10/);
  });

  test('ne propose pas --ignore-robots', () => {
    assert.throws(() => parseCliArgs([URL_ARG, '--ignore-robots']), /Arguments invalides/);
  });
});

describe('parseCliArgs : CI', () => {
  test('pas de mode CI par défaut', () => {
    assert.equal(parseCliArgs([URL_ARG]).settings.ci, null);
  });

  test('traduit --seuil en seuils normalisés et format text par défaut', () => {
    const { settings } = parseCliArgs([URL_ARG, '--ci', '--seuil', 'critical=0,serious=2,score=60']);
    assert.deepEqual(settings.ci, {
      thresholds: { maxCritical: 0, maxSerious: 2, minScore: 60 },
      format: 'text',
    });
  });

  test('--seuil l\'emporte sur --seuils-fichier', () => {
    const { settings } = parseCliArgs([URL_ARG, '--ci', '--seuils-fichier', seuilsFile(), '--seuil', 'critical=5']);
    assert.equal(settings.ci?.thresholds.maxCritical, 5);
    assert.equal(settings.ci?.thresholds.maxSerious, 1);
  });

  test('rejette un format CI inconnu', () => {
    assert.throws(() => parseCliArgs([URL_ARG, '--ci', '--ci-format', 'xml']), /Format CI inconnu : xml/);
  });

  test('refuse --ci-format sans --ci', () => {
    assert.throws(() => parseCliArgs([URL_ARG, '--ci-format', 'github']), /--ci-format nécessite --ci\./);
  });
});

describe('outputPathFor', () => {
  test('nom par défaut dans le répertoire courant', () => {
    assert.equal(outputPathFor('json', { out: undefined, formats: ['json'] }), 'rapport.json');
  });

  test('un fichier explicite est utilisé tel quel pour un seul format', () => {
    assert.equal(outputPathFor('html', { out: 'bilan.html', formats: ['html'] }), 'bilan.html');
  });
});

function seuilsFile() {
  return new URL('./fixtures/seuils.json', import.meta.url).pathname;
}
