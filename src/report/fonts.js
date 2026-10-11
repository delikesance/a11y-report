import { readFileSync } from 'node:fs';

const FONT_FILES = [
  { family: 'IBM Plex Sans', package: 'ibm-plex-sans', weight: 400 },
  { family: 'IBM Plex Sans', package: 'ibm-plex-sans', weight: 500 },
  { family: 'IBM Plex Sans', package: 'ibm-plex-sans', weight: 600 },
  { family: 'Source Serif 4', package: 'source-serif-4', weight: 600 },
  { family: 'Source Serif 4', package: 'source-serif-4', weight: 700 },
  { family: 'IBM Plex Mono', package: 'ibm-plex-mono', weight: 400 },
];

const fontFace = ({ family, package: name, weight }) => {
  const url = new URL(`../../node_modules/@fontsource/${name}/files/${name}-latin-${weight}-normal.woff2`, import.meta.url);
  const data = readFileSync(url).toString('base64');
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`;
};

export const buildFontCss = () => FONT_FILES.map(fontFace).join('\n');
