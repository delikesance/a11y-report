import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const RENDER_DPI = 50;
export const MIN_CONTENT_END = 0.45;
export const MAX_BLANK_BAND = 0.4;
const INK_THRESHOLD = 235;
const FOOTER_BAND = 0.06;
const PGM_HEADER = /^P5\s+(\d+)\s+(\d+)\s+255\s/;
const HEADER_PROBE_BYTES = 32;

export function parsePgm(buffer) {
  const [header, width, height] = buffer.toString('latin1', 0, HEADER_PROBE_BYTES).match(PGM_HEADER);
  return { width: Number(width), height: Number(height), pixels: buffer.subarray(header.length) };
}

export function contentEnd({ width, height, pixels }) {
  const lastRow = Math.floor(height * (1 - FOOTER_BAND));
  for (let row = lastRow; row >= 0; row -= 1) {
    for (let column = 0; column < width; column += 1) {
      if (pixels[row * width + column] < INK_THRESHOLD) return (row + 1) / height;
    }
  }
  return 0;
}

export function longestBlankBand({ width, height, pixels }) {
  let longest = 0;
  let current = 0;
  let seenInk = false;
  for (let row = 0; row < height; row += 1) {
    const inked = pixels.subarray(row * width, (row + 1) * width).some((value) => value < INK_THRESHOLD);
    if (inked) {
      if (seenInk) longest = Math.max(longest, current);
      seenInk = true;
      current = 0;
    } else current += 1;
  }
  return longest / height;
}

export function findEmptyPages(measures, { minEnd = MIN_CONTENT_END, maxBand = MAX_BLANK_BAND } = {}) {
  const lastIndex = measures.length - 1;
  return measures.flatMap(({ end, band }, index) => {
    const page = index + 1;
    if (index === 0 || index === lastIndex) return [];
    const defects = [];
    if (end < minEnd) defects.push({ page, kind: 'nearly-empty', detail: `contenu jusqu'à ${Math.round(end * 100)} % de la hauteur` });
    else if (band > maxBand) defects.push({ page, kind: 'blank-band', detail: `vide continu de ${Math.round(band * 100)} % de la hauteur` });
    return defects;
  });
}

export function measurePages(pdfBytes) {
  const dir = mkdtempSync(join(tmpdir(), 'layout-lint-'));
  try {
    writeFileSync(join(dir, 'in.pdf'), pdfBytes);
    spawnSync('pdftoppm', ['-gray', '-r', String(RENDER_DPI), join(dir, 'in.pdf'), join(dir, 'p')]);
    return readdirSync(dir)
      .filter((name) => name.endsWith('.pgm'))
      .sort()
      .map((name) => parsePgm(readFileSync(join(dir, name))))
      .map((image) => ({ end: contentEnd(image), band: longestBlankBand(image) }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
