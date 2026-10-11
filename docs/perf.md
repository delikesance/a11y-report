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

## Mémoire : tas Node et Chromium séparés

Script : `scripts/measure-memory.js <pages> <concurrence>` (lancé avec `node --expose-gc`), matrice :
`scripts/measure-memory-matrix.sh`. Chaque cas tourne dans un processus Node neuf, qui exécute
`scanPages` en direct sur des pages générées. Toutes les 500 ms : `process.memoryUsage()` (tas et RSS
de Node) et, via `ps`, RSS cumulé des descendants du processus (Chromium et ses rendus). Le tas est
aussi relevé après `gc()` avant et après le scan.

| Pages | Conc. | Tas après GC (Mo) | Pic tas (Mo) | Pic RSS Node (Mo) | Pic Chromium (Mo) | Processus Chromium | Résiduels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 1 | 50,4 | 63,4 | 166 | 522 | 7 | 0 |
| 25 | 1 | 50,7 | 65,9 | 176 | 527 | 7 | 0 |
| 50 | 1 | 50,9 | 75,5 | 183 | 525 | 7 | 0 |
| 100 | 1 | 51,4 | 92,7 | 204 | 528 | 7 | 0 |
| 10 | 4 | 50,4 | 58,6 | 175 | 943 | 11 | 0 |
| 25 | 4 | 50,6 | 74,8 | 193 | 1114 | 13 | 0 |
| 50 | 4 | 50,9 | 95,5 | 206 | 1055 | 12 | 0 |
| 100 | 4 | 51,4 | 140,5 | 256 | 1119 | 13 | 0 |

Lecture :
- Pas de fuite. Le tas après GC passe de 50,4 à 51,4 Mo entre 10 et 100 pages (environ 11 Ko par
  page), soit les résultats d'audit conservés dans le retour de `scanPages`, et non des contextes
  ou du HTML retenus. Le pic du tas croît avec le nombre de pages et la concurrence, mais retombe
  après GC.
- Chromium est plat en fonction du nombre de pages (environ 525 Mo à concurrence 1, 1,0 à 1,1 Go à
  concurrence 4) : il dépend de la concurrence, pas du volume. C'est lui qui explique le RSS de
  l'arbre du test de charge.
- Aucun processus ne subsiste après `scanPages`.

Invariant testé (`test/scan-memory.test.js`) : le tas après GC entre 10 et 50 pages (concurrence 4)
varie de moins de 5 Mo (mesuré : 0,5 Mo), toutes les pages sont auditées, aucun descendant restant.

Limites : pages légères et identiques ; une seule exécution par cas ; l'échantillonnage à 500 ms
peut manquer un pic bref ; le RSS compte les pages partagées.
