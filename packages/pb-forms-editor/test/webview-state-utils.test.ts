import test from "node:test";
import assert from "node:assert/strict";

import {
  hasRectChanged,
  retainPanelActiveItems
} from "../src/core/webviewStateUtils";

test("detects rect changes only when position or size differs", () => {
  const start = { x: 10, y: 20, w: 100, h: 40 };

  assert.equal(hasRectChanged({ x: 10, y: 20, w: 100, h: 40 }, start), false);
  assert.equal(hasRectChanged({ x: 11, y: 20, w: 100, h: 40 }, start), true);
  assert.equal(hasRectChanged({ x: 10, y: 20, w: 101, h: 40 }, start), true);
});

test("retains panel active items only for existing panel gadgets and clamps indices", () => {
  const previous = new Map<string, number>([
    ["panel-a", 3],
    ["panel-b", 1],
    ["deleted-panel", 2],
    ["non-panel", 4]
  ]);

  const retained = retainPanelActiveItems(previous, [
    { id: "panel-a", kind: "PanelGadget", items: [{}, {}] },
    { id: "panel-b", kind: "PanelGadget", items: [{}, {}, {}] },
    { id: "panel-empty", kind: "PanelGadget", items: [] },
    { id: "non-panel", kind: "ButtonGadget", items: [{}, {}] }
  ]);

  assert.deepEqual(Array.from(retained.entries()), [
    ["panel-a", 1],
    ["panel-b", 1]
  ]);
});
