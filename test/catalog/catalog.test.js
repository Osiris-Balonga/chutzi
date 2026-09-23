import test from "node:test";
import assert from "node:assert/strict";

import { getEligibleJokes, getSafeFallback } from "../../assets/js/catalog/catalog.js";
import { JOKE_CATALOG } from "../../assets/js/catalog/jokes.js";
import { isSafeText, isVettedJoke } from "../../assets/js/catalog/safety.js";

test("catalog records are explicitly approved and safe", () => {
  assert.equal(JOKE_CATALOG.length, 36);
  assert.equal(JOKE_CATALOG.every(isVettedJoke), true);
});

test("each locale has a balanced catalog for every exact tone", () => {
  for (const locale of ["en", "fr"]) {
    for (const tone of ["safe", "playful", "mischievous"]) {
      const exactToneCount = JOKE_CATALOG.filter((joke) => joke.locale === locale && joke.tone === tone).length;
      assert.ok(exactToneCount >= 6, `${locale}/${tone} needs at least six jokes`);
      assert.ok(getEligibleJokes(locale, tone).length >= exactToneCount);
    }
  }
});

test("catalog concepts are available in both supported languages", () => {
  const conceptLocales = new Map();
  for (const joke of JOKE_CATALOG) {
    const locales = conceptLocales.get(joke.conceptId) ?? new Set();
    locales.add(joke.locale);
    conceptLocales.set(joke.conceptId, locales);
  }

  assert.equal([...conceptLocales.values()].every((locales) => locales.has("en") && locales.has("fr")), true);
});

test("unknown, malformed, or inappropriate jokes fail closed", () => {
  assert.equal(isVettedJoke({}), false);
  assert.equal(isVettedJoke({
    ...JOKE_CATALOG[0],
    safety: { status: "approved", policyVersion: 1, reviewedAt: "2026-09-23" },
    delivery: "This contains violence."
  }), false);
  assert.equal(isSafeText("A gentle wordplay joke."), true);
  assert.equal(isSafeText("A joke about murder."), false);
});

test("a local safe fallback is available for each locale", () => {
  assert.equal(getSafeFallback("en").tone, "safe");
  assert.equal(getSafeFallback("fr").tone, "safe");
});
