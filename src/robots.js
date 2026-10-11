const ANY_AGENT = '*';

export function parseRobots(text) {
  return { isAllowed: (url, userAgent) => isAllowed(parseGroups(text), url, userAgent) };
}

function parseGroups(text) {
  const groups = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const [key, value] = splitDirective(line);
    if (key === 'user-agent') {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((key === 'allow' || key === 'disallow') && current && value) {
      current.rules.push({ allow: key === 'allow', pattern: value });
    }
  }
  return groups;
}

function splitDirective(line) {
  const content = line.replace(/#.*$/, '').trim();
  const separator = content.indexOf(':');
  if (separator === -1) return [];
  return [content.slice(0, separator).trim().toLowerCase(), content.slice(separator + 1).trim()];
}

function isAllowed(groups, url, userAgent) {
  const path = pathOf(url);
  const rules = applicableRules(groups, userAgent.toLowerCase());
  const matches = rules.filter((rule) => toRegExp(rule.pattern).test(path));
  if (matches.length === 0) return true;
  const longest = Math.max(...matches.map((rule) => rule.pattern.length));
  return matches.some((rule) => rule.allow && rule.pattern.length === longest);
}

function applicableRules(groups, userAgent) {
  const named = groups.filter((group) => group.agents.some((agent) => agent !== ANY_AGENT && userAgent.includes(agent)));
  const selected = named.length > 0 ? named : groups.filter((group) => group.agents.includes(ANY_AGENT));
  return selected.flatMap((group) => group.rules);
}

function pathOf(url) {
  const { pathname, search } = new URL(url);
  return `${pathname}${search}`;
}

function toRegExp(pattern) {
  const body = pattern
    .replace(/\$$/, '\u0000')
    .split('*')
    .map((part) => part.replace(/[.+?^{}()|[\]\\]/g, '\\$&'))
    .join('.*')
    .replace('\u0000', '$');
  return new RegExp(`^${body}`);
}
