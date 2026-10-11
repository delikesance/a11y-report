export const MAX_REDIRECTS = 10;

const NETWORK_ERROR = /net::ERR_/;
const REDIRECT_LOOP_ERROR = 'ERR_TOO_MANY_REDIRECTS';
const DOWNLOAD_ERROR = 'Download is starting';

export const isTimeout = (error) => error.name === 'TimeoutError';

export const isRetryableError = (error) =>
  isTimeout(error) || (NETWORK_ERROR.test(error.message) && !error.message.includes(REDIRECT_LOOP_ERROR));

export const isRetryableStatus = (status) => status >= 500;

export function skipCause({ status, contentType, redirectCount }) {
  if (redirectCount > MAX_REDIRECTS) return `trop de redirections (plus de ${MAX_REDIRECTS})`;
  if (status >= 400) return `HTTP ${status} : ${status >= 500 ? 'erreur serveur' : 'page en erreur'}`;
  if (contentType && !/^(text\/html|application\/xhtml\+xml)/.test(contentType)) {
    return `type de contenu non HTML (${contentType.split(';')[0]})`;
  }
  return null;
}

export function failureCause(error) {
  if (isTimeout(error)) return 'délai de réponse dépassé';
  if (error.message.includes(REDIRECT_LOOP_ERROR)) return 'boucle de redirection';
  if (error.message.includes(DOWNLOAD_ERROR)) return 'fichier téléchargé au lieu d\'une page HTML';
  if (error.message.includes('ERR_NAME_NOT_RESOLVED')) return 'domaine introuvable';
  if (error.message.includes('ERR_CONNECTION_REFUSED')) return 'connexion refusée';
  return `erreur de navigation : ${error.message.split('\n')[0]}`;
}
