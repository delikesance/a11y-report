import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_PATH = join(ROOT_DIR, 'design', 'tokens.json');
const BASE_PATH = join(ROOT_DIR, 'scripts', 'site', 'base.css');
const OUTPUT_PATH = join(ROOT_DIR, 'site', 'assets', 'site.css');
const SITE_BRAND = 'agence-sobre';
const FONT_FILES = [
  { family: 'sans', weight: 'regular', file: 'ibm-plex-sans-latin-400-normal.woff2' },
  { family: 'sans', weight: 'semibold', file: 'ibm-plex-sans-latin-600-normal.woff2' },
  { family: 'serif', weight: 'semibold', file: 'source-serif-4-latin-600-normal.woff2' },
  { family: 'mono', weight: 'regular', file: 'ibm-plex-mono-latin-400-normal.woff2' },
];

const declarations = (prefix, values) =>
  Object.entries(values).map(([key, value]) => `--${prefix}-${key}:${value};`).join('');

const FALLBACK = { sans: 'system-ui, sans-serif', serif: 'Georgia, serif', mono: 'ui-monospace, monospace' };

const fontStacks = (families) =>
  Object.entries(families).map(([key, name]) => `--font-${key}:"${name}",${FALLBACK[key]};`).join('');

const colorVariables =(palette) =>
  Object.entries(palette).map(([key, value]) => `--color-${key}:${value};`).join('');

const brandVariables = (brand) => [
  `--brand-primary:${brand.primary};`,
  `--brand-accent:${brand.accent};`,
  `--brand-on-primary:${brand.onPrimary};`,
].join('');

const fontFace = (tokens, { family, weight, file }) => `@font-face{font-family:"${tokens.typography.family[family]}";font-weight:${tokens.typography.weight[weight]};font-style:normal;font-display:swap;src:url("fonts/${file}") format("woff2");}`;

const tokenRules = (tokens) => {
  const shared = [
    fontStacks(tokens.typography.family),
    declarations('size', tokens.typography.scale),
    declarations('weight', tokens.typography.weight),
    declarations('space', tokens.space),
    declarations('radius', tokens.radius),
    brandVariables(tokens.color.brands[SITE_BRAND]),
  ].join('');
  const light = `${colorVariables(tokens.color.neutral)}${shared}`;
  const dark = colorVariables(tokens.color.neutralDark);
  return `:root{${light}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}
:root[data-theme="dark"]{${dark}}`;
};

export function buildSiteCss(tokens, base) {
  const fonts = FONT_FILES.map((font) => fontFace(tokens, font)).join('\n');
  return `${fonts}\n${tokenRules(tokens)}\n${base}`;
}

function main() {
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));
  const base = readFileSync(BASE_PATH, 'utf8');
  writeFileSync(OUTPUT_PATH, buildSiteCss(tokens, base));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
