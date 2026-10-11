import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { IMPACT_FR } from '../rules-fr.js';

export const DEFAULT_PRIMARY = '#1f3a5f';
export const DEFAULT_ACCENT = '#e07a1f';
export const SNIPPET_MAX_LENGTH = 240;
export const EXAMPLES_PER_PROBLEM = 3;
export const TOP_PRIORITIES = 5;
export const LIMITS_PARAGRAPHS = [
  "Un scan automatique détecte environ 30 à 40 % des problèmes d'accessibilité. Les autres exigences (pertinence des alternatives textuelles, cohérence des parcours, compréhension des contenus, navigation au clavier) nécessitent un audit manuel.",
  "Ce rapport ne remplace ni un audit manuel, ni une déclaration de conformité au RGAA.",
];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const MIME_BY_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ENTITIES[char]);

const URL_BREAK_AFTER = /(?<=[/?&=_-])(?!\/)/;

export const breakableUrl = (url) => String(url ?? '').split(URL_BREAK_AFTER).map(escapeHtml).join('<wbr>');

export const brandColor = (value, fallback) => (HEX_COLOR.test(value ?? '') ? value : fallback);

export const truncate = (text) =>
  text.length > SNIPPET_MAX_LENGTH ? `${text.slice(0, SNIPPET_MAX_LENGTH)}…` : text;

export const badge = (impact) =>
  `<span class="badge ${escapeHtml(impact)}">${escapeHtml(IMPACT_FR[impact])}</span>`;

export const formatHours = (hours) => (hours === 1 ? '1 heure' : `${hours} heures`);

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

export function renderLogo(logoPath, agency) {
  if (!logoPath) return '';
  const mime = MIME_BY_EXTENSION[extname(logoPath).toLowerCase()] ?? 'application/octet-stream';
  const data = readFileSync(logoPath).toString('base64');
  return `<img class="logo" alt="${escapeHtml(agency)}" src="data:${mime};base64,${data}">`;
}
