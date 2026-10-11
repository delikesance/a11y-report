export const REPORT_CSS = `
:root{--ink:#1d1d1f;--muted:#55565b;--paper:#ffffff;--line:#d8d9de;--critical:#8b0000;--serious:#a33a00;--moderate:#7a5a00;--minor:#2f4f6f;}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--ink:#f2f2f4;--muted:#b9bac1;--paper:#141416;--line:#3a3b40;--critical:#ff8a8a;--serious:#ffb27a;--moderate:#f0d070;--minor:#9cc3e6;}}
:root[data-theme="dark"]{--ink:#f2f2f4;--muted:#b9bac1;--paper:#141416;--line:#3a3b40;--critical:#ff8a8a;--serious:#ffb27a;--moderate:#f0d070;--minor:#9cc3e6;}
body{margin:0 auto;max-width:960px;padding:16px;font:16px/1.5 system-ui,sans-serif;color:var(--ink);background:var(--paper);}
h1{color:var(--primary);font-size:1.8rem;}
h2{color:var(--primary);border-bottom:2px solid var(--accent);padding-bottom:4px;margin-top:2rem;}
h3{font-size:1.15rem;margin-bottom:0.25rem;}
.skip-link{position:absolute;left:-9999px;}
.skip-link:focus{left:16px;top:16px;background:var(--paper);color:var(--ink);padding:8px;}
a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:2px;}
table{width:100%;border-collapse:collapse;margin:0.5rem 0;font-size:0.92rem;}
th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid var(--line);overflow-wrap:anywhere;}
caption{text-align:left;font-weight:600;padding:4px 0;}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;}
dt{font-weight:600;color:var(--muted);}
dd{margin:0;}
.badge{display:inline-block;padding:1px 8px;border:1px solid currentColor;border-radius:4px;font-weight:600;font-size:0.85rem;}
.badge.critical{color:var(--critical);}
.badge.serious{color:var(--serious);}
.badge.moderate{color:var(--moderate);}
.badge.minor{color:var(--minor);}
code{font-size:0.85rem;overflow-wrap:anywhere;}
.muted{color:var(--muted);}
.problem{border-top:1px solid var(--line);padding-top:8px;margin-top:12px;}
@media (max-width:600px){dl{grid-template-columns:1fr;}}
@media print{body{max-width:none;}h2{break-after:avoid;}table,.problem{break-inside:avoid;}}
`;
