export const formatNumber = (value) => value.toLocaleString('fr-FR');

export const EXCLUSIONS = [
  'Refonte graphique ou technique au-delà des corrections listées',
  'Rédaction ou traduction des contenus',
  'Audit manuel et tests avec des utilisateurs de technologies d\'assistance',
  'Hébergement, nom de domaine et frais de déplacement',
];

const formatPercent = (fraction) => `${formatNumber(Math.round(fraction * 1000) / 10)} %`;

export function hypothesesFor({ rates }) {
  return [
    `Taux journalier de ${formatNumber(rates.tjm)} € HT, marge de ${formatPercent(rates.marge)}, minimum de ${formatNumber(rates.minimumPhase)} € HT par étape`,
    'Temps de correction par occurrence issu du référentiel ; une occurrence identique (même code et même sélecteur) n\'est comptée qu\'une fois',
    'Durées arrondies à la demi-heure ; fourchette de −20 % à +30 % autour du montant estimé',
    'Étapes sans problème non chiffrées',
  ];
}
