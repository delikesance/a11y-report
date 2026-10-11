const PRESETS = {
  mobile: { name: 'mobile', width: 375, height: 812, isMobile: true, hasTouch: true },
  tablet: { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
  desktop: { name: 'desktop', width: 1280, height: 800, isMobile: false, hasTouch: false },
};

export const DEFAULT_VIEWPORT = PRESETS.desktop;

const SIZE_PATTERN = /^(\d+)x(\d+)$/i;

const invalidViewport = (value) =>
  new Error(`Viewport invalide « ${value} » : attendu LARGEURxHAUTEUR (ex. 375x812), mobile, tablet ou desktop`);

const presetFor = (value) => (Object.hasOwn(PRESETS, value) ? { ...PRESETS[value] } : null);

const sizeFor = (value) => {
  const match = SIZE_PATTERN.exec(value);
  if (!match) return null;
  const [width, height] = match.slice(1).map(Number);
  if (width < 1 || height < 1) return null;
  return { name: `${width}x${height}`, width, height, isMobile: false, hasTouch: false };
};

export function parseViewport(value) {
  const viewport = presetFor(value) ?? sizeFor(value);
  if (!viewport) throw invalidViewport(value);
  return viewport;
}
