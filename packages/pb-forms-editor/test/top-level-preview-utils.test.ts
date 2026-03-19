import test from "node:test";
import assert from "node:assert/strict";
import {
  canEditToolBarTooltip,
  getDefaultMenuItemInsertArgs,
  getDefaultToolBarInsertId,
  getDirectMenuChildIndices,
  getMenuAncestorChain,
  getMenuEntryBlockEndIndex,
  getMenuEntryLevel,
  getMenuEntrySourceLine,
  getMenuFlyoutPanelRect,
  getMenuPreviewLabel,
  getPredictedMenuEntryMoveIndex,
  getStatusBarFieldWidths,
  getStatusBarPreviewInsertArgs,
  getToolBarPreviewInsertArgs,
  hasPbFlag,
  unquotePbString,
  getVisibleToolBarEntryCount,
  isBoundToolBarTooltipEntry,
  shouldShowToolBarStructureEntry
} from "../src/core/topLevelPreviewUtils";

test("binds toolbar tooltips to the previous matching toolbar entry", () => {
  const toolBar = {
    entries: [
      { kind: "ToolBarImageButton", idRaw: "#TbOpen" },
      { kind: "ToolBarToolTip", idRaw: "#TbOpen" },
      { kind: "ToolBarSeparator" },
      { kind: "ToolBarToolTip", idRaw: "#TbOther" }
    ]
  };

  assert.equal(isBoundToolBarTooltipEntry(toolBar, 1), true);
  assert.equal(isBoundToolBarTooltipEntry(toolBar, 3), false);
});

test("filters bound toolbar tooltip rows from the visible structure count", () => {
  const toolBar = {
    entries: [
      { kind: "ToolBarImageButton", idRaw: "#TbOpen" },
      { kind: "ToolBarToolTip", idRaw: "#TbOpen" },
      { kind: "ToolBarSeparator" },
      { kind: "ToolBarToolTip", idRaw: "#TbOther" }
    ]
  };

  assert.equal(shouldShowToolBarStructureEntry(toolBar, 0), true);
  assert.equal(shouldShowToolBarStructureEntry(toolBar, 1), false);
  assert.equal(shouldShowToolBarStructureEntry(toolBar, 2), true);
  assert.equal(shouldShowToolBarStructureEntry(toolBar, 3), true);
  assert.equal(getVisibleToolBarEntryCount(toolBar), 3);
});

test("builds default menu labels, levels and insert args", () => {
  const menu = {
    entries: [
      { kind: "MenuTitle", textRaw: '"File"', level: 0 },
      { kind: "OpenSubMenu", textRaw: '"Export"', level: 1 },
      { kind: "MenuItem", text: "PNG", level: 2 },
      { kind: "CloseSubMenu", level: 1 }
    ]
  };

  assert.equal(getMenuPreviewLabel(menu.entries[0]), "File");
  assert.equal(getMenuPreviewLabel(menu.entries[2]), "PNG");
  assert.equal(getMenuPreviewLabel(menu.entries[3]), "");
  assert.equal(getMenuEntryLevel(menu.entries[1]), 1);
  assert.equal(getMenuEntryLevel(undefined), 0);
  assert.deepEqual(getDefaultMenuItemInsertArgs(menu), {
    idRaw: "#MenuItem_4",
    textRaw: '"MenuItem4"'
  });
});

test("resolves direct menu children and ancestor chains from entry levels", () => {
  const menu = {
    entries: [
      { kind: "MenuTitle", textRaw: '"File"', level: 0, source: { line: 10 } },
      { kind: "OpenSubMenu", textRaw: '"Export"', level: 1, source: { line: 11 } },
      { kind: "MenuItem", textRaw: '"PNG"', level: 2, source: { line: 12 } },
      { kind: "MenuItem", textRaw: '"JPG"', level: 2, source: { line: 13 } },
      { kind: "CloseSubMenu", level: 1, source: { line: 14 } },
      { kind: "MenuItem", textRaw: '"Quit"', level: 1, source: { line: 15 } }
    ]
  };

  assert.deepEqual(getDirectMenuChildIndices(menu, 1), [2, 3]);
  assert.deepEqual(getMenuAncestorChain(menu, 3), [0, 1, 3]);
  assert.equal(getMenuEntrySourceLine(menu, 5), 15);
  assert.equal(getMenuEntrySourceLine(menu, 99), undefined);
});

