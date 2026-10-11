# Performance

## Test de charge : 50 pages, `--concurrency 4`

Test : `test/cli-load.test.js`. Le CLI audite 50 pages générées (une image sans `alt` par page)
servies par le serveur de fixtures, avec `--format json --concurrency 4`.

Mesure : tous les 250 ms, somme du RSS de l'arbre de processus issu du CLI (Node, Chromium et
ses processus de rendu), relevée via `ps -eo pid=,ppid=,rss=`. La croissance est le pic moins la
première mesure (le CLI n'a pas encore lancé Chromium à cet instant, donc la base est proche de 0).

| Exécution | Durée | Pic RSS | Croissance | Processus vus | Résiduels après sortie |
| --- | --- | --- | --- | --- | --- |
| 1 | 5,5 s | 1152 Mo | 1152 Mo | 87 | 0 |
| 2 | 5,5 s | 1060 Mo | 1060 Mo | 85 | 0 |
| 3 | 5,5 s | 1154 Mo | 1154 Mo | 87 | 0 |

Hôte : Linux 7.2 (Fedora), 16 cœurs, 31 Go de RAM, Node v22.23.1, Playwright 1.64.0.

Seuil du test : croissance RSS inférieure à 1536 Mo (environ 33 % au-dessus du pic mesuré) ;
aucun processus de l'arbre ne doit subsister après la fin du CLI.

Limites : l'échantillonnage (250 ms) peut manquer un pic bref ; le RSS compte les pages partagées
entre processus (il surestime la mémoire réelle) ; les mesures portent sur des pages légères, pas
sur des sites lourds.
