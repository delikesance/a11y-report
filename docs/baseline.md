# Baseline technique : a11y-reports

Photographie de l'existant, établie avant les évolutions visées (formats, concurrence, viewport, crawl, mode CI, score détaillé, PDF balisé). Mesures prises sur le dépôt courant avec `npm test` et `node --test --experimental-test-coverage test/*.test.js`.

## 1. Architecture

Node 22, ESM, dépendances : `playwright`, `@axe-core/playwright` (axe-core 4.13.0, 105 règles), polices `@fontsource/*`.

| Module | Rôle |
| --- | --- |
| `src/cli.js` (148 l.) | Parsing des options (`parseArgs`), branding, aide, orchestration scan / rapport, codes de sortie. |
| `src/scan.js` (66 l.) | `scanPages(urls)` : un navigateur Chromium headless, une page par URL, axe-core WCAG 2.0/2.1/2.2 A+AA + bonnes pratiques. Renvoie `{ generatedAt, pages }`. |
| `src/rules-fr.js` (554 l.) | `describeRule(id)` : titre, pourquoi, correction, exemples avant/après, minutes par occurrence, référence RGAA. Fallback générique pour les id inconnus. |
| `src/report.js` (67 l.) | `buildReportHtml(scan, branding)` (HTML autonome A4) et `renderPdf(html, out)` (Chromium, pied de page numéroté). |
| `src/report/` | Sections du rapport : `model.js` (agrégation, score, devis), `cover.js`, `summary.js`, `details.js`, `quote.js`, `appendix.js`, `shared.js` (formatage, textes communs), `fonts.js`. |
| `src/report/styles/*.css`, `src/report.css` | CSS inline du rapport, par section. |

Contrat entre modules : voir `CONTRACT.md`.

## 2. Flux de données

```
URLs ──► scan.js (Playwright + axe-core)
           │  Scan { generatedAt, pages: Page[] }
           │  Page { url, title, violations, passes, incomplete, error? }
           ▼
     [--save-json] ◄──► [--from-json]          (scan sérialisable)
           │
           ▼
  report/model.js : problèmes agrégés, score, phases du devis
           │  (describeRule enrichit chaque règle)
           ▼
  report.js → report/*.js → HTML autonome (CSS inline, polices embarquées)
           │
           ▼
  renderPdf (Chromium, A4) → rapport.pdf
```

Point d'entrée : `cli.js` (branding : fichier `--branding` puis options en ligne de commande).

## 3. Dette technique

