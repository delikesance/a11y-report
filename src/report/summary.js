import { IMPACT_FR, IMPACT_ORDER } from '../rules-fr.js';
import { computeImpactWeightedScore } from './model.js';
import { escapeHtml, TOP_PRIORITIES } from './shared.js';

const SEVERE_IMPACTS = ['critical', 'serious'];
const MAX_SCORE = 100;
const RING_SIZE = 170;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 72;
const RING_STROKE_WIDTH = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SCORE_BASELINE_OFFSET = 9;
const UNIT_BASELINE_OFFSET = 31;
const BAR_MAX_LENGTH = 160;

const countImpact = (problems, impact) => problems.filter((problem) => problem.impact === impact).length;

const renderScoreRing = (score) => {
  const filledLength = (score / MAX_SCORE) * RING_CIRCUMFERENCE;
  return `<svg class="sy-ring" width="${RING_SIZE}" height="${RING_SIZE}" viewBox="0 0 ${RING_SIZE} ${RING_SIZE}" role="img" aria-label="Score ${escapeHtml(score)} sur ${MAX_SCORE}">
  <circle class="sy-ring-track" cx="${RING_CENTER}" cy="${RING_CENTER}" r="${RING_RADIUS}" stroke-width="${RING_STROKE_WIDTH}"></circle>
  <circle class="sy-ring-value" cx="${RING_CENTER}" cy="${RING_CENTER}" r="${RING_RADIUS}" stroke-width="${RING_STROKE_WIDTH}" stroke-dasharray="${filledLength} ${RING_CIRCUMFERENCE}" transform="rotate(-90 ${RING_CENTER} ${RING_CENTER})"></circle>
  <text class="sy-ring-score" x="${RING_CENTER}" y="${RING_CENTER + SCORE_BASELINE_OFFSET}" text-anchor="middle">${escapeHtml(score)}</text>
  <text class="sy-ring-label" x="${RING_CENTER}" y="${RING_CENTER + UNIT_BASELINE_OFFSET}" text-anchor="middle">sur ${MAX_SCORE}</text>
</svg>`;
};

const renderSeverityBar = (problems, impact, maxCount) => {
  const count = countImpact(problems, impact);
  const length = Math.round((count / maxCount) * BAR_MAX_LENGTH);
  return `<div class="sy-bar-row"><span class="sy-bar-label">${escapeHtml(IMPACT_FR[impact])}</span><div class="sy-bar sy-${impact}" style="width: ${length}px"></div><strong>${count}</strong></div>`;
};

const renderSeverityBars = (problems) => {
  const maxCount = Math.max(1, ...IMPACT_ORDER.map((impact) => countImpact(problems, impact)));
  return IMPACT_ORDER.map((impact) => renderSeverityBar(problems, impact, maxCount)).join('');
};

const renderPriority = (problem, rank) => `<div class="sy-priority">
  <strong class="sy-rank">${rank}</strong>
  <span class="sy-priority-title">${escapeHtml(problem.rule.titre)}</span>
  <span class="sy-priority-impact ${problem.impact}">${escapeHtml(IMPACT_FR[problem.impact])}</span>
</div>`;

const renderKpi = (label, value) => `<div class="sy-kpi">
  <div class="sy-kpi-label">${escapeHtml(label)}</div>
  <div class="sy-kpi-value">${escapeHtml(value)}</div>
</div>`;

export function renderSummary(problems, score, quote, branding) {
  const remainingProblems = problems.filter((problem) => !SEVERE_IMPACTS.includes(problem.impact));
  const projectedScore = computeImpactWeightedScore(remainingProblems);
  const priorities = problems.slice(0, TOP_PRIORITIES);
  return `<section class="page sy-summary">
  <header class="sy-header"><span>${escapeHtml(branding.agency)} · Audit d'accessibilité</span><span>Synthèse</span></header>
  <h2 class="sy-title">Deux problèmes empêchent déjà des personnes d'utiliser votre site.</h2>
  <div class="sy-overview">
    ${renderScoreRing(score)}
    <div class="sy-bars">${renderSeverityBars(problems)}</div>
  </div>
  <div class="sy-callout"><strong>Pourquoi agir maintenant.</strong> L'European Accessibility Act s'applique depuis le 28 juin 2025 à de nombreux services en ligne. Au-delà du risque juridique, un site inaccessible perd des clients : les personnes concernées ne peuvent pas acheter, réserver ou vous contacter.</div>
  <h3 class="sy-section-title">Les ${TOP_PRIORITIES} priorités</h3>
  <div class="sy-priorities">${priorities.map((problem, index) => renderPriority(problem, index + 1)).join('')}</div>
  <div class="sy-kpis">
    ${renderKpi('Temps de correction estimé', `${quote.totalHours} heures`)}
    ${renderKpi('Score visé après corrections', `${projectedScore} / ${MAX_SCORE}`)}
  </div>
</section>`;
}
