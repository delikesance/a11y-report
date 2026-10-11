# Étude de marché : positionnement de a11y-reports

Date des relevés : 2026-10-11. Chaque prix ou fait renvoie à `docs/sources.md` (URL et date de consultation). « Non public » = aucun prix ni information sur les pages consultées. « Non documenté » = la page consultée ne dit pas. Les sections 5 et 6 sont des **recommandations**, pas des données de marché.

Sources de référence : `docs/market/concurrents-fr.md`, `docs/market/concurrents-int.md`, `docs/market/reglementation.md`.

## 1. Tableau comparatif

| Outil | Type | Prix public | Rapport PDF FR ? | RGAA ? | Forces | Faiblesses | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **a11y-reports** (ce dépôt) | CLI Node 22, local | Non fixé (voir section 6) | Oui : PDF A4 en français, marque blanche (`--agency`, `--logo`, `--color`) | Partiel : chaque règle porte sa référence RGAA ; pas de pourcentage de conformité RGAA (REP-01 au backlog) | Local (Playwright + axe-core embarqués) ; devis par phase chiffré (`--taux`) ; branding par fichier | Résolus depuis : PDF balisé (PDF-01), TVA et TTC (QUO-01), erreurs HTTP signalées (SCAN-01), fiches pour les règles (RULE-01) | `README.md`, `docs/baseline.md` (sections 1, 3, 5) |
| axe-core (`@axe-core/cli`, Playwright, Puppeteer) | Bibliothèque open source | Gratuit | Non documenté (reporter `reporter-earl` cité) | Non : règles WCAG, pas de référentiel RGAA | Moteur de référence ; MPL-2.0 ; 726 étoiles | Sortie technique, pas de livrable client ; couverture automatique partielle | https://github.com/dequelabs/axe-core-npm |
| Pa11y (CLI, Dashboard, Webservice, Pa11y CI) | Outils open source | Gratuit | Non : Dashboard en graphes, Webservice en JSON | Non documenté | Suivi quotidien et graphes d'évolution (Dashboard) | Pas de moteur de conformité RGAA ; site sous CC-BY-NC 4.0 (licence des outils à vérifier) | https://www.pa11y.org/ |
| Lighthouse CI | Outil open source (CI) | Gratuit | Non : rapport dans la pull request | Non (score Lighthouse) | Budgets, suivi entre commits, Apache-2.0 | Pas de rapport client ni de référentiel RGAA | https://github.com/GoogleChrome/lighthouse-ci |
| WAVE API (WebAIM) | API payante à l'usage | 100 crédits gratuits ; 0,04 $ à 0,025 $ par crédit selon volume | Non : sortie JSON ou XML | Non documenté | Tarification à l'usage ; sortie JSON | Pas de rapport PDF ; paramètres détaillés dans une spécification non consultée | https://wave.webaim.org/api/ |
| accessiBe | SaaS (widget et monitoring) | Accessibility Pro 490 $/an (Small), 1 490 $/an (Medium) ; monitoring 100 pages 990 $/an, 500 pages 4 490 $/an | Non documenté ; audits et VPAT « sur devis » | Non documenté | Prix d'entrée public | Audits et VPAT sur devis (« Talk to us ») | https://www.accessibe.com/pricing |
| Deque axe (Monitor, Auditor, DevTools) | Éditeur (américain) | Non public | Non détaillé | Non documenté | Référence du moteur axe ; essai DevTools 14 jours | Tarifs non publics ; pas de prestation d'audit décrite | https://www.deque.com/axe/ |
| Siteimprove | SaaS | Non public (« Request a demo ») | Non détaillé | Non documenté | Audits gratuits (PDF checker) | Pas de grille tarifaire | https://www.siteimprove.com/pricing/ |
| AudioEye | SaaS | Non public | Non détaillé | Non documenté | Trois formules | Prix non publics | https://www.audioeye.com/pricing/ |
| Asqatasun | Logiciel libre | Aucun prix affiché | Non décrit | Non décrit sur la page | Open source, automatisation, intégrable en CI | Page sans RGAA ni livrables ; version non indiquée ; ancien support commercial Tanaguru disparu (faillite 2014, historique affiché) | https://asqatasun.org/ |
| Temesis | Cabinet | Non public (devis) | Non précisé | Oui : offre RGAA affichée | Formation certifiée Qualiopi | Livrables non précisés | https://www.temesis.com/ |
| Atalan | Cabinet | Non public (devis gratuits) | Non précisé | RGAA non cité sur l'accueil | Audit « des premières maquettes à la recette des correctifs » | Livrables non décrits | https://www.atalan.fr/ |
| Access42 | Cabinet / formation | Non public (devis après qualification, source tierce) | Non précisé | Non documenté | Programme de formation décrit | Prix non publics | https://sk-web.fr/article/prix-audit-rgaa-2026 |
| SK Web | Prestataire | À partir de 2 100 € HT, sur devis | Non précisé | Audit RGAA | Prix d'entrée public | Fourchettes par type de site non sourcées par l'éditeur | https://sk-web.fr/article/prix-audit-rgaa-2026 |
| DINUM (référence) | Cadre de prix public | Audit RGAA 2 000 à 5 000 € HT selon complexité | Non applicable | Oui (référentiel) | Prix de référence officiel | Audit humain, pas un outil | https://design.numerique.gouv.fr/accessibilite-numerique/prestations-accessibilite-numerique/ |
| Opquast | Formation / certification | 485 € HT (certification en ligne) ; 2 490 € HT (Référent) ; 3 490 € HT (Expert, Formateur) | Non applicable | Non | Grille publique complète | Formation qualité, pas un outil d'audit | https://www.opquast.com/fr/formations/ |

