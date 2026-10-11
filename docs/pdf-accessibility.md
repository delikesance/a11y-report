# Accessibilité du PDF produit

## Ce qui est en place

- `renderPdf` (`src/report.js`) active `tagged: true` et `outline: true` : le PDF contient une structure balisée (`/MarkInfo /Marked true`, `/StructTreeRoot`), la langue `fr` (`/Lang (fr)`) et des signets.
- Le HTML est sémantique : `<html lang="fr">`, un `<title>`, titres ordonnés, tableaux avec `th`, listes.
- `<strong>` remplacé par `<span class="strong">` : Chromium balise `<strong>` en type non standard `Strong`, refusé par PDF/UA.
- La liste des phases du devis n'est plus une liste HTML (`<ol>`/`<li>` contenant titres et paragraphes) : elle est rendue en `<div>`.
- Vérification : `npm run verify:pdf -- <fichiers.pdf>` (voir `scripts/verify-pdf.js`), via l'image Docker `verapdf/cli:latest` (veraPDF 1.30.3), profil `ua1`. Code de sortie non nul si un PDF n'est pas conforme.

## Résultat sur les rapports de contrôle

Rapports générés depuis les fixtures (`faulty`, `healthy`, `mixed`) : veraPDF (ua1) rapporte 0 règle en échec sur les trois.

- Pas de pied de page ni de numérotation en marges CSS `@page` : Chromium les écrit hors structure et ne les marque pas en artefact.
- `src/pdf-accessibility.js` post-traite le PDF en mise à jour incrémentale, sans dépendance : flux XMP (`dc:title`, `dc:language`, `pdfuaid:part=1`) rattaché au catalogue, et fonds, filets et bordures (tracés hors contenu balisé) marqués `/Artifact`.
- `Strong` et `LI` contenant des titres restent évités (voir ci-dessus).
- Le test veraPDF de `npm test` est bloquant ; il est ignoré (`skip`) si docker est absent.
- Il ne couvre que le rapport de contrôle ; la conformité réelle d'un rapport client doit être vérifiée avec `npm run verify:pdf`.
