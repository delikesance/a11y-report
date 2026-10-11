import tokens from '../../design/tokens.json' with { type: 'json' };
import { DEFAULT_ACCENT, DEFAULT_PRIMARY, brandColor } from '../report/shared.js';

const FONT_STACK = {
  sans: `"${tokens.typography.family.sans}", system-ui, sans-serif`,
  serif: `"${tokens.typography.family.serif}", Georgia, serif`,
  mono: `"${tokens.typography.family.mono}", ui-monospace, monospace`,
};

const declarations = (prefix, values) =>
  Object.entries(values).map(([key, value]) => `--${prefix}-${key}:${value};`).join('');

const neutralVariables = (neutral) =>
  Object.entries(neutral).map(([key, value]) => `--${key}:${value};`).join('');

const brandVariables = (branding) => [
  `--primary:${brandColor(branding.primaryColor, DEFAULT_PRIMARY)};`,
  `--accent:${brandColor(branding.accentColor, DEFAULT_ACCENT)};`,
].join('');

const sharedVariables = () => [
  declarations('font', FONT_STACK),
  declarations('size', tokens.typography.scale),
  declarations('space', tokens.space),
  declarations('radius', tokens.radius),
].join('');

export function renderTokenCss(branding) {
  const light = `${neutralVariables(tokens.color.neutral)}${brandVariables(branding)}${sharedVariables()}`;
  const dark = neutralVariables(tokens.color.neutralDark);
  return `:root{${light}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}
:root[data-theme="dark"]{${dark}}`;
}
