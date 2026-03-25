import test from "node:test";
import assert from "node:assert/strict";
import { resolveTopLevelCanvasContextMenuActions } from "../src/core/topLevelContextMenuUtils";

test("menu entry context action uses Delete MenuItem label and existing delete payload", () => {
  const actions = resolveTopLevelCanvasContextMenuActions({
    selection: { kind: "menuEntry", menuId: "#Menu_0", entryIndex: 0 },
    menus: [{ id: "#Menu_0", entries: [{ kind: "MenuItem", source: { line: 42 } }] }]
  });

  if (!actions) throw new Error("Expected menu entry actions");
  assert.equal(actions.length, 1);
  const action = actions[0]!;
  if (action.kind !== "deleteMenuEntry") throw new Error(`Unexpected action kind: ${action.kind}`);
  assert.equal(action.label, "Delete MenuItem…");
  assert.equal(action.enabled, true);
  assert.equal(action.sourceLine, 42);
  assert.equal(action.confirmLabel, "Delete Entry");
  assert.match(action.message, /menu '#Menu_0'/i);
});

test("toolbar entry context action uses Delete ToolbarItem label and disables unsourced entries", () => {
  const actions = resolveTopLevelCanvasContextMenuActions({
    selection: { kind: "toolBarEntry", toolBarId: "#ToolBar_0", entryIndex: 0 },
    toolbars: [{ id: "#ToolBar_0", entries: [{ kind: "ToolBarImageButton" }] }]
  });

  if (!actions) throw new Error("Expected toolbar entry actions");
  assert.equal(actions.length, 1);
  const action = actions[0]!;
  if (action.kind !== "deleteToolBarEntry") throw new Error(`Unexpected action kind: ${action.kind}`);
  assert.equal(action.label, "Delete ToolbarItem…");
  assert.equal(action.enabled, false);
  assert.match(action.title, /source line/i);
});

test("statusbar field context action uses Delete StatusBarField label and field confirm text", () => {
  const actions = resolveTopLevelCanvasContextMenuActions({
    selection: { kind: "statusBarField", statusBarId: "#StatusBar_0", fieldIndex: 2 },
    statusbars: [{ id: "#StatusBar_0", fields: [{}, {}, { source: { line: 77 } }] }]
  });

  if (!actions) throw new Error("Expected statusbar field actions");
  assert.equal(actions.length, 1);
  const action = actions[0]!;
  if (action.kind !== "deleteStatusBarField") throw new Error(`Unexpected action kind: ${action.kind}`);
  assert.equal(action.label, "Delete StatusBarField…");
  assert.equal(action.enabled, true);
  assert.equal(action.sourceLine, 77);
  assert.equal(action.confirmLabel, "Delete Field");
  assert.match(action.message, /field 2/i);
});

test("toolbar root context action uses Delete Toolbar label", () => {
  const actions = resolveTopLevelCanvasContextMenuActions({
    selection: { kind: "toolbar", id: "#ToolBar_0" },
    toolbars: [{ id: "#ToolBar_0", entries: [] }]
  });

  if (!actions) throw new Error("Expected toolbar root actions");
  assert.equal(actions.length, 1);
  const action = actions[0]!;
  if (action.kind !== "deleteToolBar") throw new Error(`Unexpected action kind: ${action.kind}`);
  assert.equal(action.label, "Delete Toolbar…");
  assert.equal(action.enabled, true);
});

test("toolbar add button popup exposes Add Button, Add Toggle and Add Separator", () => {
  const actions = resolveTopLevelCanvasContextMenuActions({
    selection: { kind: "toolBarAddButton", toolBarId: "#ToolBar_0" },
    toolbars: [{ id: "#ToolBar_0", entries: [] }]
  });

  if (!actions) throw new Error("Expected toolbar add actions");
  assert.deepEqual(actions.map(action => action.label), ["Add Button", "Add Toggle", "Add Separator"]);
});

test("statusbar add button popup exposes Add Image, Add Label and Add ProgressBar", () => {
  const actions = resolveTopLevelCanvasContextMenuActions({
    selection: { kind: "statusBarAddButton", statusBarId: "#StatusBar_0" },
    statusbars: [{ id: "#StatusBar_0", fields: [] }]
  });

  if (!actions) throw new Error("Expected statusbar add actions");
  assert.deepEqual(actions.map(action => action.label), ["Add Image", "Add Label", "Add ProgressBar"]);
});
