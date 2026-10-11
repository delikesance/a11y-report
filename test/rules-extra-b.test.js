import { test } from "node:test";
import assert from "node:assert/strict";
import { EXTRA_B } from "../src/rules/extra-b.js";

const TEXT_FIELDS = ["titre", "explication", "impactUtilisateur"];
const CORRECTIF_FIELDS = ["texte", "avant", "apres"];

test("EXTRA_B couvre les 23 règles attribuées", () => {
  assert.equal(Object.keys(EXTRA_B).length, 23);
});

for (const [id, rule] of Object.entries(EXTRA_B)) {
  test(`${id} : fiche complète`, () => {
    for (const field of TEXT_FIELDS) {
      assert.ok(rule[field]?.trim(), `${field} vide`);
    }
    for (const field of CORRECTIF_FIELDS) {
      assert.ok(rule.correctif?.[field]?.trim(), `correctif.${field} vide`);
    }
    assert.ok(Array.isArray(rule.rgaa), "rgaa doit être un tableau");
    assert.ok(Array.isArray(rule.wcag), "wcag doit être un tableau");
    assert.ok(Number.isInteger(rule.minutesParOccurrence) && rule.minutesParOccurrence > 0, "minutesParOccurrence invalide");
  });
}
