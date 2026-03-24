import test from "node:test";
import assert from "node:assert/strict";
import { resolveTopLevelCanvasDeleteContextMenuAction } from "../src/core/topLevelContextMenuUtils";

test("menu entry context action uses Delete MenuItem label and existing delete payload", () => {
  const action = resolveTopLevelCanvasDeleteContextMenuAction({
    selection: { kind: "menuEntry", menuId: "#Menu_0", entryIndex: 0 },
    menus: [{ id: "#Menu_0", entries: [{ kind: "MenuItem", source: { line: 42 } }] }]
  });

  assert.ok(action);
  assert.equal(action.kind, "deleteMenuEntry");
  assert.equal(action.label, "Delete MenuItem…");
  assert.equal(action.enabled, true);
  assert.equal(action.sourceLine, 42);
  assert.equal(action.confirmLabel, "Delete Entry");
  assert.match(action.message, /menu '#Menu_0'/i);
});

test("toolbar entry context action uses Delete ToolbarItem label and disables unsourced entries", () => {
  const action = resolveTopLevelCanvasDeleteContextMenuAction({
    selection: { kind: "toolBarEntry", toolBarId: "#ToolBar_0", entryIndex: 0 },
    toolbars: [{ id: "#ToolBar_0", entries: [{ kind: "ToolBarImageButton" }] }]
  });

  assert.ok(action);
  assert.equal(action.kind, "deleteToolBarEntry");
  assert.equal(action.label, "Delete ToolbarItem…");
  assert.equal(action.enabled, false);
  assert.match(action.title, /source line/i);
});

test("statusbar field context action uses Delete StatusBarField label and field confirm text", () => {
  const action = resolveTopLevelCanvasDeleteContextMenuAction({
    selection: { kind: "statusBarField", statusBarId: "#StatusBar_0", fieldIndex: 2 },
    statusbars: [{ id: "#StatusBar_0", fields: [{}, {}, { source: { line: 77 } }] }]
  });

  assert.ok(action);
  assert.equal(action.kind, "deleteStatusBarField");
  assert.equal(action.label, "Delete StatusBarField…");
  assert.equal(action.enabled, true);
  assert.equal(action.sourceLine, 77);
  assert.equal(action.confirmLabel, "Delete Field");
  assert.match(action.message, /field 2/i);
});
