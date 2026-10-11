export const REPORT_CSS = `
:root{--impact-critical:#8b0000;--impact-serious:#a33a00;--impact-moderate:#7a5a00;--impact-minor:#2f4f6f;}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--impact-critical:#ff8a8a;--impact-serious:#ffb27a;--impact-moderate:#f0d070;--impact-minor:#9cc3e6;}}
:root[data-theme="dark"]{--impact-critical:#ff8a8a;--impact-serious:#ffb27a;--impact-moderate:#f0d070;--impact-minor:#9cc3e6;}
*,*::before,*::after{box-sizing:border-box;}
body{margin:0 auto;max-width:960px;padding:var(--space-4);font:var(--size-base)/1.5 var(--font-sans);color:var(--ink);background:var(--paper);}
h1{color:var(--primary);font-size:var(--size-2xl);line-height:1.2;}
h2{color:var(--primary);font-size:var(--size-xl);border-bottom:2px solid var(--accent);padding-bottom:var(--space-1);margin-top:var(--space-8);}
h3{font-size:var(--size-lg);margin-bottom:var(--space-1);}
a{color:var(--primary);}
.skip-link{position:absolute;left:-9999px;top:auto;}
.skip-link:focus{left:var(--space-4);top:var(--space-4);z-index:1;background:var(--paper);color:var(--ink);padding:var(--space-2) var(--space-3);border:2px solid var(--accent);border-radius:var(--radius-sm);}
a:focus-visible,button:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--accent);outline-offset:2px;}
.table-wrap{overflow-x:auto;margin:var(--space-2) 0;}
table{width:100%;min-width:36rem;border-collapse:collapse;font-size:var(--size-sm);}
th,td{text-align:left;vertical-align:top;padding:var(--space-2);border-bottom:1px solid var(--border);overflow-wrap:anywhere;}
caption{text-align:left;font-weight:var(--weight-semibold);padding:var(--space-1) 0;}
dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:var(--space-1) var(--space-4);}
dt{font-weight:var(--weight-semibold);color:var(--muted);}
dd{margin:0;}
.badge{display:inline-block;padding:0 var(--space-2);border:1px solid currentColor;border-radius:var(--radius-sm);font-weight:var(--weight-semibold);font-size:var(--size-sm);}
.badge.critical{color:var(--impact-critical);}
.badge.serious{color:var(--impact-serious);}
.badge.moderate{color:var(--impact-moderate);}
.badge.minor{color:var(--impact-minor);}
code{font-family:var(--font-mono);font-size:var(--size-sm);overflow-wrap:anywhere;}
.muted{color:var(--muted);}
.problem{border-top:1px solid var(--border);padding-top:var(--space-2);margin-top:var(--space-3);}
@media (max-width:600px){dl{grid-template-columns:minmax(0,1fr);}dd{margin-bottom:var(--space-2);}}
@media print{body{max-width:none;}h2{break-after:avoid;}table,.problem{break-inside:avoid;}.table-wrap{overflow:visible;}table{min-width:0;}}
`;
