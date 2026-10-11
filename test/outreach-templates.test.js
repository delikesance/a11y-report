import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTREACH = join(dirname(fileURLToPath(import.meta.url)), '..', 'outreach');
const VARIANTS = ['freelance', 'studio', 'agence'];
const STEPS = ['1-premier-contact', '2-relance-valeur', '3-dernier-message'];
const MAX_BODY_WORDS = 120;
const FORBIDDEN = /claude|anthropic|\bIA\b|\bAI\b|intelligence artificielle|garanti/i;

const splitEml = (text) => {
  const [head, ...rest] = text.split('\n\n');
  return { head, body: rest.join('\n\n').trim() };
};

const frontMatter = (text) => {
  const [, block, rest] = text.split('---\n');
  const fields = Object.fromEntries(block.split('\n').map((line) => {
    const colon = line.indexOf(':');
    return [line.slice(0, colon), line.slice(colon + 1).trim().replace(/^"|"$/g, '')];
  }));
  return { fields, body: rest.trim() };
};

const read = (variant, name) => readFileSync(join(OUTREACH, variant, name), 'utf8');

for (const variant of VARIANTS) {
  for (const step of STEPS) {
    test(`${variant}/${step} : .md et .eml cohérents`, () => {
      const md = frontMatter(read(variant, `${step}.md`));
      const eml = read(variant, `${step}.eml`);
      const { head, body } = splitEml(eml);

      assert.equal(md.body, body, 'le corps du .md doit être celui du .eml');
      assert.equal(head.match(/^Subject: (.*)$/m)[1], md.fields.objet_a);
      assert.match(head, /^List-Unsubscribe: <mailto:\{\{email_expediteur\}\}\?subject=STOP>, <\{\{url_desinscription\}\}>$/m);
      assert.match(head, /^Content-Transfer-Encoding: 8bit$/m);
      assert.ok(md.fields.objet_b, 'objet B manquant');
    });

    test(`${variant}/${step} : corps court, sans promesse ni mention d'IA`, () => {
      const eml = read(variant, `${step}.eml`);
      const { body } = splitEml(eml);

      assert.ok(body.split(/\s+/).length < MAX_BODY_WORDS, 'corps de 120 mots ou plus');
      assert.doesNotMatch(eml, FORBIDDEN);
      assert.match(body, /Votre adresse figure sur \{\{url_source\}\}\./);
      assert.match(body, /répondez STOP ou cliquez sur \{\{url_desinscription\}\}/);
      assert.match(body, /\{\{url_demo\}\}/);
    });
  }
}

test('chaque variante a exactement les trois messages attendus', () => {
  for (const variant of VARIANTS) {
    const names = readdirSync(join(OUTREACH, variant)).filter((name) => name.endsWith('.eml')).map((name) => name.replace('.eml', ''));
    assert.deepEqual(names.sort(), [...STEPS].sort());
  }
});
