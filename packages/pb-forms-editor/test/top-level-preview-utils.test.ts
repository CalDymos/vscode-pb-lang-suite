import test from "node:test";
import assert from "node:assert/strict";
import {
  canEditToolBarTooltip,
  getDefaultToolBarInsertId,
  getStatusBarPreviewInsertArgs,
  getToolBarPreviewInsertArgs,
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
