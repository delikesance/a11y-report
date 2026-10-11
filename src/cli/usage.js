export const USAGE = `Usage : a11y-report <url...> --client "X" --agency "Y" [options]
       a11y-report --from-json scan.json --client "X" --agency "Y" [options]

Rapport :
  --client "X"          nom du client (requis sauf via --branding)
  --agency "Y"          nom de l'agence (requis sauf via --branding)
  --logo f.png          logo de l'agence
  --color #rrggbb       couleur principale du rapport
  --contact "..."       coordonnées affichées dans le rapport
  --taux 550            TJM en euros HT pour chiffrer le devis (défaut 550)
  --telephone "..."     téléphone affiché dans le devis
  --validite 30         validité du devis en jours (défaut : 30)
  --branding b.json     charge le branding depuis un JSON (les options passées l'emportent)

Sorties :
  --format LISTE        pdf, json, html, csv ou sarif ; répétable ou séparé par des virgules (défaut : pdf)
  --out CHEMIN          fichier (un seul format) ou dossier (plusieurs formats ou se terminant par /)
  --from-json s.json    recharge un scan sauvegardé au lieu de scanner les URLs
  --save-json s.json    sauvegarde le scan au format JSON

Audit :
  --concurrency N       pages auditées en parallèle, de 1 à 16 (défaut : 1)
  --viewport V          mobile, tablet, desktop ou LARGEURxHAUTEUR (ex. 375x812) ; répétable (défaut : desktop)

Exploration (--crawl) :
  --crawl               explore le site à partir de chaque URL donnée (même origine)
  --crawl-depth N       profondeur maximale des liens, de 0 à 10 (défaut : 2)
  --max-pages N         nombre maximal de pages découvertes, de 1 à 1000 (défaut : 50)
  --sitemap             lit le sitemap.xml du site (défaut)
  --no-sitemap          ignore le sitemap.xml
  --exclude MOTIF       exclut les URLs correspondant au motif glob ; répétable
  --delay MS            pause entre deux requêtes d'exploration, en millisecondes (défaut : 250)

Intégration continue (--ci) :
  --ci                  mode non interactif : sortie réduite, code de retour selon les seuils
  --seuil "critical=0,serious=0"   seuils (critical, serious, moderate, minor, score, unaudited)
  --seuils-fichier s.json          seuils lus dans un fichier JSON (--seuil l'emporte)
  --ci-format github|text          format des résultats de seuils (défaut : text)

Divers :
  -h, --help            affiche cette aide

Exemples :
  a11y-report https://exemple.fr --client "Exemple SAS" --agency "Mon Agence"
  a11y-report https://exemple.fr --format json,html --out ./rapports --client "Exemple" --agency "Agence"
  a11y-report https://exemple.fr --crawl --crawl-depth 1 --max-pages 20 --concurrency 4 --client "X" --agency "Y"
  a11y-report https://exemple.fr --viewport mobile --viewport 1280x800 --client "X" --agency "Y"
  a11y-report https://exemple.fr --ci --seuil "critical=0,serious=0" --ci-format github --format json --client "X" --agency "Y"

Codes de retour :
  0  succès (ou seuils respectés avec --ci)
  1  erreur d'utilisation ou d'exécution
  2  seuils CI non respectés (--ci)
  3  page non auditée alors que les seuils l'interdisent (--ci)
`;
