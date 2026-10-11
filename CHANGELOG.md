# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [1.0.0] - 2026-10-11

### Audit

- Une page en erreur HTTP, redirigée ou injoignable est signalée dans le rapport ; nouvelles tentatives automatiques ; résultats « incomplete » d'axe conservés sous forme de liste.
- Audit en parallèle (`--concurrency`) et par viewport (`--viewport`, préréglages mobile, tablet, desktop ou LARGEURxHAUTEUR).
- Exploration d'un site (`--crawl`, `--crawl-depth`, `--max-pages`, `--sitemap`/`--no-sitemap`, `--exclude`, `--delay`) : même origine, `robots.txt` respecté, entités HTML décodées, redirections hors origine refusées.

### Rapport

- Fiches en français pour les règles axe-core, avec correspondance RGAA et WCAG.
- Score par page, page de méthodologie et estimation partielle RGAA en décompte de critères, avec taux indicatif.
- Devis chiffré à partir du TJM, avec marge, TVA, total TTC et fourchette (`tjm`, `marge`, `tva`, `minimumPhase` dans le branding).
- Mise en page : devis sur une page, couleurs issues des jetons de design, trois brandings de démonstration, rapport HTML avec thème sombre et impression.
- Contrôle automatique de mise en page du PDF.

### PDF accessible

- PDF balisé, langue `fr`, signets, métadonnées XMP et décorations marquées en artefacts : conforme PDF/UA-1 selon veraPDF.
- `npm run verify:pdf` pour contrôler un PDF avec veraPDF.

### Formats et CLI

- `--format` : pdf, json, html, csv, sarif (répétable ou en liste) ; `--out` accepte un dossier ; `--from-json` et `--save-json`.
- Mode CI : `--ci`, `--seuil`, `--seuils-fichier`, `--ci-format github|text`, codes de retour 0, 1, 2 et 3.
- Aide `--help` entièrement en français ; affichage terminal par page, `--no-color` et repli ASCII.
- `--out` n'a plus de valeur par défaut : le nom dépend du format (`rapport.<format>`).

### Documentation, site et outillage

- README complet, `npm run demo:serve` pour un premier rapport sur les pages de démonstration, modèles GitHub Actions et GitLab CI dans `docs/ci/`.
- Site statique (accueil, fonctionnalités, démo, tarifs, documentation, FAQ, mentions) avec rapport d'exemple généré par `npm run build:demo`.
- Étude de marché, backlog, dossier de prospection et séquences de messages.
- Intégration continue GitHub Actions : tests avec seuil de couverture à 85 %, audit des dépendances, génération du rapport d'exemple ; `npm run check:dod` produit les preuves de définition de terminé.
- Paquet npm 1.0.0 sous licence propriétaire.
