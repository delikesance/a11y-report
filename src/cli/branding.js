import { resolveQuoteRates } from '../report/quote-rates.js';
import { definedEntries, parsePositive, readJson } from './values.js';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function loadBranding(options) {
  const fromFile = options.branding ? readJson(options.branding) : {};
  const fromFlags = definedEntries({
    agency: options.agency,
    client: options.client,
    logoPath: options.logo,
    primaryColor: options.color,
    contact: options.contact,
    phone: options.telephone,
    tjm: parsePositive(options.taux, 'Taux horaire'),
    quoteValidityDays: parsePositive(options.validite, 'Validité du devis', Number.isInteger),
  });
  const branding = { ...fromFile, ...fromFlags };

  if (!branding.agency) throw new Error('--agency est requis (ou "agency" dans --branding).');
  if (!branding.client) throw new Error('--client est requis (ou "client" dans --branding).');
  if (branding.primaryColor !== undefined && !HEX_COLOR.test(branding.primaryColor)) {
    throw new Error(`Couleur invalide (format #rrggbb attendu) : ${branding.primaryColor}`);
  }
  resolveQuoteRates(branding);
  return branding;
}
