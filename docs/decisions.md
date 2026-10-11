# Décisions

Journal des décisions d'architecture et de produit. Une entrée par décision : date, contexte, décision, conséquences.

## 2026-10-11 : scan robuste sans nouvelle dépendance

- **Date :** 2026-10-11
- **Contexte :** SCAN-01 et SCAN-02 : erreurs HTTP silencieuses, nœuds « incomplete » perdus.
- **Décision :** chaque page porte `audited`, `finalUrl`, `status`, `redirects`, `contentType`, `error` (cause en français) ; `incomplete` devient un tableau de Violation (le compte = `incomplete.length`). Relances bornées (2 par défaut) sur délai, 5xx et erreur réseau. `src/robots.js` est une fonction pure sans dépendance.
- **Conséquences :** le contrat `CONTRACT.md` (`incomplete: number`) est à mettre à jour. Aucune nouvelle dépendance npm.

## Modèle d'entrée

- **Date :** AAAA-MM-JJ
- **Contexte :**
- **Décision :**
- **Conséquences :**
