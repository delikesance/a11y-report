# Décisions

Journal des décisions d'architecture et de produit. Une entrée par décision : date, contexte, décision, conséquences.

## 2026-10-11 : scan robuste sans nouvelle dépendance

- **Date :** 2026-10-11
- **Contexte :** SCAN-01 et SCAN-02 : erreurs HTTP silencieuses, nœuds « incomplete » perdus.
- **Décision :** chaque page porte `audited`, `finalUrl`, `status`, `redirects`, `contentType`, `error` (cause en français) ; `incomplete` devient un tableau de Violation (le compte = `incomplete.length`). Relances bornées (2 par défaut) sur délai, 5xx et erreur réseau. `src/robots.js` est une fonction pure sans dépendance.
- **Conséquences :** le contrat `CONTRACT.md` (`incomplete: number`) est à mettre à jour. Aucune nouvelle dépendance npm.

## 2026-10-11 : estimation RGAA sur les critères automatisables uniquement

- **Date :** 2026-10-11
- **Contexte :** REP-01 demande un pourcentage RGAA. Le test automatique ne couvre qu'une partie des critères, et la déclaration d'accessibilité relève de l'éditeur (critère 1.6).
- **Décision :** pourcentage calculé sur les 29 critères référencés par `src/rules-fr.js`, libellé « estimation partielle », sans nouvelle dépendance. Le libellé des outils reste générique (sans marque tierce) pour respecter `CONTRACT.md`.
- **Conséquences :** le pourcentage peut monter sans que la conformité progresse ; la liste des critères est à revoir si `rules-fr.js` change. Le nom des outils n'apparaît pas dans le rapport : à trancher si la transparence sur les outils doit primer.

## Modèle d'entrée

- **Date :** AAAA-MM-JJ
- **Contexte :**
- **Décision :**
- **Conséquences :**

- **Date :** 2026-10-11
- **Contexte :** Contrôle PDF/UA du rapport. Java absent, pas de sudo ; veraPDF n est pas publié comme CLI sur Maven Central.
- **Décision :** veraPDF 1.30.3 exécuté via l image Docker `verapdf/cli` (tag `latest`, la version 1.30.3 n a pas de tag dédié). Aucune dépendance npm ajoutée. Tests veraPDF sautés si docker est absent.
- **Conséquences :** docker requis pour `verify:pdf` ; le test PDF/UA reste en `todo` jusqu à la correction du pied de page et des métadonnées XMP (voir docs/pdf-accessibility.md).

- **Date :** 2026-10-11
- **Contexte :** PDF/UA : pied de page en marges `@page` non balisé, XMP absent.
- **Décision :** pied de page et numérotation supprimés ; post-traitement JS pur du PDF (XMP, artefacts) dans `src/pdf-accessibility.js`.
- **Conséquences :** le test veraPDF est bloquant ; le post-traitement suppose un PDF Chromium à table xref classique et flux de contenu ligne à ligne.

- **Date :** 2026-10-11
- **Contexte :** Lighthouse mesure l'accessibilité et la performance du site (gate >= 95 / >= 90).
- **Décision :** lighthouse 12.6.0 utilisé comme outil de développement, installé dans un dossier hors dépôt ; aucune dépendance ajoutée à `package.json`.
- **Conséquences :** la mesure n'est pas rejouée en CI ; relancer manuellement avec `CHROME_PATH` pointant vers le Chromium de Playwright.

- **Date :** 2026-10-11
- **Contexte :** aucun contrôle statique du code (lint, types) ; les scripts `lint` et `typecheck` sont attendus par `check:dod`.
- **Décision :** devDependencies `eslint` (+ `@eslint/js`, `globals`) avec la config recommandée en flat config, sans règle de style ; `typescript` (+ `@types/node`) en `checkJs`, `noEmit`, `strict`, vérifiant les types via JSDoc sans compilation ni migration du code en TypeScript.
- **Conséquences :** `npm run lint` et `npm run typecheck` sortent en 0 sur src, scripts, test et design. Aucun `ts-ignore` ni règle ESLint désactivée.

- **Date :** 2026-10-11
- **Contexte :** `strict` signale environ 870 paramètres sans type explicite (`noImplicitAny`) dans un code JavaScript non annoté.
- **Décision :** seule exception à `strict` : `noImplicitAny: false`. Les autres vérifications strictes (null, types de retour, appels) restent actives. Les fonctions évaluées dans le navigateur (`src/scan/page.js`, `scripts/layout-lint/dom-probe.js`, `scripts/check-site-layout.js`) reçoivent les globals navigateur dans ESLint et la lib `DOM` dans tsconfig.
- **Conséquences :** annoter progressivement en JSDoc puis retirer l'exception.

- **Date :** 2026-10-11
- **Contexte :** `package.json` et `LICENSE` déclarent `UNLICENSED`.
- **Décision :** `UNLICENSED` est un espace réservé : le choix de licence est une décision humaine, non prise ici. Alternatives : MIT (réutilisation libre, sans copyleft), AGPL-3.0 (copyleft réseau, protège contre la reprise en SaaS fermé).
- **Conséquences :** ne pas publier sur un registre tant que la licence n'est pas tranchée ; le changement touche `package.json`, `LICENSE` et le README.
