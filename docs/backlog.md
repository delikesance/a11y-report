# Backlog a11y-reports

Source : `docs/baseline.md` (sections 3 et 5) et écarts par rapport à la cible. Priorités : P0 bloquant, P1 important, P2 souhaitable, P3 ultérieur. Étape : numéro de l'étape de livraison (1 à 7), voir la fin du document.

## Bloquants (P0)

| ID | Priorité | Étape | Élément | Critère d'acceptation |
| --- | --- | --- | --- | --- |
| SCAN-01 | P0 | 1 | Signaler les erreurs HTTP par page : lire le statut de `page.goto` dans `src/scan.js`. | Une page répondant 404 ou 500 porte un champ `error` explicite (ex. `HTTP 404`) dans le scan et le rapport, sans être présentée comme saine. Test unitaire couvrant 200, 404 et 500. |
| SCAN-02 | P0 | 1 | Conserver les nœuds « incomplete » d'axe-core (et non seulement leur compte). | Chaque page expose `incomplete: Violation[]` avec nœuds (`html`, `target`, `failureSummary`). Le rapport liste ces points à vérifier manuellement. Le compte reste disponible. |
| RULE-01 | P0 | 2 | Couvrir les 105 règles axe-core de `src/rules-fr.js` (59 couvertes, 46 en texte générique). | Un test compare `getRules()` d'axe-core 4.13.0 aux clés de `RULES` et échoue si une règle manque. Aucune règle ne retombe sur le texte générique. |
| CRED-01 | P0 | 3 | Rendre la citation crédible : chaque affirmation chiffrée ou juridique (RGAA, WCAG, minutes par occurrence) est sourcée. | Chaque règle citée dans `docs/sources.md` a une URL officielle et une date de consultation. Aucune référence RGAA ou WCAG sans source. |
| REP-01 | P0 | 4 | Rapport professionnel : score par page, méthodologie du score, pourcentage indicatif RGAA. | La couverture et chaque page affichent leur score. Une section méthodologie explique le calcul (pénalités par impact) et ses limites. Le pourcentage RGAA est présenté comme indicatif. Tests sur `model.js`. |
| PDF-01 | P0 | 5 | PDF balisé (accessible) : tags, langue du document, titres de signets, texte alternatif des images. | Le PDF produit par `renderPdf` contient les tags structurels et la langue `fr`. Un contrôle veraPDF (profil PDF/UA) passe sans erreur bloquante sur le rapport de référence. |
| PDF-02 | P0 | 5 | Intégrer une vérification veraPDF dans la chaîne de test. | Un script `npm run verify:pdf` lance veraPDF sur un PDF généré et échoue sur toute erreur de conformité. Le script est documenté dans le README. |

## Interface en ligne de commande (P1)

| ID | Priorité | Étape | Élément | Critère d'acceptation |
| --- | --- | --- | --- | --- |
| CLI-01 | P1 | 6 | `--format pdf\|json\|html\|csv\|sarif` (défaut `pdf`). | Chaque format produit un fichier valide ; `json` équivaut à `--save-json`, `sarif` respecte le schéma SARIF 2.1.0. Option inconnue : `Erreur : ...`, code 1. |
| CLI-02 | P1 | 6 | `--concurrency N` pour le nombre de pages auditées en parallèle. | Par défaut 1. Pour N=4 sur 8 URLs, le temps total baisse sans changer les résultats (même ordre de sortie). Valeur hors bornes : erreur, code 1. |
| CLI-03 | P1 | 6 | `--viewport LxH` (ex. `375x812`). | Le scan utilise la taille donnée ; le rapport indique le viewport utilisé. Format invalide : erreur, code 1. |
| CLI-04 | P1 | 6 | `--crawl N` pour découvrir des pages depuis l'URL d'origine, limité au même domaine. | Au plus N pages, même domaine, sans doublon. Test sur un site de fixtures local. |
| CLI-05 | P1 | 6 | `--ci` : sortie sans progression interactive, code de sortie non nul si des violations `critical` ou `serious` existent. | En mode `--ci`, stdout ne contient que le résumé. Code 2 si seuil dépassé, 0 sinon, 1 pour erreur d'usage. |
| CLI-06 | P1 | 6 | Couvrir `src/cli.js` lignes 108-145 (couverture actuelle 75,68 %). | Couverture de `cli.js` au moins 90 % en lignes. |

## Qualité du devis et du rapport (P1)

