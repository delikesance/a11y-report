# a11y-report

Génère un rapport PDF d'audit d'accessibilité (axe-core, WCAG 2.0/2.1/2.2 A et AA, bonnes pratiques) à partir d'une liste d'URLs, aux couleurs et au nom de votre agence.

## Installation

Prérequis : Node.js 22 ou plus.

```bash
npm install
npx playwright install chromium
```

## Utilisation

```bash
node src/cli.js https://exemple.fr https://exemple.fr/contact \
  --client "Exemple SAS" \
  --agency "Mon Agence" \
  --color "#1d4ed8" \
  --contact "contact@agence.fr" \
  --out rapport-exemple.pdf
```

La progression s'affiche sur la sortie d'erreur ; le PDF est écrit à l'emplacement de `--out`.

## Options

| Option | Description |
| --- | --- |
| `<url...>` | Une ou plusieurs URLs `http://` ou `https://` à auditer. |
| `--client "X"` | Nom du client (requis, sauf via `--branding`). |
| `--agency "Y"` | Nom de l'agence (requis, sauf via `--branding`). |
| `--logo f.png` | Logo de l'agence affiché dans le rapport. |
| `--color #rrggbb` | Couleur principale du rapport. |
| `--contact "..."` | Coordonnées affichées dans le rapport. |
| `--taux 80` | Taux horaire en euros HT pour chiffrer le devis. |
| `--telephone "..."` | Téléphone affiché dans le devis. |
| `--validite 30` | Validité du devis en jours (défaut : 30). |
| `--out rapport.pdf` | Fichier PDF généré (défaut : `rapport.pdf`). |
| `--branding b.json` | Charge le branding depuis un fichier JSON. Les options passées en ligne de commande l'emportent. |
| `--from-json scan.json` | Recharge un scan sauvegardé au lieu de lancer un audit (aucune URL requise). |
| `--save-json scan.json` | Sauvegarde le résultat de l'audit au format JSON, pour le réutiliser avec `--from-json`. |
| `-h, --help` | Affiche l'aide. |

Sans URL et sans `--from-json`, la commande affiche l'aide et se termine avec le code 1. Toute erreur (URL invalide, option inconnue, fichier illisible) affiche un message `Erreur : ...` et se termine avec le code 1.

## Devis intégré

Le rapport se termine par un devis par phase (bloquants, gênants, finitions) avec la durée estimée de chaque phase. Sans `--taux`, le devis affiche les durées sans prix.

```bash
node src/cli.js https://exemple.fr \
  --client "Exemple SAS" \
  --agency "Mon Agence" \
  --taux 80 \
  --telephone "01 23 45 67 89" \
  --validite 30
```

Avec `--taux 80`, chaque phase reçoit un prix HT calculé à partir de ce taux horaire.

## Format de `branding.json`

```json
{
  "agency": "Mon Agence",
  "client": "Exemple SAS",
  "logoPath": "logo.png",
  "primaryColor": "#1d4ed8",
  "accentColor": "#f59e0b",
  "contact": "contact@agence.fr",
  "date": "2026-10-11"
}
```

| Champ | Obligatoire | Description |
| --- | --- | --- |
| `agency` | oui | Nom de l'agence. Seule marque mentionnée dans le PDF. |
| `client` | oui | Nom du client audité. |
| `logoPath` | non | Chemin du logo de l'agence. |
| `primaryColor` | non | Couleur principale au format `#rrggbb`. |
| `accentColor` | non | Couleur d'accent au format `#rrggbb`. |
| `contact` | non | Coordonnées affichées dans le rapport. |
| `date` | non | Date affichée dans le rapport. |
| `hourlyRate` | non | Taux horaire en euros HT pour le devis. |
| `phone` | non | Téléphone affiché dans le devis. |
| `quoteValidityDays` | non | Validité du devis en jours (défaut : 30). |

## Limites de l'audit automatique

- Un audit automatique détecte environ un tiers des problèmes d'accessibilité : il ne remplace pas un test manuel avec des lecteurs d'écran et un contrôle au clavier.
- Les contenus accessibles uniquement après connexion, interaction ou saisie ne sont pas audités, sauf si l'URL les atteint directement.
- Une page injoignable apparaît dans le rapport avec son erreur, sans interrompre l'audit des autres pages.
- Les points marqués « incomplet » par axe-core demandent une vérification humaine.
- Le rapport couvre les règles axe-core ; il n'est pas une certification de conformité RGAA ou WCAG.

## Tests

```bash
npm test
```

## Vérification PDF

`npm run verify:pdf -- rapport.pdf` lance veraPDF (profil PDF/UA-1) via docker (`verapdf/cli`). Sortie non nulle si le PDF n est pas conforme. Limites : voir `docs/pdf-accessibility.md`.
