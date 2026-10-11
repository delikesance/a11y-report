# Accessibilité du PDF produit

## Ce qui est en place

- `renderPdf` (`src/report.js`) active `tagged: true` et `outline: true` : le PDF contient une structure balisée (`/MarkInfo /Marked true`, `/StructTreeRoot`), la langue `fr` (`/Lang (fr)`) et des signets.
- Le HTML est sémantique : `<html lang="fr">`, un `<title>`, titres ordonnés, tableaux avec `th`, listes.
- `<strong>` remplacé par `<span class="strong">` : Chromium balise `<strong>` en type non standard `Strong`, refusé par PDF/UA.
- La liste des phases du devis n'est plus une liste HTML (`<ol>`/`<li>` contenant titres et paragraphes) : elle est rendue en `<div>`.
- Vérification : `npm run verify:pdf -- <fichiers.pdf>` (voir `scripts/verify-pdf.js`), via l'image Docker `verapdf/cli:latest` (veraPDF 1.30.3), profil `ua1`. Code de sortie non nul si un PDF n'est pas conforme.

## Résultat sur les rapports de contrôle

Rapports générés depuis les fixtures dans `out/verify/` (`faulty.pdf`, `healthy.pdf`, `mixed.pdf`, non versionnés).

Avant corrections : 4 règles en échec. Après corrections : 3 familles d'erreurs restent.

| Règle veraPDF (ISO 14289-1) | Échecs | Cause | Statut |
| --- | --- | --- | --- |
| 7.1 n°3 : contenu ni marqué artefact ni balisé | ~900 contrôles (300 messages affichés par veraPDF) | Numéros de page et pied de page `@bottom-left` / `@bottom-right` (marges CSS `@page`) : Chromium les écrit hors structure. Sans pied de page, il reste environ 36 échecs sur `mixed.pdf`. | Non corrigé (voir ci-dessous) |
| 7.1 n°8 : métadonnées XMP absentes | 3 (un par PDF) | Chromium n'écrit pas de flux XMP dans le catalogue. | Non corrigé |
| 7.1 n°5 : types de structure non standard | 0 (corrigé) | `Strong` remplacé par `span` | Corrigé |
| 7.2 n°20 : LI contenant H3/P | 0 (corrigé) | Liste de phases convertie en `div` | Corrigé |

## Limites restantes (non résolues)

- **Pied de page en marges CSS.** Chromium (Playwright `page.pdf`) n'expose pas de contrôle de balisage sur les boîtes de marge `@page`. Options non retenues à ce stade : un pied de page `position: fixed` perd la numérotation `counter(page)` ; `displayHeaderFooter` produit du contenu non balisé de la même façon. Piste : générer le pied de page dans le flux de chaque page, ou post-traiter le PDF pour le marquer en artefact.
- **Métadonnées XMP.** Sans post-traitement du PDF (pas de dépendance ajoutée à ce stade), le catalogue n'a pas de `/Metadata`. Piste : écrire un flux XMP (titre, langue, `pdfuaid:part=1`) en mise à jour incrémentale.
- **Conséquence pour `npm test`.** Le test veraPDF est déclaré `todo` (exécuté, échec signalé, sans bloquer la suite) tant que ces deux points ne sont pas traités. Il est ignoré (`skip`) si docker est absent.
- Le test ne couvre que les trois rapports de contrôle ; la conformité réelle d'un rapport client doit être vérifiée avec `npm run verify:pdf`.
