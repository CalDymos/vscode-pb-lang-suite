import test from "node:test";
import assert from "node:assert/strict";
import { getTopLevelSelectedImageInspectorConfig } from "../src/core/topLevelImageInspectorUtils";

test("selected menu entry ChangeImage stays on the original single-button path", () => {
  const config = getTopLevelSelectedImageInspectorConfig("menuEntry");
  assert.equal(config.changeImageButtonLabel, "Select");
  assert.equal(config.showExpertActions, false);
  assert.equal(config.showClearAction, false);
  assert.equal(config.showImageJumpAction, false);
  assert.equal(config.currentImageEditable, false);
});

test("selected toolbar entry ChangeImage stays on the original single-button path", () => {
  const config = getTopLevelSelectedImageInspectorConfig("toolBarEntry");
  assert.equal(config.changeImageButtonLabel, "Select");
  assert.equal(config.showExpertActions, false);
  assert.equal(config.showClearAction, false);
  assert.equal(config.showImageJumpAction, false);
  assert.equal(config.currentImageEditable, false);
});

test("selected statusbar field keeps direct CurrentImage editing but uses only one ChangeImage button", () => {
  const config = getTopLevelSelectedImageInspectorConfig("statusBarField");
  assert.equal(config.changeImageButtonLabel, "Select");
  assert.equal(config.showExpertActions, false);
  assert.equal(config.showClearAction, false);
  assert.equal(config.showImageJumpAction, false);
  assert.equal(config.currentImageEditable, true);
});
