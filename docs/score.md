# Score et estimation RGAA

Ce document décrit les calculs affichés dans le rapport. Les fonctions sont dans `src/report/model.js` (score global, pénalités), `src/report/score.js` (score par page) et `src/report/rgaa-estimate.js` (estimation RGAA).

## Score sur 100

- Un **problème** est une règle axe-core en échec, agrégée sur les pages auditées (`collectProblems`).
- Chaque problème retire des points selon son impact : critique 10, majeur 5, modéré 2, mineur 1.
- Score = max(0, 100 − somme des pénalités). Le nombre d'occurrences n'entre pas dans le calcul.
- **Score global** : calculé sur l'ensemble des pages auditées, affiché sur la couverture.
- **Score par page** : même formule, appliquée aux seules violations de la page. Une page injoignable (`error`) n'a pas de score (affiché « — »).

## Estimation RGAA (partielle)

- Référentiel : RGAA 4.1.2, 106 critères (source dans `docs/sources.md`).
- Seuls les **29 critères automatisables** (`AUTOMATABLE_CRITERIA` dans `src/report/rgaa-criteria.js`) sont retenus : ceux référencés par au moins une règle de `src/rules-fr.js`.
- Un critère est en échec si une règle en échec le référence. Sinon il est « sans anomalie détectée ».
- Pourcentage = critères sans anomalie / 29, arrondi à l'unité.
- Libellé obligatoire : « estimation partielle ». Ce n'est jamais un taux de conformité : une absence d'anomalie détectée ne prouve pas qu'un critère est respecté.
- Sans page auditée, le pourcentage n'est pas calculé.

## Limites

- Les critères non automatisables (alternatives pertinentes, médias, parcours, clavier réel) ne sont pas dans le dénominateur.
- Le pourcentage ne remplace ni un audit manuel ni la déclaration d'accessibilité de l'éditeur.
