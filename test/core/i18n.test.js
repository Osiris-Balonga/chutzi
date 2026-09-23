import test from "node:test";
import assert from "node:assert/strict";

import { translate } from "../../assets/js/core/i18n.js";

test("returns translated interface strings for both supported locales", () => {
  assert.equal(translate("en", "welcome.start"), "Start");
  assert.equal(translate("fr", "welcome.start"), "Commencer");
});

test("interpolates translated accessibility labels", () => {
  assert.equal(
    translate("en", "audio.openLabel", { music: "on", effects: "off" }),
    "Open Chutzi settings, music on, sound effects off"
  );
});
