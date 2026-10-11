const RULE_IMPACTS = [
  ['image-alt', 'critical'],
  ['button-name', 'critical'],
  ['color-contrast', 'serious'],
  ['label', 'serious'],
  ['link-name', 'serious'],
  ['heading-order', 'moderate'],
  ['landmark-one-main', 'moderate'],
  ['region', 'moderate'],
  ['html-has-lang', 'minor'],
  ['duplicate-id-aria', 'minor'],
];
const PAGE_COUNT = 8;
const BASE_NODE_COUNT = 4;
const LONG_URL = `https://client.example/une/adresse/tres/longue/${'segment-'.repeat(14)}fin?utm=1`;

const nodes = (id, count) =>
  Array.from({ length: count }, (_, index) => ({
    html: `<div class="${id}-${index}" data-long="${'x'.repeat(60)}">Contenu ${index}</div>`,
    target: `main .${id}-${index}`,
    failureSummary: 'Corriger cet élément',
  }));

const violation = ([id, impact], count) => ({
  id,
  impact,
  help: `Règle ${id}`,
  description: `Description ${id}`,
  helpUrl: `https://example.test/${id}`,
  tags: ['wcag2a'],
  nodes: nodes(id, count),
});

const page = (index) => ({
  url: index === 1 ? LONG_URL : `https://client.example/page-${index}`,
  title: `Page numéro ${index} avec un titre assez long pour tester les retours à la ligne`,
  audited: true,
  passes: 30 + index,
  incomplete: index % 3 === 0 ? [violation(['color-contrast', 'serious'], 2)] : [],
  violations: RULE_IMPACTS.filter((_, ruleIndex) => (ruleIndex + index) % 2 === 0).map((rule) =>
    violation(rule, BASE_NODE_COUNT + index),
  ),
});

const GENERATED_AT = '2026-10-10T08:00:00.000Z';

const buildDenseScan = () => ({
  generatedAt: GENERATED_AT,
  pages: Array.from({ length: PAGE_COUNT }, (_, index) => page(index + 1)),
  unauditedPages: [{ url: 'https://client.example/privee' }, { url: LONG_URL }],
});

const buildSparseScan = () => ({
  generatedAt: GENERATED_AT,
  pages: [
    { ...page(1), violations: [violation(RULE_IMPACTS[0], 2), violation(RULE_IMPACTS[2], 1)], incomplete: [] },
    { ...page(2), violations: [violation(RULE_IMPACTS[8], 1)], incomplete: [] },
    { ...page(3), violations: [], incomplete: [] },
  ],
  unauditedPages: [],
});

export const buildCorpora = () => ({ dense: buildDenseScan(), sparse: buildSparseScan() });
