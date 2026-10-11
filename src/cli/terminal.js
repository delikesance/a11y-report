const ANSI_CODES = { bold: 1, dim: 2, red: 31, green: 32, yellow: 33, cyan: 36 };
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;
const SYMBOLS = {
  ok: { unicode: '✔', ascii: 'OK', style: 'green' },
  fail: { unicode: '✖', ascii: 'KO', style: 'red' },
  warn: { unicode: '⚠', ascii: '!', style: 'yellow' },
};
const FALLBACK_WIDTH = 80;
const UTF8_LOCALE = /utf-?8/i;

const isSet = (value) => Boolean(value) && value !== '0';
const positive = (value) => (Number(value) > 0 ? Number(value) : undefined);

function useColor(stream, { env, argv }) {
  if (argv.includes('--no-color') || env.NO_COLOR) return false;
  return isSet(env.FORCE_COLOR) || Boolean(stream.isTTY);
}

function useUnicode(env) {
  if (env.TERM === 'dumb') return false;
  return UTF8_LOCALE.test(env.LC_ALL || env.LC_CTYPE || env.LANG || '');
}

export const stripAnsi = (text) => text.replace(ANSI_PATTERN, '');

export const visibleLength = (text) => [...stripAnsi(text)].length;

export function detectTerminal(stream, { env = process.env, argv = [] } = {}) {
  const color = useColor(stream, { env, argv });
  const unicode = useUnicode(env);
  const width = positive(stream.isTTY ? stream.columns : env.COLUMNS) ?? FALLBACK_WIDTH;
  const paint = (style, text) => (color ? `\x1b[${ANSI_CODES[style]}m${text}\x1b[0m` : text);
  const symbol = (name) => {
    const glyph = SYMBOLS[name];
    const text = unicode ? glyph.unicode : glyph.ascii;
    return paint(glyph.style, text);
  };
  return { color, unicode, width, paint, symbol, ruleChar: unicode ? '─' : '-', ellipsis: unicode ? '…' : '...' };
}
