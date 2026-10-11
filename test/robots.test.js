import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots } from '../src/robots.js';

const ROBOTS = `# commentaire
User-agent: *
Disallow: /private/
Allow: /private/public.html

User-agent: badbot
Disallow: /
`;

describe('parseRobots().isAllowed', () => {
  const robots = parseRobots(ROBOTS);

  it('allows paths without a matching rule', () => {
    assert.equal(robots.isAllowed('https://site.test/index.html', 'a11y-report'), true);
  });

  it('disallows a path under a Disallow prefix', () => {
    assert.equal(robots.isAllowed('https://site.test/private/page.html', 'a11y-report'), false);
  });

  it('lets the longest matching Allow rule win', () => {
    assert.equal(robots.isAllowed('https://site.test/private/public.html', 'a11y-report'), true);
  });

  it('applies the group of the matching user agent', () => {
    assert.equal(robots.isAllowed('https://site.test/index.html', 'BadBot/1.0'), false);
  });

  it('supports * wildcards and $ end anchors', () => {
    const policy = parseRobots('User-agent: *\nDisallow: /*.pdf$\nDisallow: /tmp*\n');
    assert.equal(policy.isAllowed('https://site.test/doc/rapport.pdf', 'x'), false);
    assert.equal(policy.isAllowed('https://site.test/doc/rapport.pdf?v=2', 'x'), true);
    assert.equal(policy.isAllowed('https://site.test/tmp/a', 'x'), false);
  });

  it('treats an empty Disallow as no restriction', () => {
    assert.equal(parseRobots('User-agent: *\nDisallow:\n').isAllowed('https://site.test/', 'x'), true);
  });
});
