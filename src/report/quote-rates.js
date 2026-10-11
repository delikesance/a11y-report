const DEFAULT_TJM = 550;
const DEFAULT_MARGE = 0.15;
const DEFAULT_TVA = 0.2;

const isPositive = (value) => Number.isFinite(value) && value > 0;
const isFraction = (value) => Number.isFinite(value) && value >= 0 && value < 1;

function pickValid(value, fallback, isValid, label) {
  const resolved = value ?? fallback;
  if (!isValid(resolved)) throw new Error(`${label} invalide : ${resolved}`);
  return resolved;
}

export function resolveQuoteRates(branding = {}) {
  const tjm = pickValid(branding.tjm, DEFAULT_TJM, isPositive, 'TJM');
  return {
    tjm,
    marge: pickValid(branding.marge, DEFAULT_MARGE, isFraction, 'Marge'),
    tva: pickValid(branding.tva, DEFAULT_TVA, isFraction, 'TVA'),
    minimumPhase: pickValid(branding.minimumPhase, tjm, isPositive, 'Minimum par étape'),
  };
}