| ID | Priorité | Étape | Élément | Critère d'acceptation |
| --- | --- | --- | --- | --- |
| QUO-01 | P1 | 4 | Devis avec TVA : ligne de TVA et total TTC, option `--tva` (défaut 20 %). | Sans `--taux`, rien ne change. Avec `--taux`, le devis affiche HT, TVA et TTC, et TTC = HT × (1 + TVA). |
| SHR-01 | P1 | 2 | Corriger la couverture de `src/report/shared.js` (76,92 % branches, lignes 37, 41-45). | Couverture de `shared.js` au moins 95 % en lignes et branches. |

## Design (P2)

| ID | Priorité | Étape | Élément | Critère d'acceptation |
| --- | --- | --- | --- | --- |
| DES-01 | P2 | 7 | Identité visuelle du rapport (couleurs, typographie, pied de page) alignée sur les tokens de l'agence. | Les couleurs viennent de `primaryColor` et `accentColor` ; contraste du texte sur fond au moins 4,5:1 ; rendu vérifié en PDF. |
| DES-02 | P2 | 7 | Mise en page A4 et pagination revues sur les sections détails et devis. | Aucune section coupée au milieu d'un tableau sur le PDF de référence. |

## Site web (P2)

| ID | Priorité | Étape | Élément | Critère d'acceptation |
| --- | --- | --- | --- | --- |
| WEB-01 | P2 | 7 | Page de présentation de l'outil : objet, options, exemple de rapport. | Page publique accessible, texte en français, validée par un audit a11y-reports sans erreur `critical`. |
| WEB-02 | P3 | 7 | Formulaire de demande de rapport. | Données envoyées au seul destinataire déclaré ; mentions RGPD présentes. |

## Démarchage (P3)

| ID | Priorité | Étape | Élément | Critère d'acceptation |
| --- | --- | --- | --- | --- |
| OUT-01 | P3 | 7 | Modèle d'e-mail de prospection à partir d'un rapport d'exemple. | Modèle relu, sans promesse de conformité, avec la mention des limites de l'audit automatique. |
| OUT-02 | P3 | 7 | Liste de cibles qualifiées (sites clients potentiels). | Liste tenue hors dépôt ; chaque cible a une source vérifiable. |

## Livraison (P2)

| ID | Priorité | Étape | Élément | Critère d'acceptation |
| --- | --- | --- | --- | --- |
| DEL-01 | P2 | 7 | Procédure de livraison : fichier PDF, scan JSON de référence, note de limites. | Une checklist de livraison existe dans le README ; le PDF livré passe `verify:pdf`. |
| DEL-02 | P3 | 7 | Intégration CI (`--ci`) avec le template de régression. | Un job CI échoue sur une régression `critical` introduite. |

## Étapes de livraison

1. Scan robuste (SCAN-01, SCAN-02).
2. Base de 105 règles (RULE-01, SHR-01).
3. Citation crédible (CRED-01).
4. Rapport professionnel et devis (REP-01, QUO-01).
5. PDF balisé et veraPDF (PDF-01, PDF-02).
6. CLI (CLI-01 à CLI-06).
7. Design, site web, démarchage, livraison (DES, WEB, OUT, DEL).

## Écarts issus du marché

Source : `docs/marche.md` (sections 1 et 4). Aucun de ces points n'est déjà au backlog ci-dessus.

| ID | Priorité | Étape | Élément | Critère d'acceptation |
| --- | --- | --- | --- | --- |
| MKT-01 | P1 | 7 | Modèle de déclaration d'accessibilité pré-rempli (niveau de conformité, contenus non accessibles, contact, mention Défenseur des droits), à compléter par l'agence. | Le PDF ou le HTML généré contient les rubriques de la déclaration listées sur accessibilite.numerique.gouv.fr ; aucune conformité affirmée sans résultat de test manuel. |
| MKT-02 | P1 | 7 | Annexe de tests manuels guidés (clavier, lecteur d'écran) à compléter avant livraison, pour couvrir la limite de l'audit automatique. | Le rapport contient une checklist des critères non testables automatiquement, avec case à cocher et champ de constat ; les critères cochés apparaissent dans la synthèse. |
| MKT-03 | P2 | 3 | Référence RGAA 4.1.2 par critère dans le rapport : critères testés automatiquement, critères non couverts, numéro de critère pour chaque règle. | Chaque règle affichée porte son numéro de critère RGAA (source `docs/sources.md`) ; une section liste les critères sans règle axe correspondante. |
| MKT-04 | P2 | 7 | Comparaison entre deux scans sauvegardés en JSON (nouvelles, corrigées, persistantes). | Avec deux fichiers `--save-json`, le rapport liste les écarts par règle et par page ; test sur deux scans de fixtures. |
| MKT-05 | P2 | 7 | Rapport d'exemple public, anonymisé, pour démonstration commerciale. | Un PDF d'exemple accompagne la documentation ; aucune donnée d'un client réel ; passe `verify:pdf` une fois PDF-01 livré. |
