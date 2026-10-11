import { test } from "node:test";
import assert from "node:assert/strict";
import { describeRule, IMPACT_FR, IMPACT_ORDER } from "../src/rules-fr.js";

const KNOWN_IDS = [
  "image-alt", "input-image-alt", "role-img-alt", "svg-img-alt", "object-alt", "area-alt",
  "server-side-image-map", "button-name", "input-button-name", "link-name", "label", "select-name",
  "aria-input-field-name", "form-field-multiple-labels", "color-contrast", "link-in-text-block",
  "html-has-lang", "html-lang-valid", "valid-lang", "html-xml-lang-mismatch", "document-title",
  "heading-order", "empty-heading", "page-has-heading-one", "landmark-one-main", "landmark-unique",
  "landmark-main-is-top-level", "landmark-no-duplicate-main", "region", "skip-link", "bypass",
  "aria-valid-attr", "aria-valid-attr-value", "aria-roles", "aria-required-attr", "aria-allowed-attr",
  "aria-hidden-focus", "aria-required-children", "aria-required-parent", "aria-command-name",
  "aria-toggle-field-name", "nested-interactive", "duplicate-id-aria", "frame-title",
  "frame-title-unique", "list", "listitem", "definition-list", "meta-viewport", "meta-refresh",
  "blink", "tabindex", "scope-attr-valid", "td-headers-attr", "th-has-data-cells",
  "table-duplicate-name", "video-caption", "no-autoplay-audio", "target-size",
];

const TEXT_FIELDS = ["titre", "pourquoi", "correction", "avant", "apres", "rgaa"];

test("au moins 45 règles connues", () => {
  assert.ok(KNOWN_IDS.length >= 45);
});

for (const id of KNOWN_IDS) {
  test(`${id} : fiche complète`, () => {
    const rule = describeRule(id);
    for (const field of TEXT_FIELDS) {
      assert.ok(rule[field]?.trim(), `${field} vide`);
    }
    assert.ok(rule.minutesParOccurrence > 0, "minutesParOccurrence invalide");
  });
}

test("id inconnu : texte générique sans exception", () => {
  const rule = describeRule("regle-inexistante");
  assert.ok(rule.titre.includes("regle-inexistante"));
  for (const field of [...TEXT_FIELDS, "correction"]) {
    assert.ok(rule[field]?.trim(), `${field} vide`);
  }
  assert.ok(rule.minutesParOccurrence > 0);
});

test("id héritant d'Object.prototype : fallback", () => {
  assert.ok(describeRule("constructor").titre.includes("constructor"));
});

test("IMPACT_FR et IMPACT_ORDER couvrent les quatre impacts", () => {
  assert.deepEqual(IMPACT_ORDER, ["critical", "serious", "moderate", "minor"]);
  for (const impact of IMPACT_ORDER) {
    assert.ok(IMPACT_FR[impact]);
  }
});
