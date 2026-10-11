# Design : identité et règles

Ce document décrit les jetons de design du projet (`design/tokens.json`), les marques de démonstration (`design/brandings/`) et les règles de contraste qui les encadrent. Il ne contient pas encore de code visuel.

## Jetons

`design/tokens.json` est la source unique des valeurs :

- **Couleurs neutres** : encre, texte atténué, papier, surface et bordure du rapport.
- **Couleurs des marques** : une couleur principale, une couleur d'accent et une couleur de texte posée sur la principale, pour chacune des trois agences de démonstration.
- **Typographie** : IBM Plex Sans (texte courant et interface), Source Serif 4 (titres et citations), IBM Plex Mono (codes et chiffres). Les trois familles sont fournies par `@fontsource`, sans appel réseau.
- **Échelle typographique**, graisses, **espacements** (multiples de 0,25 rem) et **rayons**.

## Trois identités de démonstration

| Marque | Caractère | Principale | Accent |
| --- | --- | --- | --- |
| `agence-sobre` | Institutionnelle, sérieuse | `#1e3a5f` (bleu marine) | `#b45309` (ambre foncé) |
| `agence-vive` | Dynamique, colorée | `#7c3aed` (violet) | `#c2410c` (orangé) |
| `agence-sombre` | Éditoriale, contrastée | `#18181b` (quasi noir) | `#92400e` (ocre) |

Chaque marque se charge comme un branding ordinaire : `node src/cli.js --branding design/brandings/agence-vive.json ...`.

## Règles de contraste

Toute paire texte/fond déclarée dans `tokens.json` (section `contrast.pairs`) est calculée selon la luminance relative WCAG 2.x (`design/contrast.js`) :

- texte courant : au moins **4,5:1** (critère AA) ;
- grand texte ou composant d'interface (bordure, icône, contour de champ) : au moins **3:1**.

Le test `test/design-tokens.test.js` échoue si une paire passe sous son seuil. Une couleur de marque ne peut donc être utilisée comme texte que si elle atteint 4,5:1 sur le papier (`#ffffff`) ; sinon elle reste réservée aux aplats, avec un texte `onPrimary` vérifié.

Les fichiers de branding reprennent exactement les couleurs de `tokens.json` ; le test vérifie cette égalité.

## Rapport HTML

`src/formats/html.js` génère le CSS depuis `tokens.json` (`html-tokens.js`) : variables `:root`, thème sombre via `prefers-color-scheme` et `data-theme`, styles d'impression. Les tableaux sont dans un conteneur défilant focusable (`.table-wrap`) pour rester lisibles à 360 px. Lien d'évitement vers `#contenu`, contours de focus visibles.

- Captures avant/après : `design/captures/before/` et `design/captures/after/` (360, 768, 1280 px). Aucun débordement horizontal mesuré.
- Audit par le produit lui-même (`node src/cli.js` sur le rapport servi en HTTP local) : 0 violation, 39 règles passées.
- Les polices ne sont pas embarquées dans le HTML (rapport autonome, pile de secours système).

## Ajouter une marque ou une couleur

1. Ajouter la couleur dans `tokens.json` (section `color`).
2. Déclarer ses paires dans `contrast.pairs`, avec le bon `kind`.
3. Créer le fichier `design/brandings/<nom>.json` avec les mêmes valeurs.
4. Lancer `npm test`.
