const SRGB_LINEAR_CUTOFF = 0.03928;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_SCALE = 1.055;
const SRGB_GAMMA = 2.4;
const HEX_CHANNEL_OFFSETS = [1, 3, 5];
const LUMA_WEIGHTS = [0.2126, 0.7152, 0.0722];
const MAX_CHANNEL = 255;

export const REQUIRED_RATIO = { body: 4.5, large: 3, ui: 3 };

const linearizeChannel = (value) => {
  const channel = value / MAX_CHANNEL;
  if (channel <= SRGB_LINEAR_CUTOFF) return channel / SRGB_LINEAR_DIVISOR;
  return ((channel + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_SCALE) ** SRGB_GAMMA;
};

export function relativeLuminance(hex) {
  const channels = HEX_CHANNEL_OFFSETS.map((offset) => linearizeChannel(parseInt(hex.slice(offset, offset + 2), 16)));
  return channels.reduce((sum, channel, index) => sum + LUMA_WEIGHTS[index] * channel, 0);
}

export function contrastRatio(first, second) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const readToken = (tokens, path) => path.split('.').reduce((node, key) => node[key], tokens);

export function checkPairs(tokens) {
  return tokens.contrast.pairs.map(({ text, background, kind }) => {
    const ratio = contrastRatio(readToken(tokens, text), readToken(tokens, background));
    const required = REQUIRED_RATIO[kind];
    return { text, background, kind, ratio, required, pass: ratio >= required };
  });
}
