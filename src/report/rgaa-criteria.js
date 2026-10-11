// Référentiel RGAA 4.1.2 : 106 critères (source : docs/sources.md).
export const RGAA_CRITERIA_COUNT = 106;

// Critères automatisables : référencés par au moins une règle axe-core de rules-fr.js.
// Une absence d'anomalie détectée ne vaut pas conformité (voir docs/score.md).
export const AUTOMATABLE_CRITERIA = [
  { id: '1.1', theme: 'Images', titre: "Alternative textuelle des images porteuses d'information" },
  { id: '2.1', theme: 'Cadres', titre: 'Titre de cadre' },
  { id: '2.2', theme: 'Cadres', titre: 'Pertinence du titre de cadre' },
  { id: '3.2', theme: 'Couleurs', titre: 'Contraste du texte' },
  { id: '4.1', theme: 'Multimédia', titre: 'Transcription textuelle des médias pré-enregistrés' },
  { id: '4.10', theme: 'Multimédia', titre: 'Son déclenché automatiquement contrôlable' },
  { id: '5.2', theme: 'Tableaux', titre: 'Résumé des tableaux complexes' },
  { id: '5.7', theme: 'Tableaux', titre: "Association des cellules et de leurs en-têtes" },
  { id: '6.2', theme: 'Liens', titre: 'Intitulé de chaque lien' },
  { id: '7.1', theme: 'Scripts', titre: "Compatibilité des scripts avec les technologies d'assistance" },
  { id: '8.2', theme: 'Éléments obligatoires', titre: 'Code source valide' },
  { id: '8.3', theme: 'Éléments obligatoires', titre: 'Langue par défaut' },
  { id: '8.4', theme: 'Éléments obligatoires', titre: 'Code de langue pertinent' },
  { id: '8.5', theme: 'Éléments obligatoires', titre: 'Titre de page' },
  { id: '8.8', theme: 'Éléments obligatoires', titre: 'Code de langue des changements de langue' },
  { id: '9.1', theme: 'Structuration', titre: 'Structuration par titres, listes et citations' },
  { id: '9.2', theme: 'Structuration', titre: 'Cohérence de la structure du document' },
  { id: '9.3', theme: 'Structuration', titre: 'Structure des listes' },
  { id: '10.4', theme: 'Présentation', titre: 'Lisibilité du texte au zoom' },
  { id: '10.6', theme: 'Présentation', titre: 'Liens dont la nature est signalée' },
  { id: '10.8', theme: 'Présentation', titre: 'Contenus cachés ignorés des technologies d\'assistance' },
  { id: '11.1', theme: 'Formulaires', titre: 'Étiquette de chaque champ' },
  { id: '11.2', theme: 'Formulaires', titre: 'Pertinence des étiquettes' },
  { id: '11.9', theme: 'Formulaires', titre: 'Intitulé des boutons' },
  { id: '12.6', theme: 'Navigation', titre: 'Zones de regroupement de contenus' },
  { id: '12.7', theme: 'Navigation', titre: "Lien d'évitement ou d'accès rapide" },
  { id: '12.8', theme: 'Navigation', titre: 'Cohérence de l\'ordre de tabulation' },
  { id: '13.1', theme: 'Consultation', titre: 'Contrôle des limites de temps' },
  { id: '13.8', theme: 'Consultation', titre: 'Contenus en mouvement ou clignotants contrôlables' },
];
