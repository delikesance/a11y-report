export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

export function toViolation(violation) {
  return {
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    description: violation.description,
    helpUrl: violation.helpUrl,
    tags: violation.tags,
    nodes: violation.nodes.map((node) => ({
      html: node.html,
      target: node.target.join(' '),
      failureSummary: node.failureSummary,
    })),
  };
}
