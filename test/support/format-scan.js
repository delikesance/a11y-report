export const formatScan = {
  generatedAt: '2026-10-10T08:00:00.000Z',
  pages: [
    {
      url: 'https://client.example/accueil',
      title: 'Accueil <b>',
      audited: true,
      passes: 40,
      violations: [
        {
          id: 'image-alt',
          impact: 'critical',
          help: 'Images must have alternate text',
          description: 'Images need alt text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
          tags: ['wcag2a'],
          nodes: [
            { html: '<img src="logo.png">', target: 'img.logo', failureSummary: 'Add alt' },
            { html: '<img src="hero.jpg" title="a, "b"">\nsuite', target: 'img.hero', failureSummary: 'Add alt' },
          ],
        },
        {
          id: 'color-contrast',
          impact: 'serious',
          help: 'Elements must have sufficient color contrast',
          description: 'Contrast is low',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
          tags: ['wcag2aa'],
          nodes: [{ html: '<p>Texte</p>', target: 'p.intro', failureSummary: 'Contraste 2:1' }],
        },
      ],
      incomplete: [
        {
          id: 'color-contrast',
          impact: 'serious',
          help: 'Elements must have sufficient color contrast',
          description: 'Background unclear',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
          tags: ['wcag2aa'],
          nodes: [{ html: '<div>Fond</div>', target: 'div.bg', failureSummary: 'Vérifier le fond' }],
        },
      ],
    },
    { url: 'https://client.example/contact', title: 'Contact', audited: true, passes: 20, violations: [], incomplete: [] },
    { url: 'https://client.example/panier', title: '', audited: false, error: 'HTTP 500', passes: 0, violations: [], incomplete: [] },
  ],
};
