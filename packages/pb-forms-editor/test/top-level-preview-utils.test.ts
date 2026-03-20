import test from "node:test";
import assert from "node:assert/strict";
import {
  canEditToolBarTooltip,
  getDefaultMenuItemInsertArgs,
  getDefaultToolBarInsertId,
  getOpenSubMenuBalance,
  getDirectMenuChildIndices,
  getMenuAncestorChain,
  getMenuEntryBlockEndIndex,
  getMenuEntryLevel,
  getMenuEntrySourceLine,
  getMenuEntryMoveTarget,
  getMenuEntryRect,
  getMenuFlyoutPanelRect,
  getMenuFooterRect,
  getMenuPreviewLabel,
  getPredictedMenuEntryMoveIndex,
  getMenuVisibleEntries,
  getStatusBarFieldWidths,
  getStatusBarPreviewInsertArgs,
  resolveMenuFooterHit,
  resolvePreviewRectHit,
  resolvePreviewRectListHit,
  resolveTopLevelChromeHit,
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
  assert.equal(getOpenSubMenuBalance(menu), 0);
  assert.deepEqual(getDefaultMenuItemInsertArgs(menu), {
    idRaw: "#MenuItem_4",
    textRaw: '"MenuItem4"'
  });
});

test("tracks unmatched open submenu balance for root close guards", () => {
  assert.equal(getOpenSubMenuBalance({
    entries: [
      { kind: "MenuTitle", textRaw: '"File"', level: 0 },
      { kind: "OpenSubMenu", textRaw: '"Recent"', level: 1 },
      { kind: "MenuItem", textRaw: '"Last"', level: 2 }
    ]
  }), 1);

  assert.equal(getOpenSubMenuBalance({
    entries: [
      { kind: "CloseSubMenu", level: 0 },
      { kind: "OpenSubMenu", textRaw: '"Recent"', level: 0 },
      { kind: "CloseSubMenu", level: 0 }
    ]
  }), 0);
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
    progressRaw: "0"
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


test("resolves generic preview rect hits for add buttons and footers", () => {
  assert.deepEqual(
    resolvePreviewRectHit({ menuId: "m1", x: 10, y: 20, w: 16, h: 16 }, 18, 28),
    { menuId: "m1", x: 10, y: 20, w: 16, h: 16 }
  );
  assert.equal(resolvePreviewRectHit({ menuId: "m1", x: 10, y: 20, w: 16, h: 16 }, 40, 40), null);
  assert.deepEqual(
    resolvePreviewRectListHit([{ ownerId: "m1", index: 2, x: 30, y: 40, w: 20, h: 12 }], 35, 45),
    { ownerId: "m1", index: 2, x: 30, y: 40, w: 20, h: 12 }
  );
});

test("resolves flyout menu entry hits outside the menu bar rectangle", () => {
  assert.deepEqual(
    resolveTopLevelChromeHit({
      x: 92,
      y: 132,
      windowHit: true,
      menuId: "menu-1",
      menuRect: { x: 20, y: 80, w: 120, h: 22 },
      menuEntryRects: [
        { ownerId: "menu-1", index: 0, x: 20, y: 80, w: 40, h: 18 },
        { ownerId: "menu-1", index: 2, x: 80, y: 120, w: 110, h: 20 }
      ]
    }),
    {
      selection: { kind: "menuEntry", menuId: "menu-1", entryIndex: 2 },
      rect: { ownerId: "menu-1", index: 2, x: 80, y: 120, w: 110, h: 20 }
    }
  );
});

test("resolves flyout menu entry hits outside the window rectangle", () => {
  assert.deepEqual(
    resolveTopLevelChromeHit({
      x: 212,
      y: 132,
      windowHit: false,
      menuId: "menu-1",
      menuRect: { x: 20, y: 80, w: 120, h: 22 },
      menuEntryRects: [
        { ownerId: "menu-1", index: 0, x: 20, y: 80, w: 40, h: 18 },
        { ownerId: "menu-1", index: 4, x: 180, y: 120, w: 110, h: 20 }
      ]
    }),
    {
      selection: { kind: "menuEntry", menuId: "menu-1", entryIndex: 4 },
      rect: { ownerId: "menu-1", index: 4, x: 180, y: 120, w: 110, h: 20 }
    }
  );
});

test("resolves top-level chrome hits from menu, toolbar and statusbar rectangles", () => {
  assert.deepEqual(
    resolveTopLevelChromeHit({
      x: 32,
      y: 88,
      windowHit: true,
      menuId: "menu-1",
      menuRect: { x: 20, y: 80, w: 120, h: 22 },
      menuEntryRects: [{ ownerId: "menu-1", index: 3, x: 30, y: 82, w: 40, h: 18 }]
    }),
    {
      selection: { kind: "menuEntry", menuId: "menu-1", entryIndex: 3 },
      rect: { ownerId: "menu-1", index: 3, x: 30, y: 82, w: 40, h: 18 }
    }
  );

  assert.deepEqual(
    resolveTopLevelChromeHit({
      x: 55,
      y: 145,
      windowHit: true,
      toolBarId: "tb-1",
      toolBarRect: { x: 20, y: 140, w: 120, h: 24 },
      toolBarEntryRects: [{ ownerId: "tb-1", index: 1, x: 50, y: 144, w: 16, h: 16 }]
    }),
    {
      selection: { kind: "toolBarEntry", toolBarId: "tb-1", entryIndex: 1 },
      rect: { ownerId: "tb-1", index: 1, x: 50, y: 144, w: 16, h: 16 }
    }
  );

  assert.deepEqual(
    resolveTopLevelChromeHit({
      x: 70,
      y: 224,
      windowHit: true,
      statusBarId: "sb-1",
      statusBarRect: { x: 20, y: 220, w: 120, h: 22 },
      statusBarFieldRects: [{ ownerId: "sb-1", index: 0, x: 60, y: 221, w: 30, h: 18 }]
    }),
    {
      selection: { kind: "statusBarField", statusBarId: "sb-1", fieldIndex: 0 },
      rect: { ownerId: "sb-1", index: 0, x: 60, y: 221, w: 30, h: 18 }
    }
  );

  assert.equal(resolveTopLevelChromeHit({ x: 0, y: 0, windowHit: false }), null);
});


test("resolves visible menu entry and footer rectangles from preview caches", () => {
  const menu = {
    id: "menu-1",
    entries: [
      { kind: "MenuTitle", textRaw: '"File"', level: 0 },
      { kind: "MenuItem", textRaw: '"Open"', level: 1 }
    ]
  };
  const entryRects = [
    { ownerId: "menu-1", index: 0, x: 10, y: 20, w: 40, h: 18 },
    { ownerId: "menu-1", index: 1, x: 20, y: 40, w: 60, h: 18 }
  ];
  const footerRects = [{ menuId: "menu-1", parentIndex: 0, x: 20, y: 58, w: 60, h: 20 }];

  assert.deepEqual(getMenuEntryRect(entryRects, "menu-1", 1), entryRects[1]);
  assert.deepEqual(getMenuFooterRect(footerRects, "menu-1", 0), footerRects[0]);
  assert.deepEqual(getMenuVisibleEntries(menu, entryRects), [
    { index: 0, entry: menu.entries[0], rect: entryRects[0] },
    { index: 1, entry: menu.entries[1], rect: entryRects[1] }
  ]);
  assert.deepEqual(
    resolveMenuFooterHit({ x: 30, y: 65, windowHit: true, menuRect: { x: 0, y: 0, w: 100, h: 20 }, footerRects }),
    footerRects[0]
  );
  assert.deepEqual(
    resolveMenuFooterHit({ x: 30, y: 65, windowHit: false, footerRects }),
    footerRects[0]
  );
});

test("resolves menu move targets from visible flyout entries", () => {
  const menu = {
    id: "menu-1",
    entries: [
      { kind: "MenuTitle", textRaw: '"File"', level: 0, source: { line: 10 } },
      { kind: "OpenSubMenu", textRaw: '"Export"', level: 1, source: { line: 11 } },
      { kind: "MenuItem", textRaw: '"PNG"', level: 2, source: { line: 12 } },
      { kind: "CloseSubMenu", level: 1, source: { line: 13 } },
      { kind: "MenuItem", textRaw: '"Quit"', level: 1, source: { line: 14 } }
    ]
  };
  const visibleEntries = [
    { index: 0, entry: menu.entries[0], rect: { ownerId: "menu-1", index: 0, x: 10, y: 20, w: 40, h: 18 } },
    { index: 1, entry: menu.entries[1], rect: { ownerId: "menu-1", index: 1, x: 20, y: 40, w: 70, h: 20 } },
    { index: 2, entry: menu.entries[2], rect: { ownerId: "menu-1", index: 2, x: 30, y: 60, w: 80, h: 20 } },
    { index: 4, entry: menu.entries[4], rect: { ownerId: "menu-1", index: 4, x: 20, y: 80, w: 70, h: 20 } }
  ];
  const footerRects = [{ menuId: "menu-1", parentIndex: 1, x: 30, y: 80, w: 80, h: 20 }];

  assert.deepEqual(
    getMenuEntryMoveTarget({
      menu,
      sourceEntryIndex: 4,
      x: 8,
      y: 25,
      menuBarBottom: 38,
      visibleEntries,
      footerRects
    }),
    {
      targetSourceLine: 10,
      placement: "before",
      indicatorRect: { x: 9, y: 20, w: 2, h: 18 },
      indicatorOrientation: "vertical"
    }
  );

  const emptySubMenu = {
    id: "menu-1",
    entries: [
      { kind: "MenuTitle", textRaw: '"File"', level: 0, source: { line: 10 } },
      { kind: "OpenSubMenu", textRaw: '"Export"', level: 1, source: { line: 11 } },
      { kind: "CloseSubMenu", level: 1, source: { line: 13 } },
      { kind: "MenuItem", textRaw: '"Quit"', level: 1, source: { line: 14 } }
    ]
  };
  const emptyVisibleEntries = [
    { index: 0, entry: emptySubMenu.entries[0], rect: { ownerId: "menu-1", index: 0, x: 10, y: 20, w: 40, h: 18 } },
    { index: 1, entry: emptySubMenu.entries[1], rect: { ownerId: "menu-1", index: 1, x: 20, y: 40, w: 70, h: 20 } },
    { index: 3, entry: emptySubMenu.entries[3], rect: { ownerId: "menu-1", index: 3, x: 20, y: 80, w: 70, h: 20 } }
  ];

  assert.deepEqual(
    getMenuEntryMoveTarget({
      menu: emptySubMenu,
      sourceEntryIndex: 3,
      x: 95,
      y: 50,
      menuBarBottom: 38,
      visibleEntries: emptyVisibleEntries,
      footerRects,
      selectedEntryIndex: 1
    }),
    {
      targetSourceLine: 11,
      placement: "appendChild",
      indicatorRect: { x: 90, y: 40, w: 80, h: 2 },
      indicatorOrientation: "horizontal"
    }
  );
});