- **Erreurs HTTP ignorées.** `scan.js` appelle `page.goto(url, { waitUntil: 'load' })` sans lire la réponse : une page 404 ou 500 est auditée comme si elle était saine, et son rapport ne le signale pas. Seules les exceptions de navigation (injoignable, timeout) remplissent `error`.
- **Résultats « incomplete » perdus.** `scan.js` ne conserve que le compte `incomplete` ; les nœuds concernés (sortie d'axe) ne sont pas stockés, donc le rapport ne peut ni les lister ni les chiffrer.
- **Règles sans texte spécifique.** 46 règles axe-core sur 105 n'ont pas d'entrée dans `src/rules-fr.js` (59 clés) et reçoivent le texte générique : `accesskeys`, `aria-allowed-role`, `aria-dialog-name`, `aria-tab-name`, `audio-caption`, `autocomplete-valid`, `color-contrast-enhanced`, `duplicate-id`, `duplicate-id-active`, `frame-tested`, `hidden-content`, `image-redundant-alt`, `landmark-*-is-top-level` (3), `marquee`, `meta-refresh-no-exceptions`, `p-as-heading`, `summary-name`, `td-has-header`, entre autres. Liste complète : `node` comparant `getRules()` d'axe-core aux clés de `RULES`.
- **Devis sans TVA.** Les prix sont en « € » HT, sans ligne de TVA ni total TTC. Sans `--taux`, les prix affichent un tiret (`EMPTY_VALUE`), pas « 0 € » : le défaut attendu n'est pas un problème actuel.
- **Score global seulement.** `model.js` calcule un score sur 100 (pénalités par impact) affiché en couverture. Il n'existe ni score par page, ni méthodologie documentée dans le rapport, ni pourcentage de conformité RGAA.
- **PDF non balisé.** Aucune trace de balisage (tags, langue du document, titres de signets) dans `report.js` ni `renderPdf` ; le PDF n'est pas accessible en lecture par un lecteur d'écran.
- **CLI restreinte.** Options présentes : `--client`, `--agency`, `--logo`, `--color`, `--contact`, `--taux`, `--telephone`, `--validite`, `--out`, `--branding`, `--from-json`, `--save-json`. Absentes : `--format`, `--concurrency`, `--viewport`, `--crawl`, `--ci`.

## 4. Inventaire des tests

Huit fichiers, **110 tests, 0 échec**, durée d'environ 1,1 s (`npm test`).

| Fichier | Périmètre (d'après le nom, à vérifier) |
| --- | --- |
| `test/scan.test.js` | `scanPages` (succès, page injoignable, agrégation) |
| `test/rules-fr.test.js` | `describeRule`, constantes d'impact, fallback |
| `test/model.test.js` | agrégation, score |
| `test/quote.test.js` | phases du devis, prix avec et sans taux |
| `test/details.test.js` | section détails |
| `test/cover-summary.test.js` | couverture et synthèse |
| `test/report.test.js` | HTML autonome du rapport |
| `test/cli.test.js` | options, aide, erreurs, codes de sortie |

Couverture (`--experimental-test-coverage`), lignes / branches / fonctions :

| Fichier | Lignes | Branches | Fonctions | Lignes non couvertes |
| --- | --- | --- | --- | --- |
| `src/cli.js` | 75,68 % | 96,67 % | 70,00 % | 108-113, 115-136, 138-145 |
| `src/report.js` | 100 % | 85,71 % | 100 % | — |
| `src/report/shared.js` | 86,67 % | 76,92 % | 71,43 % | 37, 41-45 |
| `src/report/cover.js` | 100 % | 88,89 % | 100 % | — |
| `src/report/quote.js` | 100 % | 96,30 % | 100 % | — |
| `src/report/model.js` | 100 % | 95,65 % | 100 % | — |
| `src/scan.js` | 100 % | 91,67 % | 88,89 % | — |
| `src/rules-fr.js` | 100 % | 100 % | 100 % | — |
| `src/report/appendix.js`, `details.js`, `fonts.js`, `summary.js` | 100 % | 100 % | 100 % | — |
| **Total** | **97,87 %** | **96,69 %** | **96,94 %** | |

Lacunes de couverture constatées : `cli.js` lignes 108-145 (exécution réelle) et branches de `shared.js` non couvertes.

## 5. Écarts par rapport à la cible

| Exigence cible | État actuel |
| --- | --- |
| Signaler les erreurs HTTP par page | Absent : `goto` sans contrôle de statut (`scan.js:33`). |
| Conserver et afficher les résultats « incomplete » d'axe | Absent : seul le compte est gardé (`scan.js:40`). |
| Texte spécifique pour les 105 règles axe-core | 59 règles sur 105 couvertes ; 46 en texte générique. |
| Devis avec TVA et total TTC | Absent ; HT uniquement, sans total TTC. |
| Score par page, méthodologie, pourcentage RGAA | Score global sur 100 seulement ; pas de score par page, pas de méthodologie ni de pourcentage RGAA. |
| PDF balisé (accessible) | Absent. |
| CLI `--format`, `--concurrency`, `--viewport`, `--crawl`, `--ci` | Absentes. |

Écarts déjà couverts : devis par phase (`quote.js`, `model.js`), mode `--from-json` / `--save-json`, branding par fichier, pied de page numéroté.