Lecture du tableau : les prix publics existent surtout chez accessiBe, WAVE API et les outils libres. Les cabinets et la plupart des SaaS ne publient pas de grille. Aucun outil consulté ne documente un rapport PDF en français au format RGAA (`docs/market/concurrents-int.md`, points à retenir). Ce constat est à confirmer par un test produit, car les pages consultées ne décrivent pas toutes leurs livrables.

Couverture : Ocular, Eqtl, Accessiweb (domaines injoignables), Koena (503), Level Access, Evinced, Silktide, Monsido, Accessibility Insights, IBM Equal Access, UserWay (grille non extraite) ne sont pas comparés. Aucun avis utilisateur (G2, Capterra, Trustpilot) n'a été relevé.

## 2. Positionnement

a11y-reports est un **outil en ligne de commande** qui audite une liste d'URLs en local et produit un **rapport PDF en français** aux couleurs et au nom d'une agence, avec un **devis chiffré par phase** issu du même audit.

Ce que l'outil fait, d'après le code et la documentation :

- audit automatique axe-core (WCAG 2.0, 2.1, 2.2 A et AA, bonnes pratiques), exécuté dans un Chromium local ;
- rapport HTML autonome puis PDF A4, polices embarquées, pied de page numéroté ;
- marque blanche : seule l'agence est nommée dans le PDF (`agency`, `logoPath`, `primaryColor`) ;
- devis par phase (bloquants, gênants, finitions) avec prix HT si `--taux` est fourni ;
- sauvegarde et rechargement du scan en JSON (`--save-json`, `--from-json`) ;
- limites de l'audit automatique écrites dans le README et, à traiter, dans le rapport.

Écarts relevés dans `docs/baseline.md` au départ, résolus dans la version 1.0.0 : PDF balisé, score par page, estimation partielle RGAA, TVA et TTC, résultats « incomplete », options de concurrence, de viewport, de crawl et de mode CI.

Positionnement retenu : **un générateur de livrable client pour agences, pas une plateforme de suivi ni une prestation d'audit humain**. Il se place entre le moteur open source (axe, gratuit mais sans livrable) et l'audit humain (2 000 € HT et plus, section 3 du tableau). Il ne se présente pas comme une certification de conformité RGAA, comme le précise le README.

Confidentialité : l'audit tourne sur le poste de l'agence (Playwright et axe-core locaux, polices embarquées). Aucun service tiers n'est appelé par le code décrit dans `docs/baseline.md`. Ce point reste à vérifier sur le code complet avant toute promesse commerciale.

## 3. Personas

**Freelance (1 personne)**
- Besoin : un rapport propre pour un client de petit site, en quelques minutes, sans logiciel d'abonnement.
- Ce qui compte : le prix par rapport, la marque blanche, le devis prêt à envoyer.
- Risque : un PDF non balisé et une couverture automatique partielle sont visibles s'il doit répondre à un appel d'offres public.

**Studio (5 à 15 personnes)**
- Besoin : des rapports réguliers pour plusieurs clients, une cohérence de livrable entre les chefs de projet, un devis chiffré à partir du même audit.
- Ce qui compte : la répétabilité en CLI, le fichier de branding partagé, le format JSON pour archiver les scans.
- Risque : l'absence de mode CI, de concurrence et de suivi dans le temps oblige à des scripts maison.

**Agence (30 personnes et plus)**
- Besoin : des livrables homogènes, une traçabilité des sources juridiques et techniques, une intégration dans les chaînes de test et de livraison.
- Ce qui compte : sources citées pour chaque règle (CRED-01), déclaration d'accessibilité, mode CI, PDF conforme (PDF/UA vérifié par veraPDF).
- Risque : sans PDF balisé ni mode CI, l'outil ne couvre pas leurs exigences avant les étapes 5 et 6 du backlog.

## 4. Objections et réponses

