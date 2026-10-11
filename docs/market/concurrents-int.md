# Concurrents internationaux : outils d'accessibilité web

Date des relevés : 2026-10-11. Chaque fait renvoie à une page effectivement consultée (voir `docs/sources.md`). « non public » = prix ou information absents des pages consultées.

Couverture : étude partielle. Pages non consultées faute de temps : Deque axe Monitor (page dédiée en 404 lors du test), Level Access, Evinced, Silktide, Monsido, Accessibility Insights, IBM Equal Access, accessibility-checker, Sa11y, UserWay (features détaillées), Tenon (redirection vers Level Access non suivie). Ces lignes restent à compléter.

## Open source

| Outil | Licence | Fonctionnalités relevées | Sortie / rapport | Prix | Source |
|---|---|---|---|---|---|
| axe-core (CLI `@axe-core/cli`, intégrations Playwright, Puppeteer, React, WebdriverIO) | MPL-2.0 ; 726 étoiles (relevé 2026-10-11) | Moteur de règles, paquets pour CLI et frameworks de test ; principe affiché : taux de faux positifs nul | Non détaillée sur la page ; seul reporter nommé : `reporter-earl` | Gratuit | https://github.com/dequelabs/axe-core-npm |
| Pa11y (CLI, Dashboard, Webservice, Pa11y CI) | « free and open source » ; site sous CC-BY-NC 4.0 (licence des outils à vérifier sur leurs dépôts) | CLI pour test ponctuel, Dashboard avec tests quotidiens et graphes d'évolution, Pa11y CI pour l'intégration continue | Dashboard en graphes ; Webservice en JSON | Gratuit | https://www.pa11y.org/ |
| Lighthouse CI | Apache-2.0 ; 7,1 k étoiles (relevé 2026-10-11) | Lighthouse à chaque commit, rapport dans chaque pull request, budgets de performance, suivi dans le temps, comparaison entre versions | Rapport dans la PR, tableau de bord serveur, vue de diff (captures de la page) | Gratuit | https://github.com/GoogleChrome/lighthouse-ci |

Forces : gratuité, intégration CI. Faiblesses : pas de moteur de conformité RGAA ; couverture limitée aux règles automatisables (axe et Lighthouse) ; Pa11y Dashboard présenté comme destiné aux non-développeurs mais sans interface de reporting juridique.

## SaaS et services

| Outil | Fonctionnalités relevées | Sortie / rapport | Prix public | Forces / faiblesses | Source |
|---|---|---|---|---|---|
| Deque axe (Monitor, Auditor, DevTools) | Monitor : suivi de conformité à l'échelle du site ; Auditor : tests manuels guidés ; DevTools : extension navigateur, essai 14 jours, « jusqu'à 80 % des problèmes » web et mobile | Non détaillée | non public (page produits) | Forces : référence du moteur axe. Faiblesse : tarifs non publics | https://www.deque.com/axe/ |
| Siteimprove (accessibilité) | Plateforme d'accessibilité ; audits gratuits (PDF checker, Digital Insights Report) | Non détaillée | non public (« Request a demo ») | Faiblesse : pas de grille tarifaire publique | https://www.siteimprove.com/pricing/ |
| accessiBe | Widget Accessibility Pro, plans Advanced Widget, monitoring par nombre de pages, audits et VPAT sur devis | Non détaillée | Widget : Small 490 $/an (jusqu'à 100 k pages vues/mois), Medium 1 490 $/an (jusqu'à 1 M), Large non public. Advanced : Pro 490 $/an, Pro Plus 1 190 $/an, Ultimate 2 490 $/an. Monitoring : 100 pages 990 $/an, 500 pages 4 490 $/an, 1 500 pages 10 990 $/an | Forces : prix d'entrée publics. Faiblesse : audits et VPAT « Talk to us » | https://www.accessibe.com/pricing |
| UserWay | Plans annuels publics (page pricing consultée) | Non détaillée | Voir section accessiBe : page UserWay consultée, grille non extraite (à reprendre) | Lacune : tarifs à compléter | https://userway.org/pricing/ |
| AudioEye | Trois formules : Basic Protection (automatisée), Self-Serviced Protection, Maximum Protection (managée) | Non détaillée | non public (« Get Started », « Talk to an Expert ») ; calculateur de coût affichant un exemple à 269 725 $/an, non une grille | Faiblesse : prix non publics | https://www.audioeye.com/pricing/ |
| WAVE API (WebAIM) | Analyse après application CSS/JS, accès par GET avec clé API, XPath dans les détails, version autonome sous licence séparée | JSON ou XML | Crédits : 100 crédits gratuits à l'inscription ; 1 crédit par page de base, 2 ou 3 pour fonctions avancées ; 250-999 crédits à 0,04 $ (achat minimum 250 crédits, 10 $) ; 1 000-9 999 à 0,03 $ ; 10 000+ à 0,025 $ | Forces : tarification à l'usage, sortie JSON. Faiblesse : paramètres détaillés renvoyés à une spécification séparée non consultée | https://wave.webaim.org/api/ |

Tenon : la page tarifs redirige vers une FAQ de fin de service chez Level Access (https://www.levelaccess.com/tenon-retiring-faqs/), non consultée ; statut à vérifier.

## Avis utilisateurs (G2, Capterra, Trustpilot)

Non relevés dans cette passe : aucune page d'avis n'a été consultée. À compléter avant toute conclusion sur la satisfaction des utilisateurs.

## Points à retenir pour notre positionnement

- Les tarifs publics existent surtout chez accessiBe, WAVE API et les outils open source ; la majorité des éditeurs SaaS (Deque, Siteimprove, AudioEye) ne publient pas de grille.
- Aucun des outils consultés ne documente précisément un export PDF au format RGAA ; à vérifier avant d'affirmer un écart.
- Pour la comparaison, les moteurs open source (axe, Lighthouse) sont la base technique de plusieurs offres payantes.
