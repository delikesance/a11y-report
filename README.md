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
| `--format LISTE` | Formats générés : `pdf` (défaut), `json`, `html`, `csv`, `sarif`. Répétable ou séparés par des virgules : `--format json,html`. |
| `--out CHEMIN` | Fichier de sortie (un seul format) ou dossier (plusieurs formats, ou chemin se terminant par `/`). Défaut : `rapport.<format>`. |
| `--branding b.json` | Charge le branding depuis un fichier JSON. Les options passées en ligne de commande l'emportent. |
| `--from-json scan.json` | Recharge un scan sauvegardé au lieu de lancer un audit (aucune URL requise). |
| `--save-json scan.json` | Sauvegarde le résultat de l'audit au format JSON, pour le réutiliser avec `--from-json`. |
| `--concurrency N` | Pages auditées en parallèle, de 1 à 16 (défaut : 1). |
| `--viewport V` | Viewport d'audit : `mobile`, `tablet`, `desktop` ou `LARGEURxHAUTEUR` (ex. `375x812`). Répétable (défaut : `desktop`). |
| `--crawl` | Explore le site à partir de chaque URL donnée (même origine, robots.txt respecté). |
| `--crawl-depth N` | Profondeur maximale des liens suivis, de 0 à 10 (défaut : 2). Requiert `--crawl`. |
| `--max-pages N` | Nombre maximal de pages découvertes, de 1 à 1000 (défaut : 50). Requiert `--crawl`. |
| `--sitemap` / `--no-sitemap` | Lit (défaut) ou ignore le `sitemap.xml`. Requiert `--crawl`. |
| `--exclude MOTIF` | Exclut les URLs correspondant au motif glob ; répétable. Requiert `--crawl`. |
| `--delay MS` | Pause entre deux requêtes d'exploration (défaut : 250 ms). Requiert `--crawl`. |
| `--ci` | Mode intégration continue : sortie réduite sur stdout, code de retour selon les seuils. |
| `--seuil "critical=0,serious=0"` | Seuils CI : `critical`, `serious`, `moderate`, `minor` (nombres d'occurrences), `score` (score minimal), `unaudited` (`true`/`false`). Requiert `--ci`. |
| `--seuils-fichier s.json` | Seuils CI lus dans un fichier JSON ; `--seuil` l'emporte. Requiert `--ci`. |
| `--ci-format github\|text` | Format des résultats CI : annotations GitHub ou texte (défaut : `text`). Requiert `--ci`. |
| `-h, --help` | Affiche l'aide. |

Codes de retour : `0` succès (ou seuils respectés avec `--ci`), `1` erreur d'utilisation ou d'exécution (URL invalide, option inconnue, fichier illisible, aucune URL), `2` seuils CI non respectés, `3` page non auditée alors que les seuils l'interdisent. Toute erreur affiche un message `Erreur : ...`. L'aide complète est affichée par `--help`.

Exemples :

```bash
# Rapports JSON et HTML dans ./rapports, 4 pages en parallèle, mobile et desktop
node src/cli.js https://exemple.fr/ --crawl --max-pages 30 --concurrency 4 \
  --viewport mobile --viewport desktop --format json,html --out ./rapports \
  --client "Exemple SAS" --agency "Mon Agence"

# Échec du build si la moindre occurrence critique ou grave subsiste
node src/cli.js https://exemple.fr/ --ci --seuil "critical=0,serious=0" --ci-format github \
  --format json --client "Exemple SAS" --agency "Mon Agence"
```

Pour l'intégration continue, voir [docs/ci.md](docs/ci.md).

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
