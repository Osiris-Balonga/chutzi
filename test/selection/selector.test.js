import test from "node:test";
import assert from "node:assert/strict";

import { getCooldownLength, createJokeSelector } from "../../assets/js/selection/selector.js";

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

function createJoke(conceptId, locale = "en", tone = "safe") {
  return {
    id: `${conceptId}-${locale}`,
    conceptId,
    locale,
    tone,
    setup: `Setup for ${conceptId}`,
    delivery: `Delivery for ${conceptId}`,
    safety: { status: "approved", policyVersion: 1, reviewedAt: "2026-09-23" }
  };
}

test("computes an adaptive cooldown without exhausting tiny pools", () => {
  assert.equal(getCooldownLength(1), 0);
  assert.equal(getCooldownLength(2), 1);
  assert.equal(getCooldownLength(6), 3);
  assert.equal(getCooldownLength(99), 8);
});

test("does not replay the last concept when an alternative exists", () => {
  const catalog = [createJoke("one"), createJoke("two"), createJoke("three")];
  const selector = createJokeSelector({ store: createStore(), catalog, random: () => 0 });

  const first = selector.next({ locale: "en", tone: "safe" });
  const second = selector.next({ locale: "en", tone: "safe" });

  assert.notEqual(second.conceptId, first.conceptId);
});

test("delivers the only eligible joke when a small pool cannot avoid a repeat", () => {
  const onlyJoke = createJoke("only");
  const selector = createJokeSelector({ store: createStore(), catalog: [onlyJoke], random: () => 0 });

  assert.equal(selector.next({ locale: "en", tone: "safe" }).conceptId, "only");
  assert.equal(selector.next({ locale: "en", tone: "safe" }).conceptId, "only");
});

test("keeps concept history across a language switch", () => {
  const catalog = [
    createJoke("shared", "en"),
    createJoke("alternative", "en"),
    createJoke("shared", "fr"),
    createJoke("alternative", "fr")
  ];
  const selector = createJokeSelector({ store: createStore(), catalog, random: () => 0 });

  assert.equal(selector.next({ locale: "en", tone: "safe" }).conceptId, "shared");
  assert.equal(selector.next({ locale: "fr", tone: "safe" }).conceptId, "alternative");
});

test("persists bounded history and uses seeded randomness deterministically", () => {
  const store = createStore();
  const catalog = Array.from({ length: 60 }, (_, index) => createJoke(`joke-${index}`));
  const selector = createJokeSelector({ store, catalog, random: () => 0.999 });

  for (let index = 0; index < 60; index += 1) {
    selector.next({ locale: "en", tone: "safe" });
  }

  assert.ok(selector.getHistory().recentConceptIds.length <= 48);
  const reloadedSelector = createJokeSelector({ store, catalog, random: () => 0.999 });
  assert.equal(reloadedSelector.getHistory().recentConceptIds.length, selector.getHistory().recentConceptIds.length);
});
