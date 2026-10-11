import { test } from "node:test";
import assert from "node:assert/strict";
import axe from "axe-core";
import { describeRule } from "../src/rules-fr.js";

const INSTALLED_IDS = axe.getRules().map((rule) => rule.ruleId);
const TEXT_FIELDS = ["titre", "titreFr", "pourquoi", "explication", "impactUtilisateur", "correction", "rgaa", "wcag"];

test("axe-core expose au moins 105 règles", () => {
  assert.ok(INSTALLED_IDS.length >= 105);
});

for (const id of INSTALLED_IDS) {
  test(`${id} : couverture complète`, () => {
    const rule = describeRule(id);
    for (const field of TEXT_FIELDS) {
      assert.ok(rule[field]?.trim(), `${field} vide`);
    }
    assert.ok(rule.correctif?.texte?.trim(), "correctif.texte vide");
    assert.ok(rule.correctif?.code?.trim(), "correctif.code vide");
    assert.ok(Number.isInteger(rule.minutesParOccurrence) && rule.minutesParOccurrence > 0, "minutesParOccurrence invalide");
  });
}
