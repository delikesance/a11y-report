import { readFileSync } from 'node:fs';

export function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`Fichier JSON illisible ou invalide : ${path}`);
  }
}

export function definedEntries(entries) {
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined));
}

export function parsePositive(raw, label, isValid = Number.isFinite) {
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (value <= 0 || !isValid(value)) throw new Error(`${label} invalide (nombre positif attendu) : ${raw}`);
  return value;
}

export const splitList = (values) =>
  values
    .flatMap((value) => value.split(','))
    .map((part) => part.trim())
    .filter(Boolean);

export function parseIntOption(raw, { flag, min, max, example }) {
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || value < min || value > max) {
    throw new Error(`${flag} doit être un entier entre ${min} et ${max} (reçu : ${raw}). Exemple : ${flag} ${example}`);
  }
  return value;
}
