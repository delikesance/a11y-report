function normaliseCorrectif({ texte, code, apres }) {
  return { texte, code: code ?? apres };
}

function normaliseEntry({ titre, titreFr, correctif, ...rest }) {
  return { ...rest, titre: titre ?? titreFr, titreFr: titreFr ?? titre, correctif: normaliseCorrectif(correctif) };
}

export function normaliseExtra(...sources) {
  const merged = Object.assign({}, ...sources);
  return Object.fromEntries(Object.entries(merged).map(([id, entry]) => [id, normaliseEntry(entry)]));
}
