import { escapeHtml, LIMITS_PARAGRAPHS } from './shared.js';
import { EXCLUSIONS, formatNumber, hypothesesFor } from './quote-text.js';

const DEFAULT_QUOTE_VALIDITY_DAYS = 30;
const TITLES_PER_PHASE = 3;
const EMPTY_VALUE = '—';
const EMPTY_PHASE_TEXT = 'Aucun problème';
const PHASE_SEVERITY = {
  bloquants: { impacts: ['critical'], severity: ['critique', 'critiques'] },
  genants: { impacts: ['serious'], severity: ['majeur', 'majeurs'] },
  finitions: { impacts: ['moderate', 'minor'], severity: ['modéré ou mineur', 'modérés ou mineurs'] },
};
const DELIVERABLES = [
  'Corrections appliquées et testées',
  'Nouveau rapport avec le score final',
  "Aide pour votre déclaration d'accessibilité",
];

const formatHours = (hours) => `${formatNumber(hours)} h`;
const formatPrice = (price, suffix = '') => (price == null ? EMPTY_VALUE : `${formatNumber(price)} €${suffix}`);
const pick = (count, [singular, plural]) => (count === 1 ? singular : plural);

function phaseTitles(phase, problems) {
  const { impacts } = PHASE_SEVERITY[phase.key];
  return problems
    .filter((problem) => impacts.includes(problem.impact))
    .slice(0, TITLES_PER_PHASE)
    .map((problem) => problem.rule.titre);
}

function phaseDescription(phase, problems) {
  if (phase.problemCount === 0) return EMPTY_PHASE_TEXT;
  const noun = pick(phase.problemCount, ['problème', 'problèmes']);
  const severity = pick(phase.problemCount, PHASE_SEVERITY[phase.key].severity);
  return `${phase.problemCount} ${noun} ${severity} : ${phaseTitles(phase, problems).join(', ')}`;
}

function renderCell(label, value, modifier) {
  return `<div class="qt-cell qt-cell--${modifier}"><span class="qt-cell__label">${label}</span><strong class="qt-cell__value">${escapeHtml(value)}</strong></div>`;
}

function renderPhase(phase, index, problems) {
  const emptyClass = phase.problemCount === 0 ? ' qt-phase--empty' : '';
  return `<li class="qt-phase qt-phase--${phase.key}${emptyClass}">
  <span class="qt-phase__num">${index + 1}</span>
  <div class="qt-phase__body">
    <h3 class="qt-phase__label">${escapeHtml(phase.label)}</h3>
    <p class="qt-phase__desc">${escapeHtml(phaseDescription(phase, problems))}</p>
  </div>
  ${renderCell('Durée', formatHours(phase.hours), 'duration')}
  ${renderCell('Prix HT', formatPrice(phase.price), 'price')}
</li>`;
}

function renderTop(branding) {
  return `<header class="qt-top"><span>${escapeHtml(branding.agency)} · Audit d'accessibilité</span><span>Plan d'action et devis</span></header>`;
}

function renderTotal(quote) {
  return `<div class="qt-total"><span class="qt-total__label">Total des trois étapes</span><span class="qt-total__value">${formatPrice(quote.totalPrice, ' HT')}</span><span class="qt-total__value">TVA ${formatPrice(quote.tva)} · ${formatPrice(quote.ttc, ' TTC')}</span><span class="qt-total__range">Fourchette ${formatPrice(quote.totalLow)} à ${formatPrice(quote.totalHigh)} HT</span></div>`;
}

function renderHypotheses(quote) {
  return `<div class="qt-hypotheses"><h3 class="qt-column__title">Hypothèses</h3>${renderList(hypothesesFor(quote))}<h3 class="qt-column__title">Exclusions</h3>${renderList(EXCLUSIONS)}</div>`;
}

function renderList(items) {
  return `<ul class="qt-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderColumns() {
  return `<div class="qt-columns">
  <div class="qt-column"><h3 class="qt-column__title">Ce que vous recevez</h3>${renderList(DELIVERABLES)}</div>
  <div class="qt-column"><h3 class="qt-column__title">Ce que cet audit ne couvre pas</h3>${renderList(LIMITS_PARAGRAPHS)}</div>
</div>`;
}

function renderContact(branding, validityDays) {
  const lines = [branding.contact, branding.phone].filter(Boolean).map(escapeHtml).join('<br>');
  return `<div class="qt-contact">
  <div><div class="qt-contact__title">Prêt à corriger ?</div><div class="qt-contact__text">Devis valable ${validityDays} jours. Réponse par retour de mail.</div></div>
  <div class="qt-contact__details">${lines}</div>
</div>`;
}

export function renderQuote(quote, problems, branding) {
  const validityDays = branding.quoteValidityDays ?? DEFAULT_QUOTE_VALIDITY_DAYS;
  return `<section class="page quote qt-page">
${renderTop(branding)}
<h2 class="qt-title">Corriger l'essentiel en trois étapes.</h2>
<p class="qt-intro">Nous commençons par ce qui bloque des utilisateurs, puis nous traitons le reste. Chaque étape est livrée et vérifiée séparément.</p>
<ol class="qt-phases">${quote.phases.map((phase, index) => renderPhase(phase, index, problems)).join('')}</ol>
${renderTotal(quote)}
${renderHypotheses(quote)}
${renderColumns()}
<div class="qt-spacer"></div>
${renderContact(branding, validityDays)}
</section>`;
}
