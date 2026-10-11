import { intBetween, pickOne } from './prng.js';

const IMPACTS = ['critical', 'serious', 'moderate', 'minor'];
const HTML_POOL = ['<img src="a.png">', '<button></button>', '<input type="text">', '<p class="x"></p>'];
const TARGET_POOL = ['#main', '.card > a', 'footer img', 'nav ul li'];

export function randomProblems(random, { maxProblems = 6, maxNodes = 8 } = {}) {
  return Array.from({ length: intBetween(random, 1, maxProblems) }, (_, index) => {
    const minutes = pickOne(random, [undefined, 5, 10, 20, 45, 61]);
    const nodes = Array.from({ length: intBetween(random, 1, maxNodes) }, () => ({
      html: pickOne(random, HTML_POOL),
      target: pickOne(random, TARGET_POOL),
    }));
    return {
      id: `rule-${index}`,
      impact: pickOne(random, IMPACTS),
      nodes,
      occurrences: nodes.length,
      rule: { titre: `Règle ${index}`, minutesParOccurrence: minutes },
    };
  });
}

export function randomRates(random) {
  return {
    tjm: pickOne(random, [300, 450, 550, 700]),
    marge: pickOne(random, [0, 0.1, 0.15, 0.3]),
    tva: pickOne(random, [0, 0.055, 0.2]),
    minimumPhase: pickOne(random, [100, 550, 900]),
  };
}
