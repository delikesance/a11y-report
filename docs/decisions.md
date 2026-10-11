# Décisions

Journal des décisions d'architecture et de produit. Une entrée par décision : date, contexte, décision, conséquences.

## Modèle d'entrée

- **Date :** AAAA-MM-JJ
- **Contexte :**
- **Décision :**
- **Conséquences :**

- **Date :** 2026-10-11
- **Contexte :** Contrôle PDF/UA du rapport. Java absent, pas de sudo ; veraPDF n est pas publié comme CLI sur Maven Central.
- **Décision :** veraPDF 1.30.3 exécuté via l image Docker `verapdf/cli` (tag `latest`, la version 1.30.3 n a pas de tag dédié). Aucune dépendance npm ajoutée. Tests veraPDF sautés si docker est absent.
- **Conséquences :** docker requis pour `verify:pdf` ; le test PDF/UA reste en `todo` jusqu à la correction du pied de page et des métadonnées XMP (voir docs/pdf-accessibility.md).
