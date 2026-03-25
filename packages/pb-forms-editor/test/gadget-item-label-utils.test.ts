import test from "node:test";
import assert from "node:assert/strict";

import { getPanelInspectorItemLabel } from "../src/core/gadgetItemLabelUtils";

test("formats panel inspector item labels with an explicit tab index prefix", () => {
  assert.equal(getPanelInspectorItemLabel({ text: "Tab 1" }, 0), "[0] Tab 1");
  assert.equal(getPanelInspectorItemLabel({ textRaw: '"Advanced"' }, 2), '[2] "Advanced"');
});

test("keeps panel inspector item labels readable when the tab name is empty", () => {
  assert.equal(getPanelInspectorItemLabel({ text: "" }, 3), "[3]");
  assert.equal(getPanelInspectorItemLabel(undefined, 4), "[4]");
});
