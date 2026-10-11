import { test } from "node:test";
import assert from "node:assert/strict";
import axe from "axe-core";
import { describeRule } from "../src/rules-fr.js";
import { HORS_RGAA, HORS_RGAA_JUSTIFICATION } from "../src/rules/rgaa-map.js";

const INSTALLED_IDS = axe.getRules().map((rule) => rule.ruleId);
const TEXT_FIELDS = ["titre", "explication", "impactUtilisateur"];
const FALLBACK_MARKERS = ["Non référencé", "—"];

const isFallback = (value) => FALLBACK_MARKERS.includes(value?.trim());
const splitReferences = (joined) => joined.split(", ").filter(Boolean);

test("axe-core expose au moins 105 règles", () => {
  assert.ok(INSTALLED_IDS.length >= 105);
});

test("chaque dérogation « hors RGAA » est justifiée", () => {
  for (const [id, justification] of Object.entries(HORS_RGAA_JUSTIFICATION)) {
    assert.ok(justification?.trim(), `${id} : justification vide`);
    assert.ok(INSTALLED_IDS.includes(id), `${id} : règle axe-core inconnue`);
  }
});

for (const id of INSTALLED_IDS) {
  test(`${id} : couverture complète`, () => {
    const rule = describeRule(id);
    for (const field of TEXT_FIELDS) {
      assert.ok(rule[field]?.trim(), `${field} vide`);
    }
    assert.ok(rule.correctif?.texte?.trim(), "correctif.texte vide");
    assert.ok(rule.correctif?.code?.trim() && !isFallback(rule.correctif.code), "correctif.code absent");
    assert.ok(Number.isInteger(rule.minutesParOccurrence) && rule.minutesParOccurrence > 0, "minutesParOccurrence invalide");

    const references = splitReferences(rule.rgaa ?? "");
    if (references.includes(HORS_RGAA)) {
      assert.ok(HORS_RGAA_JUSTIFICATION[id], "dérogation hors RGAA sans justification");
    } else {
      assert.ok(references.length > 0 && references.every((ref) => !isFallback(ref)), "rgaa[] vide ou non référencé");
    }

    const wcag = splitReferences(rule.wcag ?? "");
    assert.ok(wcag.length > 0, "wcag[] vide");
  });
}
