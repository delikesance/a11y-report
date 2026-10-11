import { escapeHtml, renderLogo } from './shared.js';

const MONOGRAM_LETTERS = 2;

const monogram = (agency) =>
  agency
    .split(/\s+/)
    .slice(0, MONOGRAM_LETTERS)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

const renderBrand = (branding) =>
  branding.logoPath
    ? renderLogo(branding.logoPath, branding.agency)
    : `<div class="cv-monogram">${escapeHtml(monogram(branding.agency))}</div>`;

const orDash = (value) => escapeHtml(value || '—');

export function renderCover(scan, branding, date, problems, score) {
  const criticalCount = problems.filter((problem) => problem.impact === 'critical').length;
  return `<section class="page cv-cover">
  <div class="cv-bar"></div>
  <div class="cv-content">
    <div class="cv-brand">${renderBrand(branding)}<div class="cv-agency">${escapeHtml(branding.agency)}</div></div>
    <div class="cv-eyebrow">Audit d'accessibilité numérique</div>
    <h1 class="cv-title">Votre site est-il accessible à tous vos clients ?</h1>
    <p class="cv-lead">Constat chiffré sur ${escapeHtml(scan.pages.length)} pages, problèmes classés par gravité, corrections prêtes à appliquer et devis.</p>
    <div class="cv-score-card">
      <div class="cv-score">${escapeHtml(score)}<span class="cv-score-max">/100</span></div>
      <div class="cv-score-text"><strong>${escapeHtml(problems.length)} problèmes</strong> à corriger, dont <strong>${escapeHtml(criticalCount)} critiques</strong> qui bloquent des utilisateurs aujourd'hui.</div>
    </div>
    <div class="cv-spacer"></div>
    <div class="cv-meta">
      <div><div class="cv-meta-label">Préparé pour</div>${orDash(branding.client)}</div>
      <div><div class="cv-meta-label">Date</div>${orDash(date)}</div>
      <div><div class="cv-meta-label">Contact</div>${orDash(branding.contact)}</div>
    </div>
  </div>
</section>`;
}
