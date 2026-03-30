import test from "node:test";
import assert from "node:assert/strict";
import { ENUM_NAMES, PBFD_SYMBOLS } from "../src/core/model";

test("ENUM_NAMES exposes all top-level enum block names used by the emitter", () => {
  assert.deepEqual(ENUM_NAMES, {
    windows: "FormWindow",
    gadgets: "FormGadget",
    menus: "FormMenu",
    images: "FormImage",
    fonts: "FormFont"
  });
});

test("PBFD_SYMBOLS forwards the complete enum name set to the webview", () => {
  assert.equal(PBFD_SYMBOLS.enumNames.menus, ENUM_NAMES.menus);
  assert.equal(PBFD_SYMBOLS.enumNames.images, ENUM_NAMES.images);
  assert.equal(PBFD_SYMBOLS.enumNames.fonts, ENUM_NAMES.fonts);
});
