import test from "node:test";
import assert from "node:assert/strict";

import {
  createPreferencesStore,
  resolveBrowserLocale
} from "../../assets/js/core/preferences.js";

function createStore(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test("uses French only for French browser locales", () => {
  assert.equal(resolveBrowserLocale("fr-CA"), "fr");
  assert.equal(resolveBrowserLocale("en-GB"), "en");
  assert.equal(resolveBrowserLocale(undefined), "en");
});

test("persists valid preference changes locally", () => {
  const store = createStore();
  const preferences = createPreferencesStore(store, "en");

  assert.deepEqual(preferences.get(), {
    locale: "en",
    humourTone: "safe",
    onboardingCompleted: false
  });
  assert.deepEqual(preferences.update({ locale: "fr", humourTone: "playful", onboardingCompleted: true }), {
    locale: "fr",
    humourTone: "playful",
    onboardingCompleted: true
  });
  assert.deepEqual(createPreferencesStore(store, "en").get(), {
    locale: "fr",
    humourTone: "playful",
    onboardingCompleted: true
  });
});

test("falls back safely when persisted preferences do not match the current schema", () => {
  const preferences = createPreferencesStore(
    createStore({ "chutzi-preferences-v1": JSON.stringify({ locale: "es" }) }),
    "fr"
  );

  assert.deepEqual(preferences.get(), {
    locale: "fr",
    humourTone: "safe",
    onboardingCompleted: false
  });
});
