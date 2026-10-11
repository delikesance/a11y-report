import { deflateSync, inflateSync } from 'node:zlib';

const latin1 = (buffer) => buffer.toString('latin1');
const bytes = (text) => Buffer.from(text, 'latin1');

const PAINT_OPERATORS = new Set(['f', 'F', 'f*', 'S', 's', 'B', 'B*', 'b', 'b*']);
const PATH_OPERATORS = new Set(['re', 'm', 'l', 'c', 'v', 'y', 'h']);
const operatorOf = (line) => (line.endsWith('BDC') ? 'BDC' : line.slice(line.lastIndexOf(' ') + 1));

export function markPaintingAsArtifact(content) {
  const out = [];
  let depth = 0;
  let path = [];
  for (const line of content.split('\n')) {
    const operator = operatorOf(line);
    if (operator === 'BDC' || operator === 'BMC') depth += 1;
    if (depth > 0 || !(PATH_OPERATORS.has(operator) || path.length)) {
      out.push(line);
    } else if (PAINT_OPERATORS.has(operator)) {
      out.push('/Artifact BMC', ...path, line, 'EMC');
      path = [];
    } else if (operator === 'n' || operator === 'W' || operator === 'W*') {
      out.push(...path, line);
      path = [];
    } else {
      path.push(line);
    }
    if (operator === 'EMC') depth -= 1;
  }
  return out.join('\n');
}

const OBJECT = /\n(\d+) 0 obj\n([\s\S]*?)endobj/g;
const lastMatch = (pattern, text) => [...text.matchAll(pattern)].at(-1);

function readTrailer(text) {
  const [, size] = text.match(/trailer\s*<<[\s\S]*?\/Size (\d+)/);
  const [, root] = text.match(/trailer\s*<<[\s\S]*?\/Root (\d+) 0 R/);
  const [, info] = text.match(/trailer\s*<<[\s\S]*?\/Info (\d+) 0 R/);
  const [, previous] = lastMatch(/startxref\s+(\d+)/g, text);
  return { size: Number(size), root: Number(root), info: Number(info), previous: Number(previous) };
}

const objectBody = (text, id) => {
  const found = [...text.matchAll(OBJECT)].find(([, number]) => Number(number) === id);
  return found[2];
};

function decodeTitle(infoBody) {
  const hex = infoBody.match(/\/Title\s*<([0-9A-Fa-f]+)>/);
  if (hex) return Buffer.from(hex[1], 'hex').swap16().subarray(2).toString('utf16le');
  return infoBody.match(/\/Title\s*\(([^)]*)\)/)[1];
}

const xmlEscape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const buildXmp = (title, language) => `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(title)}</rdf:li></rdf:Alt></dc:title>
<dc:language><rdf:Bag><rdf:li>${language}</rdf:li></rdf:Bag></dc:language>
<pdfuaid:part>1</pdfuaid:part>
</rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

const streamObject = (id, dictionary, data) =>
  Buffer.concat([bytes(`${id} 0 obj\n<<${dictionary}/Length ${data.length}>>\nstream\n`), data, bytes('\nendstream\nendobj\n')]);

function rewriteContentStream(pdf, id) {
  const text = latin1(pdf);
  const header = new RegExp(`\\n${id} 0 obj\\n<<([\\s\\S]*?)>>\\s*stream\\r?\\n`).exec(text);
  if (!header) throw new Error(`Objet ${id} introuvable`);
  const start = header.index + header[0].length;
  const compressed = pdf.subarray(start, text.indexOf('endstream', start)).toString('latin1').replace(/\n$/, '');
  const marked = markPaintingAsArtifact(inflateSync(bytes(compressed)).toString('latin1'));
  const dictionary = header[1].replace(/\/Length \d+/, '').trim();
  return streamObject(id, dictionary, deflateSync(bytes(marked)));
}

const xrefSection = (entries) =>
  `xref\n${entries.map(({ id, offset }) => `${id} 1\n${String(offset).padStart(10, '0')} 00000 n \n`).join('')}`;

export function makePdfUaCompliant(pdf, language = 'fr') {
  const text = latin1(pdf);
  const { size, root, info, previous } = readTrailer(text);
  const title = decodeTitle(objectBody(text, info));
  const contentIds = [...text.matchAll(/\/Contents (\d+) 0 R/g)].map(([, id]) => Number(id));
  const metadataId = size;
  const catalog = objectBody(text, root).trimEnd().replace(/>>$/, `/Metadata ${metadataId} 0 R>>`);

  const parts = [
    ...contentIds.map((id) => ({ id, data: rewriteContentStream(pdf, id) })),
    { id: root, data: bytes(`${root} 0 obj\n${catalog}\nendobj\n`) },
    { id: metadataId, data: streamObject(metadataId, '/Type /Metadata /Subtype /XML', Buffer.from(buildXmp(title, language), 'utf8')) },
  ];
  let offset = pdf.length + 1;
  const entries = parts.map(({ id, data }) => {
    const entry = { id, offset };
    offset += data.length;
    return entry;
  });
  const xrefOffset = offset;
  const trailer = `trailer\n<</Size ${size + 1}/Root ${root} 0 R/Info ${info} 0 R/Prev ${previous}>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.concat([pdf, bytes('\n'), ...parts.map(({ data }) => data), bytes(xrefSection(entries) + trailer)]);
}
