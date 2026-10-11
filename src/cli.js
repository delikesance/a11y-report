#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OPTIONS = {
  client: { type: 'string' },
  agency: { type: 'string' },
  logo: { type: 'string' },
  color: { type: 'string' },
  contact: { type: 'string' },
  out: { type: 'string', default: 'rapport.pdf' },
  branding: { type: 'string' },
  'from-json': { type: 'string' },
  'save-json': { type: 'string' },
  help: { type: 'boolean', short: 'h' },
};

const USAGE = `Usage : a11y-report <url...> --client "X" --agency "Y" [options]
       a11y-report --from-json scan.json --client "X" --agency "Y" [options]

Options :
  --client "X"        nom du client (requis sauf via --branding)
  --agency "Y"        nom de l'agence (requis sauf via --branding)
  --logo f.png        logo de l'agence
  --color #rrggbb     couleur principale du rapport
  --contact "..."     coordonnées affichées dans le rapport
  --out rapport.pdf   fichier PDF généré (défaut : rapport.pdf)
  --branding b.json   charge le branding depuis un JSON (les options passées l'emportent)
  --from-json s.json  recharge un scan sauvegardé au lieu de scanner les URLs
  --save-json s.json  sauvegarde le scan au format JSON
  -h, --help          affiche cette aide
`;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const HTTP_PROTOCOLS = ['http:', 'https:'];

function parseHttpUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`URL invalide : ${raw}`);
  }
  if (!HTTP_PROTOCOLS.includes(url.protocol)) {
    throw new Error(`URL invalide (http ou https attendu) : ${raw}`);
  }
  return url.href;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`Fichier JSON illisible ou invalide : ${path}`);
  }
}

function definedEntries(entries) {
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined));
}

export function parseCliArgs(argv) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    throw new Error(`Arguments invalides (${error.message})`);
  }
  return { urls: parsed.positionals.map(parseHttpUrl), options: parsed.values };
}

export function loadBranding(options) {
  const fromFile = options.branding ? readJson(options.branding) : {};
  const fromFlags = definedEntries({
    agency: options.agency,
    client: options.client,
    logoPath: options.logo,
    primaryColor: options.color,
    contact: options.contact,
  });
  const branding = { ...fromFile, ...fromFlags };

  if (!branding.agency) throw new Error('--agency est requis (ou "agency" dans --branding).');
  if (!branding.client) throw new Error('--client est requis (ou "client" dans --branding).');
  if (branding.primaryColor !== undefined && !HEX_COLOR.test(branding.primaryColor)) {
    throw new Error(`Couleur invalide (format #rrggbb attendu) : ${branding.primaryColor}`);
  }
  return branding;
}

async function obtainScan(urls, options) {
  if (options['from-json']) return readJson(options['from-json']);
  process.stderr.write(`Analyse de ${urls.length} page(s)...\n`);
  const { scanPages } = await import('./scan.js');
  return scanPages(urls);
}

async function run(argv) {
  const { urls, options } = parseCliArgs(argv);
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (urls.length === 0 && !options['from-json']) {
    process.stderr.write(`Erreur : aucune URL fournie.\n\n${USAGE}`);
    return 1;
  }

  const branding = loadBranding(options);
  const scan = await obtainScan(urls, options);
  if (options['save-json']) writeFileSync(options['save-json'], JSON.stringify(scan, null, 2));

  // Chargés à la demande : l'aide et la validation fonctionnent sans navigateur.
  const { buildReportHtml, renderPdf } = await import('./report.js');
  process.stderr.write('Génération du rapport...\n');
  await renderPdf(buildReportHtml(scan, branding), options.out);
  process.stderr.write(`Rapport écrit : ${options.out}\n`);
  return 0;
}

async function main(argv) {
  try {
    return await run(argv);
  } catch (error) {
    process.stderr.write(`Erreur : ${error.message}\n`);
    return 1;
  }
}

const isEntrypoint = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) process.exitCode = await main(process.argv.slice(2));
