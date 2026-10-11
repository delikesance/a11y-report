import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots } from '../src/robots.js';

const UA = 'a11y-report';
const allowed = (text, url) => parseRobots(text).isAllowed(url, UA);

describe('robots : normalisation du pourcentage-encodage', () => {
  test('une règle encodée bloque le chemin brut et inversement', () => {
    assert.equal(allowed('User-agent: *\nDisallow: /caf%C3%A9', 'https://s.test/café'), false);
    assert.equal(allowed('User-agent: *\nDisallow: /café', 'https://s.test/caf%C3%A9'), false);
  });

  test('%7E et ~ désignent le même caractère', () => {
    assert.equal(allowed('User-agent: *\nDisallow: /%7Euser', 'https://s.test/~user/page'), false);
  });

  test('un %2F reste distinct du séparateur /', () => {
    assert.equal(allowed('User-agent: *\nDisallow: /a%2Fb', 'https://s.test/a/b'), true);
  });
});
