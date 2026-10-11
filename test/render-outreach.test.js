import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvRecords, planOutput, renderEml, slugify } from '../scripts/outreach/render.js';

const SENDER = {
  prenom_expediteur: 'Camille',
  nom_expediteur: 'Dupont',
  email_expediteur: 'camille@example.fr',
  raison_sociale: 'Atelier Exemple',
  adresse_postale: '1 rue de la Paix, 75002 Paris',
  url_demo: 'https://example.fr/demo.html',
  url_desinscription: 'https://example.fr/desinscription',
  url_mention_information: 'https://example.fr/information',
};

const ROW = {
  nom: 'Agence Été',
  site: 'https://ete.example',
  email_professionnel: 'contact@ete.example',
  url_source: 'https://ete.example/contact',
  specialite: 'Web',
};

const TEMPLATE = [
  'From: {{email_expediteur}}',
  'To: {{email_prospect}}',
  "Subject: {{agence_prospect}} : un rapport d'accessibilité",
  'Content-Type: text/plain; charset=UTF-8',
  '',
  'Bonjour, {{url_source}}',
  '',
  'Cordialement, {{prenom_expediteur}}',
].join('\n');

const decodeSubject = (line) => {
  const words = [...line.matchAll(/=\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?=/g)];
  return words.map((match) => Buffer.from(match[1], 'base64').toString('utf8')).join('');
};

test('csvRecords gère les guillemets, les virgules et les retours à la ligne dans un champ', () => {
  const text = 'nom,justification\r\n"A, ""B""","ligne 1\nligne 2"\r\n';

  assert.deepEqual(csvRecords(text), [{ nom: 'A, "B"', justification: 'ligne 1\nligne 2' }]);
});

test('renderEml remplace les placeholders et encode un objet non ASCII', () => {
  const eml = renderEml(TEMPLATE, { ...SENDER, agence_prospect: ROW.nom, email_prospect: ROW.email_professionnel, url_source: ROW.url_source });

  assert.equal(decodeSubject(eml), "Agence Été : un rapport d'accessibilité");
  assert.match(eml, /^To: contact@ete\.example\r\n/m);
  assert.match(eml, /Bonjour, https:\/\/ete\.example\/contact\r\n/);
  assert.ok(eml.endsWith('Cordialement, Camille\r\n'));
});

test('renderEml refuse un placeholder non résolu', () => {
  assert.throws(() => renderEml('Subject: {{inconnu}}\n\nCorps', SENDER), /Placeholder non résolu : \{\{inconnu\}\}/);
});

test('planOutput refuse une ligne sans e-mail', () => {
  const templates = [{ name: '1-premier-contact.eml', text: TEMPLATE }];

  assert.throws(
    () => planOutput({ rows: [{ ...ROW, email_professionnel: '' }], sender: SENDER, templates }),
    /Ligne 2 \(Agence Été\) : e-mail vide/,
  );
});

test('planOutput refuse une adresse nominative sans consentement', () => {
  const templates = [{ name: '1-premier-contact.eml', text: TEMPLATE }];

  assert.throws(
    () => planOutput({ rows: [{ ...ROW, email_professionnel: 'prenom.nom@ete.example' }], sender: SENDER, templates }),
    /adresse nominative/,
  );
});

test('planOutput refuse un expéditeur incomplet', () => {
  const templates = [{ name: '1-premier-contact.eml', text: TEMPLATE }];

  assert.throws(
    () => planOutput({ rows: [ROW], sender: { ...SENDER, adresse_postale: '' }, templates }),
    /Expéditeur incomplet : adresse_postale/,
  );
});

test('planOutput produit un fichier par ligne et par gabarit, dans un dossier au nom slugifié', () => {
  const templates = [
    { name: '1-premier-contact.eml', text: TEMPLATE },
    { name: '2-relance-valeur.eml', text: TEMPLATE },
  ];

  const files = planOutput({ rows: [ROW], sender: SENDER, templates });

  assert.deepEqual(files.map((file) => file.relPath), [
    'agence-ete/1-premier-contact.eml',
    'agence-ete/2-relance-valeur.eml',
  ]);
});

test('slugify retire les accents et les caractères spéciaux', () => {
  assert.equal(slugify('  Blü Creative (Québec) '), 'blu-creative-quebec');
});
