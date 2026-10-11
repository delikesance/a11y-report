# Audit du site

Date : 2026-10-11. Site servi en local (`python3 -m http.server`, dossier `site/`), neuf pages.

## 1. Audit axe-core par l'outil (dogfooding)

Commande : `node src/cli.js <9 URLs> --viewport mobile|desktop --format json,html`.

| Page | Mobile violations / passes / incomplete | Desktop violations / passes / incomplete |
| --- | --- | --- |
| index.html | 0 / 35 / 0 | 0 / 35 / 0 |
| fonctionnalites.html | 0 / 32 / 0 | 0 / 32 / 0 |
| demo.html | 0 / 31 / 0 | 0 / 31 / 0 |
| tarifs.html | 0 / 36 / 0 | 0 / 36 / 0 |
| faq.html | 0 / 33 / 0 | 0 / 33 / 0 |
| documentation.html | 0 / 36 / 0 | 0 / 36 / 0 |
| mentions-legales.html | 0 / 31 / 0 | 0 / 31 / 0 |
| politique-de-confidentialite.html | 0 / 31 / 0 | 0 / 31 / 0 |
| declaration-d-accessibilite.html | 0 / 31 / 0 | 0 / 31 / 0 |

Premier passage : 1 violation `scrollable-region-focusable` (serious) sur `documentation.html` en mobile, due aux blocs `<pre>` défilants. Correction : `white-space: pre-wrap; overflow-wrap: anywhere` sur `pre` (source `scripts/site/base.css`, CSS régénéré). Les blocs ne défilent plus, la violation disparaît. Un essai avec `tabindex="0"` a été écarté, il n'était pas nécessaire.

Items `incomplete` : 0 sur les 18 audits. Aucun item à revoir manuellement issu de cet outil.

## 2. Lighthouse (mobile, simulation par défaut)

Version : lighthouse 12.6.0, installée hors du projet (dossier scratch), non ajoutée aux dépendances.

| Page | Performance | Accessibilité | LCP | CLS |
| --- | --- | --- | --- | --- |
| index.html | 100 | 100 | 1,4 s | 0 |
| fonctionnalites.html | 100 | 100 | 1,5 s | 0,007 |
| tarifs.html | 100 | 100 | 1,4 s | 0,006 |

Seuils : accessibilité >= 95, performance >= 90. Atteints sans modification de performance : polices déjà en `font-display: swap` et au format woff2, images avec dimensions, CSS unique sans script bloquant.

## 3. Liens et ressources

`node scripts/check-links.js` : liens internes, ancres, `src`, `url()` des CSS. Résultat : 9 pages, 0 lien cassé, 0 lien externe dans les pages. Le script n'interroge le réseau que avec `--verify-sources`, et seulement pour les URLs citées dans `docs/sources.md`.

Correction associée : `demo.html` pointait vers `assets/exemple-rapport.pdf` et `.html` absents. Les deux fichiers ont été générés par la CLI (rapport d'exemple) et ajoutés à `site/assets/`.

## 4. Mise en page (360, 768, 1280 px)

`node scripts/check-site-layout.js` (Playwright Chromium) : 9 pages x 3 largeurs, 0 défilement horizontal, 0 élément hors écran. Avant correction : 1 échec (blocs `<pre>` de `documentation.html` à 360 px).

## 5. Déclaration d'accessibilité

Mise à jour avec le résultat réel : contrôle automatisé sans anomalie, aucune évaluation manuelle. Restent à compléter par l'éditeur : adresse de contact et la note éditeur à valider.
