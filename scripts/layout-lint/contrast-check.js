import { contrastRatio, REQUIRED_RATIO } from '../../design/contrast.js';

const LARGE_PX = 24;
const LARGE_BOLD_PX = 18.66;
const BOLD_WEIGHT = 700;
const HEX_RADIX = 16;

const toHex = (channels) =>
  `#${channels.map((channel) => Math.round(channel).toString(HEX_RADIX).padStart(2, '0')).join('')}`;

const isLarge = ({ size, weight }) => size >= LARGE_PX || (size >= LARGE_BOLD_PX && weight >= BOLD_WEIGHT);

export function findLowContrast(samples) {
  return samples
    .map((sample) => ({
      sample,
      required: isLarge(sample) ? REQUIRED_RATIO.large : REQUIRED_RATIO.body,
      ratio: contrastRatio(toHex(sample.fg), toHex(sample.bg)),
    }))
    .filter(({ ratio, required }) => ratio < required)
    .map(({ sample, ratio, required }) => ({
      page: sample.page,
      kind: 'low-contrast',
      detail: `${sample.selector} « ${sample.text} » ${ratio.toFixed(2)}:1 < ${required}:1`,
    }));
}
