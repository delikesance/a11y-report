import { readFileSync } from 'node:fs';
import { IMPACT_FR, IMPACT_ORDER } from '../rules-fr.js';
import { IMPACT_PENALTY } from './model.js';
import { computeRgaaEstimate } from './rgaa-estimate.js';
import { RGAA_CRITERIA_COUNT } from './rgaa-criteria.js';
import { escapeHtml } from './shared.js';

// Libellés génériques : le rapport ne cite aucune marque tierce (voir CONTRACT.md).
const TOOLS = [
  { label: "Moteur de règles d'accessibilité", pkg: 'axe-core' },
  { label: "Intégration du moteur au navigateur", pkg: '@axe-core/playwright' },
  { label: 'Pilotage du navigateur de test', pkg: 'playwright' },
];
const PACKAGE_ROOT = new URL('../../', import.meta.url);

const readPackageVersion = (name) =>
  JSON.parse(readFileSync(new URL(`node_modules/${name}/package.json`, PACKAGE_ROOT), 'utf8')).version;

const li = (text) => `<li>${escapeHtml(text)}</li>`;

const renderTool = ({ label, pkg }) => li(`${label} : version ${readPackageVersion(pkg)}`);

const renderTools = () => `<ul>${TOOLS.map(renderTool).join('')}</ul>`;

const renderScope = (scan) => {
  const audited = scan.pages.filter((page) => !page.error).length;
  return `<p>${escapeHtml(audited)} page(s) auditée(s) sur ${escapeHtml(scan.pages.length)} demandée(s), scan du ${escapeHtml(scan.generatedAt)}.</p>`;
};

const renderScoreRules = () => {
  const penalties = IMPACT_ORDER.map((impact) => li(`${IMPACT_FR[impact]} : −${IMPACT_PENALTY[impact]} point(s)`));
  return `<p>Score sur 100 : 100 moins la somme des pénalités de chaque problème distinct (une règle en échec compte une fois, quel que soit son nombre d'occurrences), minimum 0.</p><ul>${penalties.join('')}</ul>`;
};

const renderEstimateHeadline = ({ testable, passing, percent }) =>
  percent === null
    ? 'Estimation non calculée, aucune page auditée.'
    : `${passing} critères testables automatiquement sur ${testable} sans échec détecté.`;

const renderIndicativeRate = ({ percent, unmapped }) =>
  percent === null
    ? ''
    : `<p>Taux indicatif : ${escapeHtml(percent)} % (${escapeHtml(unmapped)} règle(s) sans critère RGAA rattaché comptée(s) comme échec).</p>`;

const renderRgaaEstimate = (scan) => {
  const estimate = computeRgaaEstimate(scan);
  return `<div class="me-warning">
    <p><span class="strong">${escapeHtml(renderEstimateHeadline(estimate))}</span></p>
    ${renderIndicativeRate(estimate)}
    <p>Ce décompte porte uniquement sur les ${escapeHtml(estimate.testable)} critères du RGAA ${escapeHtml(RGAA_CRITERIA_COUNT)} qu'un test automatique peut vérifier. Ce n'est pas un taux de conformité. L'absence d'anomalie détectée ne prouve pas qu'un critère est respecté.</p>
    <p>Ce document n'est pas une déclaration d'accessibilité. Celle-ci relève du critère 1.6 du RGAA et est établie et publiée par l'éditeur du site.</p>
  </div>`;
};

const LIMIT_ITEMS = [
  "La pertinence des alternatives textuelles et des descriptions détaillées (critères 1.3, 1.6, 1.7).",
  "La compréhension des contenus, la cohérence des parcours et la clarté des messages.",
  "Les médias temporels : transcriptions, sous-titres et audiodescription (critères 4.x), non vérifiés ici.",
  "La navigation réelle au clavier et la restitution par un lecteur d'écran.",
  "Les pages non explorées : contenus derrière une connexion, états obtenus après interaction.",
];

export function renderMethodology(scan) {
  return `<section class="page ap-page me-page">
  <h2 class="ap-title">Méthodologie</h2>
  <h3 class="ap-subtitle">Outils et versions</h3>
  ${renderTools()}
  <h3 class="ap-subtitle">Périmètre</h3>
  ${renderScope(scan)}
  <h3 class="ap-subtitle">Calcul du score</h3>
  ${renderScoreRules()}
  <h3 class="ap-subtitle">Estimation partielle RGAA</h3>
  ${renderRgaaEstimate(scan)}
  <h3 class="ap-subtitle">Ce que le test automatique ne couvre pas</h3>
  <ul>${LIMIT_ITEMS.map(li).join('')}</ul>
</section>`;
}
