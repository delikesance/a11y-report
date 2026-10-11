import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { decodeEntities } from '../src/entities.js';

describe('decodeEntities', () => {
  test('décode les entités nommées usuelles, une seule passe', () => {
    assert.equal(decodeEntities('a&amp;b &lt;c&gt; &quot;d&quot; &apos;e&apos; &amp;lt;'), 'a&b <c> "d" \'e\' &lt;');
  });

  test('décode les références numériques décimales et hexadécimales', () => {
    assert.equal(decodeEntities('&#65;&#x42;&#X63;'), 'ABc');
  });

  test('laisse intactes les entités inconnues ou hors plage', () => {
    assert.equal(decodeEntities('&unknown; &constructor; &#x110000;'), '&unknown; &constructor; &#x110000;');
  });
});
