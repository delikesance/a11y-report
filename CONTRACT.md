# Contrat entre modules (ESM, Node 22, aucun autre dépendance que playwright et @axe-core/playwright)

## src/scan.js
`export async function scanPages(urls: string[]): Promise<Scan>`
Scan = `{ generatedAt: string(ISO), pages: Page[] }`
Page = `{ url, title, violations: Violation[], passes: number, incomplete: Violation[], error?: string }` (le nombre de nœuds incomplets = `incomplete.length`)
Violation = `{ id, impact: 'critical'|'serious'|'moderate'|'minor', help, description, helpUrl, tags: string[], nodes: { html, target: string, failureSummary }[] }`
Une page injoignable donne `error` rempli et listes vides, sans lever d'exception. Navigateur: chromium headless de playwright, axe-core WCAG 2.0/2.1/2.2 A+AA + best-practice.

## src/rules-fr.js
`export function describeRule(id): { titre, pourquoi, correction, avant, apres, minutesParOccurrence: number, rgaa: string }` (tout en français; id inconnu => texte générique construit sans lever d'exception)
`export const IMPACT_FR = { critical:'Critique', serious:'Majeur', moderate:'Modéré', minor:'Mineur' }`
`export const IMPACT_ORDER = ['critical','serious','moderate','minor']`

## src/report.js
`export function buildReportHtml(scan: Scan, branding: Branding): string` (HTML autonome, CSS inline, A4 imprimable, français)
`export async function renderPdf(html: string, outPath: string): Promise<void>` (playwright, format A4, printBackground, pied de page numéroté)
Branding = `{ agency: string, client: string, logoPath?: string, primaryColor?: '#rrggbb', accentColor?: '#rrggbb', contact?: string, date?: string }`
Le PDF ne mentionne JAMAIS d'autre marque que celle de l'agence.

## src/cli.js
`node src/cli.js <url...> --client "X" --agency "Y" [--logo f.png] [--color #hex] [--contact "..."] [--out rapport.pdf] [--branding b.json] [--from-json scan.json] [--save-json scan.json]`
Sans URL et sans --from-json: affiche l'aide, code 1.
