import test from "node:test";
import assert from "node:assert/strict";

import { addFeedback, createEmptyProfile, getDominantTag, getTagWeights } from "../../assets/js/profile/profile.js";

function feedback(conceptId, rating, tags) {
  return { conceptId, rating, tags, createdAt: 1 };
}

test("updates an existing concept feedback instead of double-counting it", () => {
  const first = addFeedback(createEmptyProfile(), feedback("calendar", "love", ["wordplay"]));
  const updated = addFeedback(first, feedback("calendar", "skip", ["wordplay"]));

  assert.equal(updated.feedback.length, 1);
  assert.equal(updated.feedback[0].rating, "skip");
});

test("builds bounded, interpretable tag weights", () => {
  const profile = [
    feedback("one", "love", ["gentle-spooky"]),
    feedback("two", "like", ["gentle-spooky"]),
    feedback("three", "skip", ["wordplay"])
  ].reduce(addFeedback, createEmptyProfile());

  const weights = getTagWeights(profile);
  assert.ok(weights["gentle-spooky"] > 0);
  assert.ok(weights.wordplay < 0);
  assert.equal(getDominantTag(profile), "gentle-spooky");
});
