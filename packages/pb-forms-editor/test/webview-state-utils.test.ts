import test from "node:test";
import assert from "node:assert/strict";

import {
  hasRectChanged,
  retainPanelActiveItems,
  syncPanelActiveItemsForSelection
} from "../src/core/webview-state-utils";

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


test("syncs panel active items so hierarchy-selected gadgets become visible inside panel tabs", () => {
  const previous = new Map<string, number>([["outer-panel", 0], ["inner-panel", 0]]);

  const synced = syncPanelActiveItemsForSelection(previous, [
    { id: "outer-panel", kind: "PanelGadget", items: [{}, {}, {}] },
    { id: "container", kind: "ContainerGadget", parentId: "outer-panel", parentItem: 2 },
    { id: "inner-panel", kind: "PanelGadget", parentId: "container", items: [{}, {}] },
    { id: "leaf", kind: "ButtonGadget", parentId: "inner-panel", parentItem: 1 }
  ], "leaf");

  assert.deepEqual(Array.from(synced.entries()), [
    ["outer-panel", 2],
    ["inner-panel", 1]
  ]);
});

test("keeps retained panel state unchanged when selected gadget is missing", () => {
  const previous = new Map<string, number>([["panel-a", 1]]);

  const synced = syncPanelActiveItemsForSelection(previous, [
    { id: "panel-a", kind: "PanelGadget", items: [{}, {}] },
    { id: "button-a", kind: "ButtonGadget", parentId: "panel-a", parentItem: 0 }
  ], "missing-gadget");

  assert.deepEqual(Array.from(synced.entries()), [["panel-a", 1]]);
});
