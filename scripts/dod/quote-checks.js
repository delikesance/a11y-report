import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { startFixtureServer } from '../../test/fixtures/server.js';
import { scanPages } from '../../src/scan.js';
import { buildReportHtml, renderPdf } from '../../src/report.js';
import { collectProblems } from '../../src/report/model.js';
import { computeQuote } from '../../src/report/quote-calc.js';
import { verapdfAvailable, verifyPdfs } from '../verify-pdf.js';
import { OUT_DIR, ROOT, result, statusOf } from './lib.js';

const FIXTURES_DIR = join(ROOT, 'test', 'fixtures');
const TOLERANCE_EUROS = 0.01;
const BRANDINGS = [
  { agency: 'Studio Alpha', client: 'Client A', primaryColor: '#1d4ed8', tjm: 550 },
  { agency: 'Studio Beta', client: 'Client B', primaryColor: '#0f766e', tjm: 80, tva: 0.1 },
  { agency: 'Studio Gamma', client: 'Client C', tjm: 60, marge: 0.2, minimumPhase: 200 },
];

const htmlFixtures = (dir) =>
  readdirSync(join(FIXTURES_DIR, dir)).filter((name) => name.endsWith('.html')).map((name) => `${dir}/${name}`);

const CORPORA = {
  faulty: htmlFixtures('faulty'),
  healthy: htmlFixtures('healthy'),
};
CORPORA.mixed = [...CORPORA.faulty, ...CORPORA.healthy];

export function quoteDefects(quote) {
  const defects = quote.phases
    .filter((phase) => phase.problemCount > 0 && !(phase.price > 0))
    .map((phase) => `${phase.key} : prix ${phase.price}`);
  if (quote.totalPrice === null) return defects;
  if (Math.abs(quote.totalPrice + quote.tva - quote.ttc) > TOLERANCE_EUROS) defects.push('HT + TVA != TTC');
  if (Math.abs(quote.tva - quote.totalPrice * quote.rates.tva) > TOLERANCE_EUROS) defects.push(`TVA != ${quote.rates.tva} x HT`);
  return defects;
}

const summarise = (label, quote) =>
  `${label} : HT ${quote.totalPrice} TVA ${quote.tva} TTC ${quote.ttc} (taux ${quote.rates.tva})`;

async function scanCorpora(baseUrl) {
  const entries = await Promise.all(
    Object.entries(CORPORA).map(async ([name, paths]) => [name, await scanPages(paths.map((path) => `${baseUrl}/${path}`))]),
  );
  return Object.fromEntries(entries);
}

function quoteCheck(scans) {
  const quotes = Object.entries(scans).flatMap(([corpus, scan]) => {
    const problems = collectProblems(scan);
    return BRANDINGS.map((branding, index) => ({
      label: `${corpus}/marque${index + 1}`,
      quote: computeQuote(problems, branding),
    }));
  });
  const defects = quotes.flatMap(({ label, quote }) => quoteDefects(quote).map((defect) => `${label} : ${defect}`));
  const evidence = quotes.map(({ label, quote }) => summarise(label, quote)).join('\n');
  return result(
    'quotes',
    'Devis : aucune phase à 0 EUR, HT + TVA = TTC, TVA conforme',
    statusOf(defects.length === 0),
    `${quotes.length} devis, ${defects.length} défaut(s)`,
    defects.length ? defects.join('\n') : evidence,
  );
}

async function pdfCheck(scans) {
  if (!verapdfAvailable()) return result('pdf-ua', 'veraPDF PDF/UA-1 sur 3 rapports', 'FAIL', 'docker absent ou inaccessible');
  const paths = [];
  for (const [name, scan] of Object.entries(scans)) {
    const path = join(OUT_DIR, `dod-report-${name}.pdf`);
    await renderPdf(buildReportHtml(scan, BRANDINGS[0]), path);
    paths.push(path);
  }
  const { status, output } = verifyPdfs(paths);
  return result('pdf-ua', 'veraPDF PDF/UA-1 sur 3 rapports', statusOf(status === 0), `exit ${status} sur ${paths.length} PDF`, output);
}

export async function quoteChecks() {
  const server = await startFixtureServer();
  try {
    const scans = await scanCorpora(server.url);
    return [quoteCheck(scans), await pdfCheck(scans)];
  } finally {
    await server.close();
  }
}
