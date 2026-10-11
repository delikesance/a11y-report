import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('.', import.meta.url));
const HOME_PAGE = '/healthy/home.html';
const MAX_SLOW_MS = 10000;
const SPA_DELAY_MS = 300;
const BIG_ELEMENT_COUNT = 5000;
const CHARSET_DIR = 'charsets';
const PAGE_DIRS = ['healthy', 'faulty'];

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};
const TEXT_TYPES = new Set(['text/html', 'text/css', 'text/javascript', 'text/plain', 'application/json', 'application/xml', 'image/svg+xml']);

const html = (title, body) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;

/** @param {import('node:http').ServerResponse} res @param {number} status @param {Record<string, string>} headers @param {string | Uint8Array} [body] */
const send = (res, status, headers, body = '') => {
  res.writeHead(status, headers);
  res.end(body);
};
const sendHtml = (res, body, status = 200) => send(res, status, { 'Content-Type': 'text/html; charset=utf-8' }, body);
const sendNotFound = (res) => sendHtml(res, html('404', '<h1>Page introuvable</h1>'), 404);

const SPA_SCRIPT = `setTimeout(() => {
  document.getElementById('app').insertAdjacentHTML('beforeend', '<p>Contenu chargé</p><button class="icon-only"></button>');
}, ${SPA_DELAY_MS});`;

const bigPage = () => {
  const rows = Array.from({ length: BIG_ELEMENT_COUNT }, (_, i) => `<p>Élément ${i + 1}</p>`).join('');
  return html('Grande page', `<h1>Grande page</h1>${rows}`);
};

const sitemapXml = async (base, root) => {
  const entries = [];
  for (const dir of PAGE_DIRS) {
    const files = await readdir(join(root, dir)).catch(() => []);
    entries.push(...files.filter((f) => f.endsWith('.html')).map((f) => `${base}/${dir}/${f}`));
  }
  const locs = entries.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs}\n</urlset>\n`;
};

const charsetFor = (filePath) => {
  if (!filePath.split(sep).includes(CHARSET_DIR)) return 'utf-8';
  const parts = basename(filePath).split('.');
  return parts.length > 2 ? parts[parts.length - 2] : 'utf-8';
};

const contentTypeFor = (filePath) => {
  const type = MIME_TYPES[extname(filePath)] ?? 'application/octet-stream';
  return TEXT_TYPES.has(type) ? `${type}; charset=${charsetFor(filePath)}` : type;
};

const serveStatic = async ({ root, pathname, res }) => {
  const requested = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const filePath = resolve(root, `.${decodeURIComponent(requested)}`);
  if (!filePath.startsWith(resolve(root) + sep)) return sendNotFound(res);
  try {
    const body = await readFile(filePath);
    send(res, 200, { 'Content-Type': contentTypeFor(filePath) }, body);
  } catch {
    sendNotFound(res);
  }
};

/** @type {{match: RegExp, handle: (ctx: any, found: RegExpExecArray) => any}[]} */
const routes = [
  { match: /^\/status\/(404|500|503)$/, handle: ({ res }, [, code]) => sendHtml(res, html(code, `<h1>Erreur ${code}</h1>`), Number(code)) },
  { match: /^\/redirect\/(\d+)$/, handle: ({ res }, [, n]) => send(res, 302, { Location: Number(n) > 1 ? `/redirect/${Number(n) - 1}` : HOME_PAGE }) },
  { match: /^\/redirect-loop$/, handle: ({ res }) => send(res, 302, { Location: '/redirect-loop' }) },
  {
    match: /^\/slow$/,
    handle: ({ res, url }) => {
      const delay = Math.min(Number(url.searchParams.get('ms')) || 0, MAX_SLOW_MS);
      setTimeout(() => sendHtml(res, html('Lent', `<h1>Réponse après ${delay} ms</h1>`)), delay);
    },
  },
  { match: /^\/timeout$/, handle: () => {} },
  { match: /^\/empty$/, handle: ({ res }) => sendHtml(res, '') },
  { match: /^\/pdf$/, handle: ({ res }) => send(res, 200, { 'Content-Type': 'application/pdf' }, '%PDF-1.4\n%%EOF\n') },
  { match: /^\/robots\.txt$/, handle: ({ res }) => send(res, 200, { 'Content-Type': 'text/plain; charset=utf-8' }, 'User-agent: *\nDisallow: /private/\n') },
  { match: /^\/private\/page\.html$/, handle: ({ res }) => sendHtml(res, html('Privée', '<h1>Page privée</h1>')) },
  {
    match: /^\/sitemap\.xml$/,
    handle: async ({ req, res, root }) => {
      const base = `http://${req.headers.host}`;
      send(res, 200, { 'Content-Type': 'application/xml; charset=utf-8' }, await sitemapXml(base, root));
    },
  },
  {
    match: /^\/spa$/,
    handle: ({ res }) => sendHtml(res, html('SPA', `<main id="app"></main><script>${SPA_SCRIPT}</script>`)),
  },
  { match: /^\/big$/, handle: ({ res }) => sendHtml(res, bigPage()) },
];

const dispatch = (ctx) => {
  for (const { match, handle } of routes) {
    const found = match.exec(ctx.url.pathname);
    if (found) return handle(ctx, found);
  }
  return serveStatic(ctx);
};

export const startFixtureServer = ({ port = 0, root = DEFAULT_ROOT } = {}) => {
  const sockets = new Set();
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    Promise.resolve(dispatch({ req, res, url, root, pathname: url.pathname })).catch(() => sendNotFound(res));
  });
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  return new Promise((resolveStart) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: boundPort } = /** @type {import('node:net').AddressInfo} */ (server.address());
      resolveStart({
        url: `http://127.0.0.1:${boundPort}`,
        close: () => new Promise((resolveClose) => {
          server.close(resolveClose);
          server.closeAllConnections();
        }),
      });
    });
  });
};
