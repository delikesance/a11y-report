# Décisions

Journal des décisions d'architecture et de produit. Une entrée par décision : date, contexte, décision, conséquences.

## 2026-10-11 : estimation RGAA sur les critères automatisables uniquement

- **Date :** 2026-10-11
- **Contexte :** REP-01 demande un pourcentage RGAA. Le test automatique ne couvre qu'une partie des critères, et la déclaration d'accessibilité relève de l'éditeur (critère 1.6).
- **Décision :** pourcentage calculé sur les 29 critères référencés par `src/rules-fr.js`, libellé « estimation partielle », sans nouvelle dépendance. Le libellé des outils reste générique (sans marque tierce) pour respecter `CONTRACT.md`.
- **Conséquences :** le pourcentage peut monter sans que la conformité progresse ; la liste des critères est à revoir si `rules-fr.js` change. Le nom des outils n'apparaît pas dans le rapport : à trancher si la transparence sur les outils doit primer.

## Modèle d'entrée

- **Date :** AAAA-MM-JJ
- **Contexte :**
- **Décision :**
- **Conséquences :**
