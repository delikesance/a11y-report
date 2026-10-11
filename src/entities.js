const NAMED_ENTITIES = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
]);
const ENTITY = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi;
const MAX_CODE_POINT = 0x10ffff;

export function decodeEntities(text) {
  return text.replace(ENTITY, (match, body) => decodeEntity(body) ?? match);
}

function decodeEntity(body) {
  if (body[0] !== '#') return NAMED_ENTITIES.get(body);
  const isHex = body[1].toLowerCase() === 'x';
  const codePoint = isHex ? parseInt(body.slice(2), 16) : Number(body.slice(1));
  return codePoint <= MAX_CODE_POINT ? String.fromCodePoint(codePoint) : undefined;
}
