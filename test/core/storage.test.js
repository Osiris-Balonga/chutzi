import test from "node:test";
import assert from "node:assert/strict";

import {
  readStoredValue,
  removeStoredValue,
  writeStoredValue
} from "../../assets/js/core/storage.js";

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

test("writes and reads valid JSON values", () => {
  const store = createStore();
  const isPreference = (value) => Boolean(value) && typeof value === "object" && value.locale === "fr";

  writeStoredValue(store, "preferences", { locale: "fr" });

  assert.deepEqual(readStoredValue(store, "preferences", isPreference), { locale: "fr" });
});

test("fails closed for malformed or invalid stored values", () => {
  const isNumber = (value) => typeof value === "number";

  assert.equal(readStoredValue(createStore({ broken: "{" }), "broken", isNumber), undefined);
  assert.equal(readStoredValue(createStore({ wrong: JSON.stringify("1") }), "wrong", isNumber), undefined);
});

test("removes values without affecting other keys", () => {
  const store = createStore({ first: JSON.stringify(1), second: JSON.stringify(2) });

  removeStoredValue(store, "first");

  assert.equal(store.getItem("first"), null);
  assert.equal(store.getItem("second"), JSON.stringify(2));
});