test("predicts menu block end indices and move targets for subtree moves", () => {
  const menu = {
    entries: [
      { kind: "MenuTitle", textRaw: '"File"', level: 0 },
      { kind: "OpenSubMenu", textRaw: '"Export"', level: 1 },
      { kind: "MenuItem", textRaw: '"PNG"', level: 2 },
      { kind: "MenuItem", textRaw: '"JPG"', level: 2 },
      { kind: "CloseSubMenu", level: 1 },
      { kind: "MenuItem", textRaw: '"Quit"', level: 1 },
      { kind: "MenuTitle", textRaw: '"Edit"', level: 0 }
    ]
  };

  assert.equal(getMenuEntryBlockEndIndex(menu.entries, 1), 3);
  assert.equal(getPredictedMenuEntryMoveIndex(menu, 1, 6, "after"), 4);
  assert.equal(getPredictedMenuEntryMoveIndex(menu, 5, 0, "before"), 0);
  assert.equal(getPredictedMenuEntryMoveIndex(menu, 1, 2, "before"), null);
});

test("builds default toolbar insert ids and preview insert args", () => {
  const toolBar = {
    entries: [
      { kind: "ToolBarImageButton", idRaw: "#TbOpen" },
      { kind: "ToolBarToolTip", idRaw: "#TbOpen" },
      { kind: "ToolBarSeparator" }
    ]
  };

  assert.equal(getDefaultToolBarInsertId(toolBar), "#Toolbar_2");
  assert.deepEqual(getToolBarPreviewInsertArgs(toolBar, "button"), {
    kind: "ToolBarImageButton",
    idRaw: "#Toolbar_2",
    iconRaw: "0"
  });
  assert.deepEqual(getToolBarPreviewInsertArgs(toolBar, "toggle"), {
    kind: "ToolBarImageButton",
    idRaw: "#Toolbar_2",
    iconRaw: "0",
    toggle: true
  });
  assert.deepEqual(getToolBarPreviewInsertArgs(toolBar, "separator"), {
    kind: "ToolBarSeparator"
  });
});

test("exposes editable tooltip rows only for real toolbar command entries", () => {
  assert.equal(canEditToolBarTooltip({ kind: "ToolBarImageButton", idRaw: "#TbOpen" }), true);
  assert.equal(canEditToolBarTooltip({ kind: "ToolBarSeparator", idRaw: "#TbSep" }), false);
  assert.equal(canEditToolBarTooltip({ kind: "ToolBarToolTip", idRaw: "#TbOpen" }), false);
  assert.equal(canEditToolBarTooltip({ kind: "ToolBarImageButton", idRaw: "   " }), false);
});

test("builds default statusbar preview insert args", () => {
  assert.deepEqual(getStatusBarPreviewInsertArgs("image"), {
    widthRaw: "96",
    imageRaw: "0",
    flagsRaw: "#PB_StatusBar_Raised"
  });
  assert.deepEqual(getStatusBarPreviewInsertArgs("label"), {
    widthRaw: "120",
    textRaw: '"StatusBarField"'
  });
  assert.deepEqual(getStatusBarPreviewInsertArgs("progress"), {
    widthRaw: "120",
    progressBar: true,
    progressRaw: "50"
  });
});


test("exposes pb-style flags, string unquoting and top-level preview widths", () => {
  assert.equal(hasPbFlag("#PB_StatusBar_Center | #PB_StatusBar_Raised", "#PB_StatusBar_Center"), true);
  assert.equal(hasPbFlag("#PB_StatusBar_Raised", "#PB_StatusBar_Center"), false);
  assert.equal(unquotePbString('  "Status"  '), "Status");
  assert.equal(unquotePbString("Status"), "Status");

  assert.deepEqual(getStatusBarFieldWidths({
    fields: [
      { widthRaw: "60" },
      { widthRaw: "#PB_Ignore" },
      { widthRaw: "120" },
      { widthRaw: "VariableWidth" }
    ]
  }, 320), [60, 70, 120, 70]);
});

test("computes flyout menu panel rectangles from visible child content", () => {
  const menu = {
    entries: [
      { kind: "MenuTitle", textRaw: '"File"', level: 0 },
      { kind: "OpenSubMenu", textRaw: '"Export"', level: 1 },
      { kind: "MenuItem", textRaw: '"PNG"', shortcut: "Ctrl+P", level: 2 },
      { kind: "MenuBar", level: 2 },
      { kind: "MenuItem", textRaw: '"JPG"', level: 2 },
      { kind: "CloseSubMenu", level: 1 }
    ]
  };

  assert.deepEqual(
    getMenuFlyoutPanelRect(menu, 1, { x: 100, y: 50, w: 0, h: 0 }, (text) => text.length * 6),
    { x: 100, y: 50, w: 118, h: 72 }
  );
});
