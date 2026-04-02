import test from "node:test";
import assert from "node:assert/strict";
import { getTopLevelSelectedImageInspectorConfig } from "../src/core/toplevel/image-inspector";

test("selected menu entry keeps direct CurrentImage editing with the single Select button path", () => {
  const config = getTopLevelSelectedImageInspectorConfig("menuEntry");
  assert.equal(config.changeImageButtonLabel, "Select");
  assert.equal(config.showExpertActions, false);
  assert.equal(config.showClearAction, false);
  assert.equal(config.showImageJumpAction, false);
  assert.equal(config.currentImageEditable, true);
  assert.match(config.currentImageTitle, /Edit|Select/i);
  assert.equal(config.currentImageHint, undefined);
});

test("selected toolbar entry keeps the original image-input row plus the single Select button path", () => {
  const config = getTopLevelSelectedImageInspectorConfig("toolBarEntry");
  assert.equal(config.changeImageButtonLabel, "Select");
  assert.equal(config.showExpertActions, false);
  assert.equal(config.showClearAction, false);
  assert.equal(config.showImageJumpAction, false);
  assert.equal(config.currentImageEditable, true);
  assert.match(config.currentImageTitle, /Edit|Select/i);
});

test("selected statusbar field keeps direct CurrentImage editing but uses only one ChangeImage button", () => {
  const config = getTopLevelSelectedImageInspectorConfig("statusBarField");
  assert.equal(config.changeImageButtonLabel, "Select");
  assert.equal(config.showExpertActions, false);
  assert.equal(config.showClearAction, false);
  assert.equal(config.showImageJumpAction, false);
  assert.equal(config.currentImageEditable, true);
  assert.match(config.currentImageTitle, /Edit or rebind/i);
});
