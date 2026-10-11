import { collectProblems } from '../report/model.js';
import { escapeHtml } from '../report/shared.js';
import { REPORT_CSS } from './html-style.js';
import { renderTokenCss } from './html-tokens.js';
import { renderIntro, renderSummary, renderPages, renderUnaudited } from './html-overview.js';
import { renderProblems, renderIncomplete, renderQuote } from './html-findings.js';

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export function render(scan, { branding = /** @type {Record<string, any>} */ ({}) } = {}) {
  const context = {
    scan,
    branding,
    problems: collectProblems(scan),
    date: branding.date ?? DATE_FORMAT.format(new Date(scan.generatedAt)),
  };
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(`Rapport d'accessibilité - ${branding.client ?? ''}`)}</title>
<style>${renderTokenCss(branding)}
${REPORT_CSS}</style>
</head>
<body>
<a class="skip-link" href="#contenu">Aller au contenu</a>
${renderIntro(context)}
<main id="contenu">
${renderSummary(context)}
${renderPages(context)}
${renderUnaudited(context)}
${renderProblems(context)}
${renderIncomplete(context)}
${renderQuote(context)}
</main>
<footer><p class="muted">Audit automatisé : ce rapport ne remplace pas un test manuel complet.</p></footer>
</body>
</html>
`;
}
