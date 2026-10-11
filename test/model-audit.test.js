import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectAuditGaps } from '../src/report/model.js';

const incompleteItem = { id: 'color-contrast', impact: 'serious', nodes: [{ html: '<p>', target: 'p', failureSummary: 'indéterminé' }] };

const scan = {
  pages: [
    { url: 'https://site.test/a', audited: true, violations: [], incomplete: [incompleteItem] },
    { url: 'https://site.test/b', audited: false, error: 'HTTP 404 : page en erreur', violations: [], incomplete: [] },
  ],
};

test('collectAuditGaps lists pages that were not audited', () => {
  const { unauditedPages } = collectAuditGaps(scan);
  assert.deepEqual(unauditedPages.map((page) => page.url), ['https://site.test/b']);
});

test('collectAuditGaps lists incomplete results with their page URL', () => {
  const { incomplete } = collectAuditGaps(scan);
  assert.equal(incomplete.length, 1);
  assert.equal(incomplete[0].id, 'color-contrast');
  assert.equal(incomplete[0].pageUrl, 'https://site.test/a');
});
