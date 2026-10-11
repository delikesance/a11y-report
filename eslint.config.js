import js from '@eslint/js';
import globals from 'globals';

const BROWSER_CONTEXT_FILES = ['scripts/check-site-layout.js', 'scripts/layout-lint/dom-probe.js', 'src/scan/page.js'];

export default [
  { ignores: ['node_modules/**', 'out/**', 'site/**', 'design/captures/**', '.claude/**', '.claudework/**'] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { files: BROWSER_CONTEXT_FILES, languageOptions: { globals: { ...globals.node, ...globals.browser } } },
];
