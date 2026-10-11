import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  badge,
  brandColor,
  DEFAULT_PRIMARY,
  escapeHtml,
  formatDuration,
  renderLogo,
  SNIPPET_MAX_LENGTH,
  truncate,
} from "../src/report/shared.js";

test("escapeHtml échappe les caractères spéciaux et tolère les valeurs absentes", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  assert.equal(escapeHtml(undefined), "");
  assert.equal(escapeHtml(42), "42");
});

test("brandColor accepte uniquement un hexadécimal à six chiffres", () => {
  assert.equal(brandColor("#AABBCC", DEFAULT_PRIMARY), "#AABBCC");
  assert.equal(brandColor("red", DEFAULT_PRIMARY), DEFAULT_PRIMARY);
  assert.equal(brandColor(undefined, DEFAULT_PRIMARY), DEFAULT_PRIMARY);
});

test("truncate coupe au-delà de la limite et laisse le reste intact", () => {
  const long = "a".repeat(SNIPPET_MAX_LENGTH + 10);
  assert.equal(truncate(long), `${"a".repeat(SNIPPET_MAX_LENGTH)}…`);
  assert.equal(truncate("court"), "court");
});

test("badge affiche le libellé français de l'impact", () => {
  assert.equal(badge("critical"), '<span class="badge critical">Critique</span>');
});

test("formatDuration exprime les minutes en heures au-delà de 60", () => {
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(125), "2 h 05 min");
});

test("renderLogo retourne une chaîne vide sans logo", () => {
  assert.equal(renderLogo(undefined, "Agence"), "");
});

test("renderLogo encode le fichier en data URI selon son extension", () => {
  const dir = mkdtempSync(join(tmpdir(), "shared-logo-"));
  const png = join(dir, "logo.PNG");
  writeFileSync(png, Buffer.from("png-bytes"));
  const html = renderLogo(png, "Agence & Co");
  assert.equal(
    html,
    `<img class="logo" alt="Agence &amp; Co" src="data:image/png;base64,${Buffer.from("png-bytes").toString("base64")}">`,
  );
});

test("renderLogo utilise un type générique pour une extension inconnue", () => {
  const dir = mkdtempSync(join(tmpdir(), "shared-logo-"));
  const file = join(dir, "logo.bmp");
  writeFileSync(file, Buffer.from("x"));
  assert.match(renderLogo(file, "A"), /src="data:application\/octet-stream;base64,/);
});