| Objection | Réponse fondée sur les faits |
| --- | --- |
| « Un audit automatique ne trouve qu'un tiers des problèmes. » | Exact, et le rapport le dit : le README et le rapport affichent cette limite. L'outil ne prétend pas remplacer un test avec lecteur d'écran. Un test manuel guidé est un écart à combler (MKT-02). |
| « axe-core est gratuit. » | Oui, axe-core est gratuit et sert de base à l'outil. Il ne produit pas de rapport client, de devis ni de marque blanche. |
| « Deque, Siteimprove et accessiBe ont des plateformes complètes. » | Leurs prix ne sont pas publics ou ne sont publics que pour un widget. L'outil est un CLI local, sans abonnement ni données envoyées à un tiers (à confirmer, section 2). |
| « Vos rapports ne sont pas accessibles. » | Résolu (PDF-01) : le PDF est balisé et passe veraPDF. Vérifier chaque rapport livré avec `npm run verify:pdf`. |
| « Le RGAA n'est pas pris en compte. » | Chaque règle affiche sa référence RGAA ; le pourcentage RGAA n'existe pas encore (REP-01, étape 4). Présenter le rapport comme indicatif. |
| « Les prix publics sont plus bas chez accessiBe. » | Leurs prix sont en dollars, pour un widget ou une surveillance de pages, pas pour un audit client en français. Comparer par livrable, pas par ligne de prix. |
| « Qui garantit les sources juridiques ? » | Les références sont sourcées dans `docs/sources.md` avec URL et date de consultation. Les points non vérifiés sont marqués « à vérifier juridiquement ». |

## 5. Argument réglementaire

Source : `docs/market/reglementation.md`. Chaque point est à **vérifier juridiquement** avant usage commercial.

- Référentiel : RGAA 4.1.2 en vigueur ; RGAA 5 annoncé pour fin 2026, non publié (à vérifier juridiquement).
- Déclaration d'accessibilité : à publier et à mettre à jour après refonte, 3 ans après publication, et 18 mois après une nouvelle version du RGAA (à vérifier juridiquement). L'outil ne la produit pas encore (MKT-01).
- Sanctions : l'article 47-1 de la loi 2005-102 (ordonnance 2023-859, en vigueur depuis le 8 septembre 2023) prévoit un plafond de 50 000 EUR pour l'obligation d'accessibilité et de 25 000 EUR pour les obligations déclaratives (à vérifier juridiquement). Le montant réellement prononcé est non public.
- Directive (UE) 2019/882 : application depuis le 28 juin 2025 ; période transitoire jusqu'au 28 juin 2030 (à vérifier juridiquement) ; microentreprises exonérées (art. 4 § 5).
- Décret 2026-816 du 24 août 2026 : publié au JORF du 26 août 2026 ; son entrée en vigueur « le lendemain » est une déduction (à vérifier juridiquement).
- Périmètre privé : `reglementation.md` évoque un seuil de chiffre d'affaires de 250 M EUR, à vérifier juridiquement ; ne pas l'utiliser comme argument de vente sans confirmation.

Usage possible dans l'argumentaire : « une déclaration d'accessibilité et un audit documenté sont demandés à votre site ; notre rapport fournit la base technique, à compléter par un test manuel ». Ne pas écrire que le client est « en infraction » ni qu'il risque une amende précise.

## 6. Grille de prix recommandée

**Recommandation, non une donnée de marché.** Les ancrages sont tous cités ; le calcul est indiqué.

Ancrages :
- audit humain RGAA : 2 000 à 5 000 € HT (DINUM), à partir de 2 100 € HT (SK Web) ;
- surveillance SaaS : 990 $/an pour 100 pages, 4 490 $/an pour 500 pages (accessiBe, monitoring) ;
- coût d'un crédit d'analyse automatique : 0,025 à 0,04 $ (WAVE API), donc un coût marginal faible ;
- outils libres : gratuit.

| Persona | Offre proposée | Prix HT recommandé | Justification |
| --- | --- | --- | --- |
| Freelance | Rapport à l'unité, jusqu'à 10 pages | 100 € par rapport | Environ 5 % du plancher de l'audit humain (2 000 €). Reste au-dessus du coût marginal d'un crédit WAVE, sans le comparer à un audit humain. |
| Studio 5 à 15 | Licence annuelle, rapports illimités, une marque | 600 € par an | Sous le monitoring accessiBe à 100 pages (990 $/an, devise différente). Sert à amortir le temps d'intégration CLI. |
| Agence 30 et plus | Licence annuelle, plusieurs marques, support | 1 800 € par an | Sous le plancher d'un audit humain (2 100 € HT SK Web) pour un an d'usage. Proche du monitoring accessiBe à 500 pages en dollars, sans suivi ; à revoir si le suivi entre audits est livré. |

Points à valider avant publication :
- la licence du logiciel n'est pas définie dans le dépôt (le champ `license` n'a pas été relevé) : le modèle de vente en dépend ;
- les prix ci-dessus sont HT ; la TVA est gérée dans le devis du rapport (QUO-01 résolu) ;
- PDF-01 résolu : le PDF balisé lève la condition posée à la vente à l'agence 30 et plus.

## 7. Sources

Voir `docs/sources.md`, lignes des concurrents (Deque, Siteimprove, accessiBe, AudioEye, WAVE, Asqatasun, Temesis, Atalan, Access42, DINUM, SK Web, Opquast), de la réglementation (Légifrance, EUR-Lex, DINUM) et des outils libres (axe-core, Pa11y, Lighthouse CI).
