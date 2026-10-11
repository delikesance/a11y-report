const ASCII_MAX = 0x7f;
const PLACEHOLDER = /\{\{[^{}]+\}\}/g;
const SUBJECT_CHUNK_LENGTH = 10;
const REQUIRED_SENDER_KEYS = [
  'prenom_expediteur',
  'nom_expediteur',
  'email_expediteur',
  'raison_sociale',
  'adresse_postale',
  'url_demo',
  'url_desinscription',
  'url_mention_information',
];

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = false;
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) rows.push([...row, field]);
  return rows;
};

export const csvRecords = (text) => {
  const [header, ...lines] = parseCsv(text).filter((fields) => fields.some((value) => value !== ''));
  return lines.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ''])));
};

const splitEml = (text) => {
  const separator = /\n\n/.exec(text);
  if (!separator) throw new Error("EML sans separateur entre en-tetes et corps");
  const head = text.slice(0, separator.index);
  const body = text.slice(separator.index + separator[0].length);
  const headers = head.split('\n').map((line) => {
    const colon = line.indexOf(':');
    return [line.slice(0, colon), line.slice(colon + 1).trim()];
  });
  return { headers, body };
};

const fillTemplate = (text, values) => text.replace(PLACEHOLDER, (token) => {
  const key = token.slice(2, -2);
  return Object.hasOwn(values, key) ? values[key] : token;
});

const isAscii = (text) => Array.from(text).every((char) => char.codePointAt(0) <= ASCII_MAX);

const encodeHeader = (value) => {
  if (isAscii(value)) return value;
  const codePoints = Array.from(value);
  const words = [];
  for (let start = 0; start < codePoints.length; start += SUBJECT_CHUNK_LENGTH) {
    const piece = codePoints.slice(start, start + SUBJECT_CHUNK_LENGTH).join('');
    words.push(`=?UTF-8?B?${Buffer.from(piece, 'utf8').toString('base64')}?=`);
  }
  return words.join('\r\n ');
};

export const isNominativeAddress = (email) => email.split('@')[0].includes('.');

export const slugify = (text) => text
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const assertSender = (sender) => {
  const missing = REQUIRED_SENDER_KEYS.filter((key) => !sender[key] || sender[key].includes('{{'));
  if (missing.length > 0) throw new Error(`Expéditeur incomplet : ${missing.join(', ')}`);
};

export const assertSendable = (row, line) => {
  const refuse = (reason) => {
    throw new Error(`Ligne ${line} (${row.nom || 'sans nom'}) : ${reason}`);
  };
  if (!row.nom) refuse('nom vide');
  if (!row.url_source) refuse('url_source vide');
  if (!row.email_professionnel) refuse('e-mail vide');
  if (isNominativeAddress(row.email_professionnel)) {
    refuse('adresse nominative (prenom.nom@), hors envoi sans consentement (docs/prospection-rgpd.md, section 9)');
  }
};

export const rowValues = (row, sender) => ({
  ...sender,
  agence_prospect: row.nom,
  site_prospect: row.site,
  email_prospect: row.email_professionnel,
  url_source: row.url_source,
  specialite_prospect: row.specialite,
});

export const renderEml = (template, values) => {
  const filled = fillTemplate(template, values).replace(/\r?\n/g, '\n');
  const unresolved = filled.match(PLACEHOLDER) ?? [];
  if (unresolved.length > 0) throw new Error(`Placeholder non résolu : ${unresolved.join(', ')}`);
  const { headers, body } = splitEml(filled);
  const lines = headers.map(([name, value]) => `${name}: ${name === 'Subject' ? encodeHeader(value) : value}`);
  return [...lines, '', body.trimEnd().replace(/\n/g, '\r\n')].join('\r\n') + '\r\n';
};

export const planOutput = ({ rows, sender, templates }) => {
  assertSender(sender);
  return rows.flatMap((row, index) => {
    assertSendable(row, index + 2);
    const values = rowValues(row, sender);
    const slug = slugify(row.nom);
    return templates.map(({ name, text }) => ({
      relPath: `${slug}/${name}`,
      content: renderEml(text, values),
    }));
  });
};
