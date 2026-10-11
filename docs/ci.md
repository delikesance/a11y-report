# Intégration continue

L'audit peut bloquer une livraison quand l'accessibilité régresse. Le mode `--ci` n'affiche que le résumé des seuils sur la sortie standard ; le code de sortie indique le résultat.

## Codes de sortie

| Code | Signification |
| --- | --- |
| 0 | Tous les seuils sont respectés. |
| 1 | Erreur d'usage (option invalide, URL invalide, fichier de seuils illisible). |
| 2 | Au moins un seuil est dépassé. |
| 3 | Une page est non auditée (injoignable) et `unaudited=true` est demandé. |

Si un seuil est dépassé et qu'une page est injoignable, le code 2 est renvoyé.

## Seuils

Les seuils se donnent par une chaîne d'options ou par un fichier JSON, avec les mêmes clés.

| Clé | Défaut | Rôle |
| --- | --- | --- |
| `critical` | 0 | Nombre maximal d'occurrences critiques. |
| `serious` | 0 | Nombre maximal d'occurrences majeures. |
| `moderate` | sans limite | Nombre maximal d'occurrences modérées. |
| `minor` | sans limite | Nombre maximal d'occurrences mineures. |
| `score` | 0 | Score minimal (sur 100) exigé pour chaque page auditée. |
| `unaudited` | `false` | `true` : une page injoignable fait échouer le contrôle (code 3). |

Une occurrence est un élément HTML concerné par une règle (un nœud), additionné sur toutes les pages. Une page injoignable n'est pas notée.

Chaîne d'options :

```sh
node src/cli.js https://example.com --ci --seuils "critical=0,serious=5,score=80"
```

Fichier JSON (`seuils.json`) :

```json
{ "critical": 0, "serious": 5, "moderate": 20, "score": 80, "unaudited": true }
```

```sh
node src/cli.js https://example.com --ci --seuils seuils.json
```

Une valeur absente garde son défaut. Une clé inconnue, une valeur négative ou non numérique fait échouer la commande avec le code 1.

## Format de sortie

`--ci-format text` (défaut) affiche des lignes simples, lisibles dans les journaux de GitLab CI.
`--ci-format github` préfixe chaque échec par `::error`, ce qui crée une annotation sur la pull request dans GitHub Actions.

## Exemples

- GitHub Actions : [`docs/ci/github-actions.yml`](ci/github-actions.yml)
- GitLab CI : [`docs/ci/gitlab-ci.yml`](ci/gitlab-ci.yml)

Les deux exemples supposent que Playwright et Chromium sont installés (`npx playwright install --with-deps chromium`) et que le scan s'exécute sur une URL de préproduction accessible depuis le runner.
