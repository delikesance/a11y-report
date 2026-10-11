import { describeRule } from '../rules-fr.js';

export function* violationRows(scan) {
  for (const page of scan.pages) {
    for (const violation of page.violations) {
      const rule = describeRule(violation.id);
      for (const node of violation.nodes) yield { page, violation, node, rule };
    }
  }
}
