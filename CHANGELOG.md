# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- CLI : `--format` (pdf, json, html, csv, sarif ; répétable ou en liste), `--out` accepte un dossier pour plusieurs formats.
- CLI : `--concurrency` (1 à 16) et `--viewport` (préréglages ou LxH, répétable).
- CLI : `--crawl` avec `--crawl-depth`, `--max-pages`, `--sitemap`/`--no-sitemap`, `--exclude`, `--delay`.
- CLI : `--ci`, `--seuil`, `--seuils-fichier`, `--ci-format github|text`, codes de retour 0/1/2/3.
- Aide `--help` entièrement en français, avec exemples et codes de retour.

### Changed

- `--out` n'a plus de valeur par défaut : le nom dépend du format (`rapport.<format>`).
- Les options de ligne de commande sont analysées dans `src/cli/options.js`.

### Fixed
