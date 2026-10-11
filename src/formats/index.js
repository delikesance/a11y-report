import * as html from './html.js';
import * as csv from './csv.js';
import * as json from './json.js';
import * as sarif from './sarif.js';

/** @type {[string, (scan: any, options?: any) => string][]} */
const RENDERER_ENTRIES = [
  ['json', json.render],
  ['html', html.render],
  ['csv', csv.render],
  ['sarif', sarif.render],
];
const RENDERERS = new Map(RENDERER_ENTRIES);

export const FORMATS = [...RENDERERS.keys()];

export function renderFormat(name, scan, options = {}) {
  const render = RENDERERS.get(name);
  if (!render) throw new Error(`Format inconnu : ${name}`);
  return render(scan, options);
}
