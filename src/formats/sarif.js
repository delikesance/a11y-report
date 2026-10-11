import { describeRule } from '../rules-fr.js';
import { normaliseImpact } from '../report/model.js';
import { violationRows } from './rows.js';

const SARIF_SCHEMA = 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json';
const TOOL_NAME = 'a11y-reports';
const LEVEL_BY_IMPACT = { critical: 'error', serious: 'error', moderate: 'warning', minor: 'note' };

export const levelFor = (impact) => LEVEL_BY_IMPACT[normaliseImpact(impact)];

const toRuleDescriptor = (id) => {
  const rule = describeRule(id);
  return {
    id,
    name: id,
    shortDescription: { text: rule.titre },
    fullDescription: { text: rule.pourquoi },
    properties: { rgaa: rule.rgaa, wcag: rule.wcag },
  };
};

const toResult = ({ page, violation, node, rule }, ruleIds) => ({
  ruleId: violation.id,
  ruleIndex: ruleIds.indexOf(violation.id),
  level: levelFor(violation.impact),
  message: { text: `${rule.titre} : ${violation.help}` },
  locations: [
    {
      physicalLocation: { artifactLocation: { uri: page.url } },
      logicalLocations: [{ name: node.target, kind: 'element' }],
    },
  ],
  properties: { impact: violation.impact, html: node.html },
});

export function render(scan) {
  const rows = Array.from(violationRows(scan));
  const ruleIds = [...new Set(rows.map(({ violation }) => violation.id))];
  const log = {
    $schema: SARIF_SCHEMA,
    version: '2.1.0',
    runs: [
      {
        tool: { driver: { name: TOOL_NAME, rules: ruleIds.map(toRuleDescriptor) } },
        results: rows.map((row) => toResult(row, ruleIds)),
      },
    ],
  };
  return JSON.stringify(log, null, 2);
}
