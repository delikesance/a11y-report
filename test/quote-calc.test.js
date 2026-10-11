import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeQuote } from '../src/report/quote-calc.js';
import { seededRandom } from './support/prng.js';
import { randomProblems, randomRates } from './support/quote-fixtures.js';

const problem = (impact, nodes, minutesParOccurrence) => ({
  id: `${impact}-rule`,
  impact,
  nodes,
  occurrences: nodes.length,
  rule: { titre: 'Règle', minutesParOccurrence },
});
const distinctNodes = (count) => Array.from({ length: count }, (_, i) => ({ html: `<n${i}>`, target: `#n${i}` }));
const PROPERTY_RUNS = 300;

test('a phase below the minimum is billed at the minimum', () => {
  const quote = computeQuote([problem('critical', distinctNodes(1), 10)], { tjm: 550, marge: 0.15 });

  assert.equal(quote.phases[0].price, 550);
});

test('hours round up to the half hour and the marge applies to the TJM', () => {
  const quote = computeQuote([problem('critical', distinctNodes(1), 61)], { tjm: 550, marge: 0.15, minimumPhase: 1 });

  assert.equal(quote.phases[0].hours, 1.5);
  assert.equal(quote.phases[0].price, 948.75);
});

test('TTC is HT plus TVA', () => {
  const quote = computeQuote([problem('critical', distinctNodes(1), 60)], { tjm: 1000, marge: 0, tva: 0.2 });

  assert.equal(quote.totalPrice, 1000);
  assert.equal(quote.ttc, 1200);
  assert.equal(quote.tva, 200);
});

test('an identical node repeated across pages is counted once for fix time', () => {
  const sameNode = { html: '<img>', target: '#logo' };
  const quote = computeQuote([problem('critical', [sameNode, sameNode, sameNode], 30)], { tjm: 550, marge: 0 });

  assert.equal(quote.phases[0].occurrences, 3);
  assert.equal(quote.phases[0].minutes, 30);
});

test('a phase without problem has no amount and totals stay null without any problem', () => {
  const quote = computeQuote([], {});

  assert.equal(quote.phases[0].price, null);
  assert.equal(quote.totalPrice, null);
  assert.equal(quote.ttc, null);
});

test('minutes fall back to the impact table when the rule has no minutesParOccurrence', () => {
  const quote = computeQuote([problem('serious', distinctNodes(2), undefined)], { tjm: 550, marge: 0, minimumPhase: 1 });

  assert.equal(quote.phases[1].minutes, 40);
});

test('property: totals equal the sum of phases, TTC equals HT plus TVA, low is never above high', () => {
  const random = seededRandom(20261011);
  for (let run = 0; run < PROPERTY_RUNS; run += 1) {
    const rates = randomRates(random);
    const quote = computeQuote(randomProblems(random), rates);
    const priced = quote.phases.filter((phase) => phase.price !== null);
    const sum = (key) => Math.round(priced.reduce((total, phase) => total + phase[key] * 100, 0)) / 100;

    assert.equal(quote.totalPrice, priced.length ? sum('price') : null);
    assert.equal(quote.totalLow, priced.length ? sum('low') : null);
    assert.equal(quote.totalHigh, priced.length ? sum('high') : null);
    if (priced.length) {
      assert.equal(quote.ttc, Math.round(quote.totalPrice * 100 * (1 + rates.tva)) / 100);
      assert.ok(quote.totalLow <= quote.totalHigh);
    }
    for (const phase of priced) {
      assert.ok(phase.price > 0);
      assert.ok(phase.price >= rates.minimumPhase);
      assert.ok(phase.low <= phase.high);
    }
  }
});

test('property: duplicating an existing node never changes the price', () => {
  const random = seededRandom(7);
  for (let run = 0; run < PROPERTY_RUNS; run += 1) {
    const rates = randomRates(random);
    const problems = randomProblems(random);
    const duplicated = problems.map((item) => ({ ...item, nodes: [...item.nodes, item.nodes[0]] }));

    assert.equal(computeQuote(duplicated, rates).totalPrice, computeQuote(problems, rates).totalPrice);
  }
});

test('property: mutualisation never increases the price', () => {
  const random = seededRandom(99);
  for (let run = 0; run < PROPERTY_RUNS; run += 1) {
    const rates = randomRates(random);
    const problems = randomProblems(random);
    const withDistinctNodes = problems.map((item) => ({
      ...item,
      nodes: item.nodes.map((node, index) => ({ ...node, html: `${node.html}#${item.id}-${index}` })),
    }));
    const mutualised = computeQuote(problems, rates).totalPrice ?? 0;
    const unmutualised = computeQuote(withDistinctNodes, rates).totalPrice ?? 0;

    assert.ok(mutualised <= unmutualised);
  }
});
