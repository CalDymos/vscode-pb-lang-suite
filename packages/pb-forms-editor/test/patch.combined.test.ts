import test from "node:test";
import assert from "node:assert/strict";

import { parseFormDocument } from "../src/core/parser/formParser";
import {
  applyGadgetOpenArgsUpdate,
  applyGadgetPropertyUpdate,
  applyImageDelete,
  applyImageInsert,
  applyImageUpdate,
  applyMenuEntryDelete,
  applyMenuEntryInsert,
  applyMenuEntryUpdate,
  applyRectPatch,
  applyStatusBarFieldDelete,
  applyStatusBarFieldInsert,
  applyStatusBarFieldUpdate,
  applyToolBarEntryDelete,
  applyToolBarEntryInsert,
  applyToolBarEntryUpdate,
  type GadgetPropertyArgs,
  type ImageArgs,
  type MenuEntryArgs,
  type StatusBarFieldArgs,
  type ToolBarEntryArgs,
} from "../src/core/emitter/patchEmitter";
import { MENU_ENTRY_KIND, TOOLBAR_ENTRY_KIND } from "../src/core/model";
import { loadFixture } from "./helpers/loadFixture";
import { FakeTextDocument } from "./helpers/fakeTextDocument";
import { applyWorkspaceEditToText } from "./helpers/applyWorkspaceEdit";

// NOTE: TextDocument is imported as a type only — it is used as the parameter
// type of editFactory so that patch emitter functions (which expect vscode.TextDocument)
// are accepted without additional casts at each call site.
import type { TextDocument } from "vscode";

// NOTE: editFactory receives a vscode.TextDocument, not a FakeTextDocument directly.
// The VSCode Language Server resolves @types/vscode regardless of tsconfig.test.json,
// so passing FakeTextDocument where TextDocument is expected causes TS2345.
// The cast is done once via document.asTextDocument() — do NOT change the parameter
// type back to FakeTextDocument, and do NOT inline the cast at each test call site.
function patchAndReparse(
  text: string,
  editFactory: (document: TextDocument) =>
    | ReturnType<typeof applyGadgetPropertyUpdate>
    | ReturnType<typeof applyImageInsert>
    | ReturnType<typeof applyImageUpdate>
    | ReturnType<typeof applyImageDelete>
    | ReturnType<typeof applyMenuEntryInsert>
    | ReturnType<typeof applyMenuEntryUpdate>
    | ReturnType<typeof applyMenuEntryDelete>
    | ReturnType<typeof applyToolBarEntryInsert>
    | ReturnType<typeof applyToolBarEntryUpdate>
    | ReturnType<typeof applyToolBarEntryDelete>
    | ReturnType<typeof applyStatusBarFieldInsert>
    | ReturnType<typeof applyStatusBarFieldUpdate>
    | ReturnType<typeof applyStatusBarFieldDelete>
) {
  const document = new FakeTextDocument(text);
  const edit = editFactory(document.asTextDocument());
  assert.ok(edit, "Expected a WorkspaceEdit result.");
  const patchedText = applyWorkspaceEditToText(text, edit!);
  return {
    patchedText,
    parsed: parseFormDocument(patchedText),
  };
}

function patchTwiceAndReparse(
  text: string,
  firstEditFactory: (document: TextDocument) =>
    | ReturnType<typeof applyGadgetOpenArgsUpdate>
    | ReturnType<typeof applyGadgetPropertyUpdate>
    | ReturnType<typeof applyImageInsert>
    | ReturnType<typeof applyImageUpdate>
    | ReturnType<typeof applyImageDelete>
    | ReturnType<typeof applyMenuEntryInsert>
    | ReturnType<typeof applyMenuEntryUpdate>
    | ReturnType<typeof applyMenuEntryDelete>
    | ReturnType<typeof applyToolBarEntryInsert>
    | ReturnType<typeof applyToolBarEntryUpdate>
    | ReturnType<typeof applyToolBarEntryDelete>
    | ReturnType<typeof applyStatusBarFieldInsert>
    | ReturnType<typeof applyStatusBarFieldUpdate>
    | ReturnType<typeof applyStatusBarFieldDelete>,
  secondEditFactory: (document: TextDocument) =>
    | ReturnType<typeof applyGadgetOpenArgsUpdate>
    | ReturnType<typeof applyGadgetPropertyUpdate>
    | ReturnType<typeof applyImageInsert>
    | ReturnType<typeof applyImageUpdate>
    | ReturnType<typeof applyImageDelete>
    | ReturnType<typeof applyMenuEntryInsert>
    | ReturnType<typeof applyMenuEntryUpdate>
    | ReturnType<typeof applyMenuEntryDelete>
    | ReturnType<typeof applyToolBarEntryInsert>
    | ReturnType<typeof applyToolBarEntryUpdate>
    | ReturnType<typeof applyToolBarEntryDelete>
    | ReturnType<typeof applyStatusBarFieldInsert>
    | ReturnType<typeof applyStatusBarFieldUpdate>
    | ReturnType<typeof applyStatusBarFieldDelete>
) {
  const firstDocument = new FakeTextDocument(text);
  const firstEdit = firstEditFactory(firstDocument.asTextDocument());
  assert.ok(firstEdit, "Expected first WorkspaceEdit result.");
  const firstPatchedText = applyWorkspaceEditToText(text, firstEdit!);

  const secondDocument = new FakeTextDocument(firstPatchedText);
  const secondEdit = secondEditFactory(secondDocument.asTextDocument());
  assert.ok(secondEdit, "Expected second WorkspaceEdit result.");
  const patchedText = applyWorkspaceEditToText(firstPatchedText, secondEdit!);

  return {
    patchedText,
    parsed: parseFormDocument(patchedText),
  };
}

function patchThriceAndReparse(
  text: string,
  firstEditFactory: (document: TextDocument) =>
    | ReturnType<typeof applyGadgetOpenArgsUpdate>
    | ReturnType<typeof applyGadgetPropertyUpdate>
    | ReturnType<typeof applyImageInsert>
    | ReturnType<typeof applyImageUpdate>
    | ReturnType<typeof applyImageDelete>
    | ReturnType<typeof applyMenuEntryInsert>
    | ReturnType<typeof applyMenuEntryUpdate>
    | ReturnType<typeof applyMenuEntryDelete>
    | ReturnType<typeof applyRectPatch>
    | ReturnType<typeof applyToolBarEntryInsert>
    | ReturnType<typeof applyToolBarEntryUpdate>
    | ReturnType<typeof applyToolBarEntryDelete>
    | ReturnType<typeof applyStatusBarFieldInsert>
    | ReturnType<typeof applyStatusBarFieldUpdate>
    | ReturnType<typeof applyStatusBarFieldDelete>,
  secondEditFactory: (document: TextDocument) =>
    | ReturnType<typeof applyGadgetOpenArgsUpdate>
    | ReturnType<typeof applyGadgetPropertyUpdate>
    | ReturnType<typeof applyImageInsert>
    | ReturnType<typeof applyImageUpdate>
    | ReturnType<typeof applyImageDelete>
    | ReturnType<typeof applyMenuEntryInsert>
    | ReturnType<typeof applyMenuEntryUpdate>
    | ReturnType<typeof applyMenuEntryDelete>
    | ReturnType<typeof applyRectPatch>
    | ReturnType<typeof applyToolBarEntryInsert>
    | ReturnType<typeof applyToolBarEntryUpdate>
    | ReturnType<typeof applyToolBarEntryDelete>
    | ReturnType<typeof applyStatusBarFieldInsert>
    | ReturnType<typeof applyStatusBarFieldUpdate>
    | ReturnType<typeof applyStatusBarFieldDelete>,
  thirdEditFactory: (document: TextDocument) =>
    | ReturnType<typeof applyGadgetOpenArgsUpdate>
    | ReturnType<typeof applyGadgetPropertyUpdate>
    | ReturnType<typeof applyImageInsert>
    | ReturnType<typeof applyImageUpdate>
    | ReturnType<typeof applyImageDelete>
    | ReturnType<typeof applyMenuEntryInsert>
    | ReturnType<typeof applyMenuEntryUpdate>
    | ReturnType<typeof applyMenuEntryDelete>
    | ReturnType<typeof applyRectPatch>
    | ReturnType<typeof applyToolBarEntryInsert>
    | ReturnType<typeof applyToolBarEntryUpdate>
    | ReturnType<typeof applyToolBarEntryDelete>
    | ReturnType<typeof applyStatusBarFieldInsert>
    | ReturnType<typeof applyStatusBarFieldUpdate>
    | ReturnType<typeof applyStatusBarFieldDelete>
) {
  const firstDocument = new FakeTextDocument(text);
  const firstEdit = firstEditFactory(firstDocument.asTextDocument());
  assert.ok(firstEdit, "Expected first WorkspaceEdit result.");
  const firstPatchedText = applyWorkspaceEditToText(text, firstEdit!);

  const secondDocument = new FakeTextDocument(firstPatchedText);
  const secondEdit = secondEditFactory(secondDocument.asTextDocument());
  assert.ok(secondEdit, "Expected second WorkspaceEdit result.");
  const secondPatchedText = applyWorkspaceEditToText(firstPatchedText, secondEdit!);

  const thirdDocument = new FakeTextDocument(secondPatchedText);
  const thirdEdit = thirdEditFactory(thirdDocument.asTextDocument());
  assert.ok(thirdEdit, "Expected third WorkspaceEdit result.");
  const patchedText = applyWorkspaceEditToText(secondPatchedText, thirdEdit!);

  return {
    patchedText,
    parsed: parseFormDocument(patchedText),
  };
}

function parseFixture() {
  const text = loadFixture("fixtures/roundtrip/14-combined-regression.pbf");
  const parsed = parseFormDocument(text);
  const menu = parsed.menus.find((m) => m.id === "#MenuMain");
  const toolBar = parsed.toolbars.find((tb) => tb.id === "#TbMain");
  const statusBar = parsed.statusbars.find((sb) => sb.id === "#SbMain");

  assert.ok(menu, "Expected #MenuMain menu.");
  assert.ok(toolBar, "Expected #TbMain toolbar.");
  assert.ok(statusBar, "Expected #SbMain statusbar.");

  return { text, parsed, menu: menu!, toolBar: toolBar!, statusBar: statusBar! };
}

function parseStatusFixture() {
  const text = loadFixture("fixtures/smoke/10-statusbar-basic.pbf");
  const parsed = parseFormDocument(text);
  const statusBar = parsed.statusbars.find((sb) => sb.id === "#SbMain");

  assert.ok(statusBar, "Expected #SbMain statusbar in statusbar fixture.");
  return { text, parsed, statusBar: statusBar! };
}


function parseImageFixture() {
  const text = loadFixture("fixtures/smoke/11-images-crossrefs.pbf");
  const parsed = parseFormDocument(text);

  return { text, parsed };
}

function parseGadgetFixture() {
  const text = loadFixture("fixtures/smoke/12-visibility-colors-fonts.pbf");
  const parsed = parseFormDocument(text);

  return { text, parsed };
}


test("roundtrips menu entry insert with shortcut and icon", () => {
  const { text } = parseFixture();
  const args: MenuEntryArgs = {
    kind: MENU_ENTRY_KIND.MenuItem,
    idRaw: "#MnuSave",
    textRaw: '"Save"',
    shortcut: "Ctrl+S",
    iconRaw: "ImageID(#ImgSave)",
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryInsert(document, "#MenuMain", args)
  );

  const menu = parsed.menus.find((m) => m.id === "#MenuMain");
  assert.ok(menu, "Expected menu after insert.");
  assert.equal(menu!.entries.length, 4);
  assert.equal(menu!.entries[3]?.kind, MENU_ENTRY_KIND.MenuItem);
  assert.equal(menu!.entries[3]?.idRaw, "#MnuSave");
  assert.equal(menu!.entries[3]?.text, "Save");
  assert.equal(menu!.entries[3]?.shortcut, "Ctrl+S");
  assert.equal(menu!.entries[3]?.iconId, "#ImgSave");
  assert.match(patchedText, /MenuItem\(#MnuSave, "Save""Ctrl\+S", ImageID\(#ImgSave\)\)/);
});

test("roundtrips nested menu entry insert into submenu footer", () => {
  const text = loadFixture("fixtures/smoke/08-menu-basic.pbf");
  const parsed = parseFormDocument(text);
  const menu = parsed.menus.find((m) => m.id === "#MenuMain");
  const openSubMenu = menu?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.OpenSubMenu);
  const parentSourceLine = openSubMenu?.source?.line;

  assert.ok(menu, "Expected #MenuMain menu.");
  assert.equal(typeof parentSourceLine, "number", "Expected source line for OpenSubMenu entry.");

  const args: MenuEntryArgs = {
    kind: MENU_ENTRY_KIND.MenuItem,
    idRaw: "#MenuRecent2",
    textRaw: '"Pinned file"',
  };

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryInsert(document, "#MenuMain", args, undefined, { parentSourceLine: parentSourceLine! })
  );

  const updatedMenu = updated.menus.find((m) => m.id === "#MenuMain");
  assert.ok(updatedMenu, "Expected menu after submenu insert.");

  const closeIndex = updatedMenu!.entries.findIndex((entry) => entry.kind === MENU_ENTRY_KIND.CloseSubMenu);
  const insertedIndex = updatedMenu!.entries.findIndex((entry) => entry.idRaw === "#MenuRecent2");
  assert.ok(insertedIndex >= 0, "Expected inserted submenu entry.");
  assert.ok(closeIndex > insertedIndex, "Expected inserted submenu entry before CloseSubMenu.");
  assert.equal(updatedMenu!.entries[insertedIndex]?.level, 2);
  assert.match(patchedText, /MenuItem\(#MenuRecent2, "Pinned file"\)\r?\n\s*CloseSubMenu\(\)/);
});

test("roundtrips submenu insert with generated closing line", () => {
  const text = loadFixture("fixtures/smoke/08-menu-basic.pbf");
  const args: MenuEntryArgs = {
    kind: MENU_ENTRY_KIND.OpenSubMenu,
    textRaw: '"Tools"',
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryInsert(document, "#MenuMain", args)
  );

  const menu = parsed.menus.find((m) => m.id === "#MenuMain");
  assert.ok(menu, "Expected menu after submenu insert.");
  assert.equal(menu!.entries.at(-2)?.kind, MENU_ENTRY_KIND.OpenSubMenu);
  assert.equal(menu!.entries.at(-2)?.text, "Tools");
  assert.equal(menu!.entries.at(-1)?.kind, MENU_ENTRY_KIND.CloseSubMenu);
  assert.match(patchedText, /OpenSubMenu\("Tools"\)\r?\n\s*CloseSubMenu\(\)/);
});

test("roundtrips menu entry update", () => {
  const { text, menu } = parseFixture();
  const sourceLine = menu.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem)?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for existing menu item.");

  const args: MenuEntryArgs = {
    kind: MENU_ENTRY_KIND.MenuItem,
    idRaw: "#MnuOpen",
    textRaw: '"Open File"',
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryUpdate(document, "#MenuMain", sourceLine!, args)
  );

  const updatedMenu = parsed.menus.find((m) => m.id === "#MenuMain");
  const updatedItem = updatedMenu?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem);
  assert.ok(updatedItem, "Expected updated menu item.");
  assert.equal(updatedItem?.text, "Open File");
  assert.match(patchedText, /MenuItem\(#MnuOpen, "Open File"\)/);
});


test("roundtrips menu entry update with preserved shortcut and icon", () => {
  const { text, menu } = parseFixture();
  const sourceLine = menu.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem)?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for existing menu item.");

  const args: MenuEntryArgs = {
    kind: MENU_ENTRY_KIND.MenuItem,
    idRaw: "#MnuOpen",
    textRaw: '"Open Project"',
    shortcut: "Ctrl+O",
    iconRaw: "ImageID(#ImgOpen)",
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryUpdate(document, "#MenuMain", sourceLine!, args)
  );

  const updatedMenu = parsed.menus.find((m) => m.id === "#MenuMain");
  const updatedItem = updatedMenu?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem);
  assert.ok(updatedItem, "Expected updated menu item.");
  assert.equal(updatedItem?.text, "Open Project");
  assert.equal(updatedItem?.shortcut, "Ctrl+O");
  assert.equal(updatedItem?.iconId, "#ImgOpen");
  assert.match(patchedText, /MenuItem\(#MnuOpen, "Open Project""Ctrl\+O", ImageID\(#ImgOpen\)\)/);
});

test("roundtrips menu entry delete", () => {
  const { text, menu } = parseFixture();
  const target = menu.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem);
  const sourceLine = target?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for existing menu item.");

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryDelete(document, "#MenuMain", sourceLine!, MENU_ENTRY_KIND.MenuItem)
  );

  const updatedMenu = parsed.menus.find((m) => m.id === "#MenuMain");
  assert.ok(updatedMenu, "Expected menu after delete.");
  assert.equal(updatedMenu!.entries.length, 2);
  assert.equal(updatedMenu!.entries.some((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem), false);
  assert.doesNotMatch(patchedText, /MenuItem\(#MnuOpen, "Open"\)/);
});


test("roundtrips submenu delete removes matching CloseSubMenu and descendants", () => {
  const text = loadFixture("fixtures/smoke/08-menu-basic.pbf");
  const parsed = parseFormDocument(text);
  const menu = parsed.menus.find((m) => m.id === "#MenuMain");
  const target = menu?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.OpenSubMenu && entry.text === "Recent");
  const sourceLine = target?.source?.line;

  assert.ok(menu, "Expected #MenuMain menu.");
  assert.equal(typeof sourceLine, "number", "Expected source line for existing OpenSubMenu entry.");

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryDelete(document, "#MenuMain", sourceLine!, MENU_ENTRY_KIND.OpenSubMenu)
  );

  const updatedMenu = updated.menus.find((m) => m.id === "#MenuMain");
  assert.ok(updatedMenu, "Expected menu after submenu delete.");
  assert.equal(updatedMenu!.entries.some((entry) => entry.kind === MENU_ENTRY_KIND.OpenSubMenu), false);
  assert.equal(updatedMenu!.entries.some((entry) => entry.idRaw === "#MenuRecent1"), false);
  assert.equal(updatedMenu!.entries.some((entry) => entry.kind === MENU_ENTRY_KIND.CloseSubMenu), false);
  assert.doesNotMatch(patchedText, /OpenSubMenu\("Recent"\)/);
  assert.doesNotMatch(patchedText, /MenuItem\(#MenuRecent1, "Last file"\)/);
  assert.doesNotMatch(patchedText, /CloseSubMenu\(\)/);
});

test("roundtrips menu title delete removes nested submenu block until next title", () => {
  const text = [
    'Procedure OpenFrmMain()',
    '  CreateMenu(#MenuMain, WindowID(#FrmMain))',
    '  MenuTitle("File")',
    '  MenuItem(#MenuOpen, "Open")',
    '  OpenSubMenu("Recent")',
    '  MenuItem(#MenuRecent1, "Last file")',
    '  CloseSubMenu()',
    '  MenuTitle("Help")',
    '  MenuItem(#MenuAbout, "About")',
    'EndProcedure',
    ''
  ].join("\n");

  const parsed = parseFormDocument(text);
  const menu = parsed.menus.find((m) => m.id === "#MenuMain");
  const title = menu?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuTitle && entry.text === "File");
  const sourceLine = title?.source?.line;

  assert.ok(menu, "Expected menu for title delete test.");
  assert.equal(typeof sourceLine, "number", "Expected source line for root MenuTitle.");

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryDelete(document, "#MenuMain", sourceLine!, MENU_ENTRY_KIND.MenuTitle)
  );

  const updatedMenu = updated.menus.find((m) => m.id === "#MenuMain");
  assert.ok(updatedMenu, "Expected menu after title delete.");
  assert.equal(updatedMenu!.entries.length, 2);
  assert.equal(updatedMenu!.entries[0]?.kind, MENU_ENTRY_KIND.MenuTitle);
  assert.equal(updatedMenu!.entries[0]?.text, "Help");
  assert.equal(updatedMenu!.entries[1]?.idRaw, "#MenuAbout");
  assert.doesNotMatch(patchedText, /MenuTitle\("File"\)/);
  assert.doesNotMatch(patchedText, /OpenSubMenu\("Recent"\)/);
  assert.doesNotMatch(patchedText, /CloseSubMenu\(\)/);
  assert.match(patchedText, /MenuTitle\("Help"\)/);
});

test("roundtrips toolbar image button insert", () => {
  const { text } = parseFixture();
  const args: ToolBarEntryArgs = {
    kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton,
    idRaw: "#TbSync",
    iconRaw: "ImageID(#ImgSync)",
    toggle: true,
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyToolBarEntryInsert(document, "#TbMain", args)
  );

  const toolBar = parsed.toolbars.find((tb) => tb.id === "#TbMain");
  assert.ok(toolBar, "Expected toolbar after insert.");
  assert.equal(toolBar!.entries.length, 3);
  assert.equal(toolBar!.entries[2]?.kind, TOOLBAR_ENTRY_KIND.ToolBarImageButton);
  assert.equal(toolBar!.entries[2]?.idRaw, "#TbSync");
  assert.equal(toolBar!.entries[2]?.iconId, "#ImgSync");
  assert.equal(toolBar!.entries[2]?.toggle, true);
  assert.match(patchedText, /ToolBarImageButton\(#TbSync, ImageID\(#ImgSync\), #PB_ToolBar_Toggle\)/);
});

test("roundtrips toolbar tooltip update", () => {
  const { text, toolBar } = parseFixture();
  const sourceLine = toolBar.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarToolTip)?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for existing toolbar tooltip.");

  const args: ToolBarEntryArgs = {
    kind: TOOLBAR_ENTRY_KIND.ToolBarToolTip,
    idRaw: "#TbRefresh",
    textRaw: '"Refresh all data"',
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyToolBarEntryUpdate(document, "#TbMain", sourceLine!, args)
  );

  const updatedToolBar = parsed.toolbars.find((tb) => tb.id === "#TbMain");
  const updatedTip = updatedToolBar?.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarToolTip);
  assert.ok(updatedTip, "Expected updated toolbar tooltip.");
  assert.equal(updatedTip?.text, "Refresh all data");
  assert.match(patchedText, /ToolBarToolTip\(#TbMain, #TbRefresh, "Refresh all data"\)/);
});


test("roundtrips toolbar image button update", () => {
  const text = loadFixture("fixtures/smoke/09-toolbar-basic.pbf");
  const parsedFixture = parseFormDocument(text);
  const toolBar = parsedFixture.toolbars.find((tb) => tb.id === "#TbMain");
  assert.ok(toolBar, "Expected #TbMain toolbar in toolbar fixture.");

  const sourceLine = toolBar!.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton)?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for existing toolbar image button.");

  const args: ToolBarEntryArgs = {
    kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton,
    idRaw: "#TbSave",
    iconRaw: "ImageID(#ImgSaveAlt)",
    toggle: false,
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyToolBarEntryUpdate(document, "#TbMain", sourceLine!, args)
  );

  const updatedToolBar = parsed.toolbars.find((tb) => tb.id === "#TbMain");
  const updatedButton = updatedToolBar?.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton);
  assert.ok(updatedButton, "Expected updated toolbar image button.");
  assert.equal(updatedButton?.idRaw, "#TbSave");
  assert.equal(updatedButton?.iconId, "#ImgSaveAlt");
  assert.equal(updatedButton?.toggle, false);
  assert.match(patchedText, /ToolBarImageButton\(#TbSave, ImageID\(#ImgSaveAlt\)\)/);
});

test("roundtrips toolbar entry delete", () => {
  const { text, toolBar } = parseFixture();
  const target = toolBar.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarButton);
  const sourceLine = target?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for existing toolbar button.");

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyToolBarEntryDelete(document, "#TbMain", sourceLine!, TOOLBAR_ENTRY_KIND.ToolBarButton)
  );

  const updatedToolBar = parsed.toolbars.find((tb) => tb.id === "#TbMain");
  assert.ok(updatedToolBar, "Expected toolbar after delete.");
  assert.equal(updatedToolBar!.entries.length, 1);
  assert.equal(updatedToolBar!.entries.some((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarButton), false);
  assert.doesNotMatch(patchedText, /ToolBarButton\(#TbRefresh, 0, "Refresh"\)/);
});

test("roundtrips statusbar field insert with text decoration", () => {
  const { text } = parseFixture();
  const args: StatusBarFieldArgs = {
    widthRaw: "240",
    textRaw: '"State"',
    flagsRaw: "#PB_StatusBar_Center",
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyStatusBarFieldInsert(document, "#SbMain", args)
  );

  const statusBar = parsed.statusbars.find((sb) => sb.id === "#SbMain");
  assert.ok(statusBar, "Expected statusbar after insert.");
  assert.equal(statusBar!.fields.length, 2);
  assert.equal(statusBar!.fields[1]?.widthRaw, "240");
  assert.equal(statusBar!.fields[1]?.text, "State");
  assert.equal(statusBar!.fields[1]?.flagsRaw, "#PB_StatusBar_Center");
  assert.match(patchedText, /AddStatusBarField\(240\)/);
  assert.match(patchedText, /StatusBarText\(#SbMain, 1, "State", #PB_StatusBar_Center\)/);
});

test("roundtrips statusbar field update while preserving later field decorations", () => {
  const { text, statusBar } = parseStatusFixture();
  const sourceLine = statusBar.fields[0]?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for statusbar field.");

  const args: StatusBarFieldArgs = {
    widthRaw: "180",
    textRaw: '"Ready now"',
    flagsRaw: "#PB_StatusBar_Right",
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyStatusBarFieldUpdate(document, "#SbMain", sourceLine!, args)
  );

  const updatedStatusBar = parsed.statusbars.find((sb) => sb.id === "#SbMain");
  assert.ok(updatedStatusBar, "Expected statusbar after update.");
  assert.equal(updatedStatusBar!.fields.length, 3);
  assert.equal(updatedStatusBar!.fields[0]?.widthRaw, "180");
  assert.equal(updatedStatusBar!.fields[0]?.text, "Ready now");
  assert.equal(updatedStatusBar!.fields[0]?.flagsRaw, "#PB_StatusBar_Right");
  assert.equal(updatedStatusBar!.fields[1]?.progressBar, true);
  assert.equal(updatedStatusBar!.fields[1]?.progressRaw, "35");
  assert.equal(updatedStatusBar!.fields[2]?.imageId, "#ImgState");
  assert.match(patchedText, /StatusBarProgress\(#SbMain, 1, 35, #PB_StatusBar_Raised\)/);
  assert.match(patchedText, /StatusBarImage\(#SbMain, 2, ImageID\(#ImgState\), #PB_StatusBar_BorderLess\)/);
});


test("roundtrips statusbar width-only update without clearing image fields", () => {
  const { text, statusBar } = parseStatusFixture();
  const sourceLine = statusBar.fields[2]?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for image statusbar field.");

  const args: StatusBarFieldArgs = {
    widthRaw: "96",
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyStatusBarFieldUpdate(document, "#SbMain", sourceLine!, args)
  );

  const updatedStatusBar = parsed.statusbars.find((sb) => sb.id === "#SbMain");
  assert.ok(updatedStatusBar, "Expected statusbar after update.");
  assert.equal(updatedStatusBar!.fields[2]?.widthRaw, "96");
  assert.equal(updatedStatusBar!.fields[2]?.imageId, "#ImgState");
  assert.equal(updatedStatusBar!.fields[2]?.flagsRaw, "#PB_StatusBar_BorderLess");
  assert.match(patchedText, /AddStatusBarField\(96\)/);
  assert.match(patchedText, /StatusBarImage\(#SbMain, 2, ImageID\(#ImgState\), #PB_StatusBar_BorderLess\)/);
});

test("roundtrips statusbar field delete reindexes later decoration lines", () => {
  const { text, statusBar } = parseStatusFixture();
  const sourceLine = statusBar.fields[0]?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for statusbar field.");

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyStatusBarFieldDelete(document, "#SbMain", sourceLine!)
  );

  const updatedStatusBar = parsed.statusbars.find((sb) => sb.id === "#SbMain");
  assert.ok(updatedStatusBar, "Expected statusbar after delete.");
  assert.equal(updatedStatusBar!.fields.length, 2);
  assert.equal(updatedStatusBar!.fields[0]?.progressBar, true);
  assert.equal(updatedStatusBar!.fields[0]?.progressRaw, "35");
  assert.equal(updatedStatusBar!.fields[1]?.imageId, "#ImgState");
  assert.doesNotMatch(patchedText, /StatusBarText\(#SbMain, 0, "Ready", #PB_StatusBar_Center\)/);
  assert.match(patchedText, /StatusBarProgress\(#SbMain, 0, 35, #PB_StatusBar_Raised\)/);
  assert.match(patchedText, /StatusBarImage\(#SbMain, 1, ImageID\(#ImgState\), #PB_StatusBar_BorderLess\)/);
});


test("roundtrips image insert after existing image block", () => {
  const { text } = parseImageFixture();
  const args: ImageArgs = {
    inline: false,
    idRaw: "#ImgClose",
    imageRaw: '"close.png"',
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyImageInsert(document, args)
  );

  const insertedImage = parsed.images.find((image) => image.id === "#ImgClose");
  assert.ok(insertedImage, "Expected inserted image entry.");
  assert.equal(insertedImage?.inline, false);
  assert.equal(insertedImage?.image, "close.png");
  assert.match(patchedText, /LoadImage\(#ImgClose, "close\.png"\)/);
});

test("roundtrips image update for pbAny catch image", () => {
  const { text, parsed } = parseImageFixture();
  const sourceLine = parsed.images.find((image) => image.id === "imgSave")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for pbAny image.");

  const args: ImageArgs = {
    inline: true,
    idRaw: "#PB_Any",
    assignedVar: "imgSave",
    imageRaw: "?ImgSaveData",
  };

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) =>
    applyImageUpdate(document, sourceLine!, args)
  );

  const updatedImage = updated.images.find((image) => image.id === "imgSave");
  assert.ok(updatedImage, "Expected updated pbAny image entry.");
  assert.equal(updatedImage?.inline, true);
  assert.equal(updatedImage?.imageRaw, "?ImgSaveData");
  assert.equal(updatedImage?.image, "ImgSaveData");
  assert.match(patchedText, /imgSave = CatchImage\(#PB_Any, \?ImgSaveData\)/);
});

test("roundtrips image update from load image to catch image without changing raw value", () => {
  const { text, parsed } = parseImageFixture();
  const sourceLine = parsed.images.find((image) => image.id === "#ImgOpen")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for load image.");

  const args: ImageArgs = {
    inline: true,
    idRaw: "#ImgOpen",
    imageRaw: '"open.png"',
  };

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) =>
    applyImageUpdate(document, sourceLine!, args)
  );

  const updatedImage = updated.images.find((image) => image.id === "#ImgOpen");
  assert.ok(updatedImage, "Expected updated load image entry.");
  assert.equal(updatedImage?.inline, true);
  assert.equal(updatedImage?.firstParam, "#ImgOpen");
  assert.equal(updatedImage?.imageRaw, '"open.png"');
  assert.match(patchedText, /CatchImage\(#ImgOpen, "open\.png"\)/);
});

test("roundtrips image update from catch image to load image without changing raw value", () => {
  const { text, parsed } = parseImageFixture();
  const sourceLine = parsed.images.find((image) => image.id === "#ImgState")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for catch image.");

  const args: ImageArgs = {
    inline: false,
    idRaw: "#ImgState",
    imageRaw: "?ImgState",
  };

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) =>
    applyImageUpdate(document, sourceLine!, args)
  );

  const updatedImage = updated.images.find((image) => image.id === "#ImgState");
  assert.ok(updatedImage, "Expected updated catch image entry.");
  assert.equal(updatedImage?.inline, false);
  assert.equal(updatedImage?.firstParam, "#ImgState");
  assert.equal(updatedImage?.imageRaw, "?ImgState");
  assert.match(patchedText, /LoadImage\(#ImgState, \?ImgState\)/);
});

test("roundtrips image delete", () => {
  const { text, parsed } = parseImageFixture();
  const sourceLine = parsed.images.find((image) => image.id === "#ImgState")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for inline image.");

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) =>
    applyImageDelete(document, sourceLine!)
  );

  assert.equal(updated.images.some((image) => image.id === "#ImgState"), false);
  assert.doesNotMatch(patchedText, /CatchImage\(#ImgState, \?ImgState\)/);
});

test("roundtrips choose-file gadget workflow with auto-resize patch sequence", () => {
  const { text } = parseImageFixture();

  const { parsed, patchedText } = patchThriceAndReparse(
    text,
    (document) => applyGadgetOpenArgsUpdate(document, "#ImgPreview", { imageRaw: "ImageID(#ImgChosen)" }),
    (document) => applyRectPatch(document, "#ImgPreview", 20, 20, 96, 48),
    (document) => applyImageInsert(document, { inline: false, idRaw: "#ImgChosen", imageRaw: '"chosen.png"' })
  );

  const gadget = parsed.gadgets.find((entry) => entry.id === "#ImgPreview");
  const image = parsed.images.find((entry) => entry.id === "#ImgChosen");

  assert.equal(gadget?.imageRaw, "ImageID(#ImgChosen)");
  assert.equal(gadget?.imageId, "#ImgChosen");
  assert.equal(gadget?.w, 96);
  assert.equal(gadget?.h, 48);
  assert.ok(image, "Expected inserted file-backed image entry.");
  assert.equal(image?.imageRaw, '"chosen.png"');
  assert.match(patchedText, /ImageGadget\(#ImgPreview, 20, 20, 96, 48, ImageID\(#ImgChosen\)\)/);
  assert.match(patchedText, /LoadImage\(#ImgChosen, "chosen\.png"\)/);
});

test("roundtrips choose-file button image gadget workflow with auto-resize patch sequence", () => {
  const { text } = parseImageFixture();

  const { parsed, patchedText } = patchThriceAndReparse(
    text,
    (document) => applyGadgetOpenArgsUpdate(document, "#BtnApply", { imageRaw: "ImageID(#ImgBtnChosen)" }),
    (document) => applyRectPatch(document, "#BtnApply", 52, 10, 128, 36),
    (document) => applyImageInsert(document, { inline: false, idRaw: "#ImgBtnChosen", imageRaw: '"toolbar/apply-selected.png"' })
  );

  const gadget = parsed.gadgets.find((entry) => entry.id === "#BtnApply");
  const image = parsed.images.find((entry) => entry.id === "#ImgBtnChosen");

  assert.equal(gadget?.kind, "ButtonImageGadget");
  assert.equal(gadget?.imageRaw, "ImageID(#ImgBtnChosen)");
  assert.equal(gadget?.imageId, "#ImgBtnChosen");
  assert.equal(gadget?.w, 128);
  assert.equal(gadget?.h, 36);
  assert.ok(image, "Expected inserted file-backed image entry for button image gadget.");
  assert.equal(image?.imageRaw, '"toolbar/apply-selected.png"');
  assert.match(patchedText, /ButtonImageGadget\(#BtnApply, 52, 10, 128, 36, ImageID\(#ImgBtnChosen\), #PB_Button_Default\)/);
  assert.match(patchedText, /LoadImage\(#ImgBtnChosen, "toolbar\/apply-selected\.png"\)/);
});

test("roundtrips create-and-assign workflow for image gadget", () => {
  const { text } = parseImageFixture();

  const { parsed, patchedText } = patchTwiceAndReparse(
    text,
    (document) => applyGadgetOpenArgsUpdate(document, "#ImgPreview", { imageRaw: "ImageID(#ImgNewLogo)" }),
    (document) => applyImageInsert(document, { inline: false, idRaw: "#ImgNewLogo", imageRaw: '"new-logo.png"' })
  );

  const gadget = parsed.gadgets.find((entry) => entry.id === "#ImgPreview");
  const image = parsed.images.find((entry) => entry.id === "#ImgNewLogo");

  assert.equal(gadget?.imageRaw, "ImageID(#ImgNewLogo)");
  assert.equal(gadget?.imageId, "#ImgNewLogo");
  assert.ok(image, "Expected inserted image entry.");
  assert.equal(image?.imageRaw, '"new-logo.png"');
  assert.match(patchedText, /LoadImage\(#ImgNewLogo, "new-logo\.png"\)/);
});

test("roundtrips create-and-assign workflow for menu item", () => {
  const { text, parsed: initial } = parseImageFixture();
  const menu = initial.menus.find((entry) => entry.id === "#MenuMain");
  assert.ok(menu, "Expected #MenuMain menu.");
  const openItem = menu!.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem && entry.idRaw === "#MenuOpen");
  assert.equal(typeof openItem?.source?.line, "number", "Expected menu entry source line.");

  const { parsed, patchedText } = patchTwiceAndReparse(
    text,
    (document) => applyMenuEntryUpdate(document, "#MenuMain", openItem!.source!.line, {
      kind: MENU_ENTRY_KIND.MenuItem,
      idRaw: openItem!.idRaw,
      textRaw: openItem!.textRaw,
      shortcut: openItem!.shortcut,
      iconRaw: "ImageID(#ImgMenuNew)",
    }),
    (document) => applyImageInsert(document, { inline: false, idRaw: "#ImgMenuNew", imageRaw: '"menu-new.png"' })
  );

  const updatedMenu = parsed.menus.find((entry) => entry.id === "#MenuMain");
  const updatedOpen = updatedMenu?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem && entry.idRaw === "#MenuOpen");
  const image = parsed.images.find((entry) => entry.id === "#ImgMenuNew");

  assert.equal(updatedOpen?.iconRaw, "ImageID(#ImgMenuNew)");
  assert.equal(updatedOpen?.iconId, "#ImgMenuNew");
  assert.ok(image, "Expected inserted menu image entry.");
  assert.match(patchedText, /MenuItem\(#MenuOpen, "Open", ImageID\(#ImgMenuNew\)\)/);
});

test("roundtrips create-and-assign workflow for toolbar image button with pbAny image", () => {
  const { text, parsed: initial } = parseImageFixture();
  const toolBar = initial.toolbars.find((entry) => entry.id === "#TbMain");
  assert.ok(toolBar, "Expected #TbMain toolbar.");
  const imageButton = toolBar!.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton && entry.idRaw === "#TbSave");
  assert.equal(typeof imageButton?.source?.line, "number", "Expected toolbar entry source line.");

  const { parsed, patchedText } = patchTwiceAndReparse(
    text,
    (document) => applyToolBarEntryUpdate(document, "#TbMain", imageButton!.source!.line, {
      kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton,
      idRaw: imageButton!.idRaw,
      iconRaw: "ImageID(imgToolbarNew)",
      toggle: imageButton!.toggle,
    }),
    (document) => applyImageInsert(document, { inline: true, idRaw: "#PB_Any", imageRaw: "?TbImgNew", assignedVar: "imgToolbarNew" })
  );

  const updatedToolBar = parsed.toolbars.find((entry) => entry.id === "#TbMain");
  const updatedButton = updatedToolBar?.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton && entry.idRaw === "#TbSave");
  const image = parsed.images.find((entry) => entry.id === "imgToolbarNew");

  assert.equal(updatedButton?.iconRaw, "ImageID(imgToolbarNew)");
  assert.equal(updatedButton?.iconId, "imgToolbarNew");
  assert.ok(image, "Expected inserted pbAny toolbar image entry.");
  assert.match(patchedText, /imgToolbarNew = CatchImage\(#PB_Any, \?TbImgNew\)/);
});

test("roundtrips create-and-assign workflow for statusbar field", () => {
  const { text, parsed: initial } = parseImageFixture();
  const statusBar = initial.statusbars.find((entry) => entry.id === "#SbMain");
  assert.ok(statusBar, "Expected #SbMain statusbar.");
  const imageField = statusBar!.fields.find((field) => field.imageRaw);
  assert.equal(typeof imageField?.source?.line, "number", "Expected statusbar field source line.");

  const { parsed, patchedText } = patchTwiceAndReparse(
    text,
    (document) => applyStatusBarFieldUpdate(document, "#SbMain", imageField!.source!.line, {
      widthRaw: imageField!.widthRaw,
      imageRaw: "ImageID(#ImgStatusNew)",
    }),
    (document) => applyImageInsert(document, { inline: false, idRaw: "#ImgStatusNew", imageRaw: '"status-new.png"' })
  );

  const updatedStatusBar = parsed.statusbars.find((entry) => entry.id === "#SbMain");
  const updatedField = updatedStatusBar?.fields.find((field) => field.widthRaw === imageField!.widthRaw && field.imageRaw === "ImageID(#ImgStatusNew)");
  const image = parsed.images.find((entry) => entry.id === "#ImgStatusNew");

  assert.ok(updatedField, "Expected updated statusbar image field.");
  assert.equal(updatedField?.imageId, "#ImgStatusNew");
  assert.ok(image, "Expected inserted statusbar image entry.");
  assert.match(patchedText, /StatusBarImage\(#SbMain, 0, ImageID\(#ImgStatusNew\)\)/);
});

test("roundtrips gadget property update for visibility tooltip colors", () => {
  const { text } = parseGadgetFixture();
  const args: GadgetPropertyArgs = {
    hiddenRaw: "0",
    disabledRaw: "1",
    tooltipRaw: '"Name field"',
    backColorRaw: "$445566",
    frontColorRaw: "RGB(1, 2, 3)",
    gadgetFontRaw: "FontID(#FontBody)",
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyGadgetPropertyUpdate(document, "#TxtName", args)
  );

  const txtName = parsed.gadgets.find((g) => g.id === "#TxtName");
  assert.ok(txtName, "Expected #TxtName gadget after property update.");
  assert.equal(txtName?.hiddenRaw, "0");
  assert.equal(txtName?.disabledRaw, "1");
  assert.equal(txtName?.tooltip, "Name field");
  assert.equal(txtName?.backColorRaw, "$445566");
  assert.equal(txtName?.frontColorRaw, "RGB(1, 2, 3)");
  assert.equal(txtName?.gadgetFontRaw, "FontID(#FontBody)");
  assert.match(patchedText, /HideGadget\(#TxtName, 0\)/);
  assert.match(patchedText, /DisableGadget\(#TxtName, 1\)/);
  assert.match(patchedText, /GadgetToolTip\(#TxtName, "Name field"\)/);
  assert.match(patchedText, /SetGadgetColor\(#TxtName, #PB_Gadget_BackColor, \$445566\)/);
  assert.match(patchedText, /SetGadgetColor\(#TxtName, #PB_Gadget_FrontColor, RGB\(1, 2, 3\)\)/);
  assert.match(patchedText, /SetGadgetFont\(#TxtName, FontID\(#FontBody\)\)/);
});

test("roundtrips gadget property update for state and removes cleared lines", () => {
  const { text } = parseGadgetFixture();
  const args: GadgetPropertyArgs = {
    stateRaw: "0",
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyGadgetPropertyUpdate(document, "#ChkActive", args)
  );

  const chkActive = parsed.gadgets.find((g) => g.id === "#ChkActive");
  assert.ok(chkActive, "Expected #ChkActive gadget after property update.");
  assert.equal(chkActive?.stateRaw, "0");
  assert.equal(chkActive?.state, 0);
  assert.match(patchedText, /SetGadgetState\(#ChkActive, 0\)/);
  assert.doesNotMatch(patchedText, /SetGadgetState\(#ChkActive, #PB_CheckBox_Checked\)/);
});


test("roundtrips splitter state update via SetGadgetState", () => {
  const text = loadFixture("fixtures/smoke/07-container-splitter.pbf");

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyGadgetPropertyUpdate(document, "#SplitMain", { stateRaw: "80" })
  );

  const splitter = parsed.gadgets.find((g) => g.id === "#SplitMain");
  assert.ok(splitter, "Expected #SplitMain gadget after state update.");
  assert.equal(splitter?.stateRaw, "80");
  assert.equal(splitter?.state, 80);
  assert.match(patchedText, /SetGadgetState\(#SplitMain, 80\)/);
});

test("roundtrips gadget property update removing managed property lines", () => {
  const { text } = parseGadgetFixture();
  const args: GadgetPropertyArgs = {};

  const { parsed, patchedText } = patchAndReparse(text, (document) =>
    applyGadgetPropertyUpdate(document, "#TxtName", args)
  );

  const txtName = parsed.gadgets.find((g) => g.id === "#TxtName");
  assert.ok(txtName, "Expected #TxtName gadget after property removal.");
  assert.equal(txtName?.hiddenRaw, undefined);
  assert.equal(txtName?.disabledRaw, undefined);
  assert.equal(txtName?.tooltipRaw, undefined);
  assert.equal(txtName?.backColorRaw, undefined);
  assert.equal(txtName?.frontColorRaw, undefined);
  assert.doesNotMatch(patchedText, /HideGadget\(#TxtName,/);
  assert.doesNotMatch(patchedText, /DisableGadget\(#TxtName,/);
  assert.doesNotMatch(patchedText, /GadgetToolTip\(#TxtName,/);
  assert.doesNotMatch(patchedText, /SetGadgetColor\(#TxtName, #PB_Gadget_BackColor,/);
  assert.doesNotMatch(patchedText, /SetGadgetColor\(#TxtName, #PB_Gadget_FrontColor,/);
  assert.doesNotMatch(patchedText, /SetGadgetFont\(#TxtName,/);
});


test("roundtrips image pbAny toggle from enum image and updates gadget plus menu references", () => {
  const { text, parsed: initial } = parseImageFixture();
  const sourceLine = initial.images.find((image) => image.id === "#ImgOpen")?.source?.line;
  const menu = initial.menus.find((entry) => entry.id === "#MenuMain");
  const openItem = menu?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem && entry.idRaw === "#MenuOpen");

  assert.equal(typeof sourceLine, "number", "Expected source line for #ImgOpen.");
  assert.equal(typeof openItem?.source?.line, "number", "Expected menu item source line.");

  const { parsed, patchedText } = patchThriceAndReparse(
    text,
    (document) => applyGadgetOpenArgsUpdate(document, "#ImgPreview", { imageRaw: "ImageID(ImgOpen)" }),
    (document) => applyMenuEntryUpdate(document, "#MenuMain", openItem!.source!.line, {
      kind: MENU_ENTRY_KIND.MenuItem,
      idRaw: openItem!.idRaw,
      textRaw: openItem!.textRaw,
      shortcut: openItem!.shortcut,
      iconRaw: "ImageID(ImgOpen)",
    }),
    (document) => applyImageUpdate(document, sourceLine!, {
      inline: false,
      idRaw: "#PB_Any",
      assignedVar: "ImgOpen",
      imageRaw: '"open.png"',
    })
  );

  const image = parsed.images.find((entry) => entry.id === "ImgOpen");
  const gadget = parsed.gadgets.find((entry) => entry.id === "#ImgPreview");
  const updatedMenu = parsed.menus.find((entry) => entry.id === "#MenuMain");
  const updatedOpen = updatedMenu?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem && entry.idRaw === "#MenuOpen");

  assert.ok(image, "Expected pbAny image entry after toggle.");
  assert.equal(image?.pbAny, true);
  assert.equal(image?.firstParam, "#PB_Any");
  assert.equal(image?.variable, "ImgOpen");
  assert.equal(gadget?.imageId, "ImgOpen");
  assert.equal(updatedOpen?.iconId, "ImgOpen");
  assert.match(patchedText, /ImgOpen = LoadImage\(#PB_Any, "open\.png"\)/);
  assert.match(patchedText, /ImageGadget\(#ImgPreview, 10, 10, 32, 32, ImageID\(ImgOpen\)\)/);
  assert.match(patchedText, /MenuItem\(#MenuOpen, "Open", ImageID\(ImgOpen\)\)/);
});

test("roundtrips image pbAny toggle from pbAny image and updates toolbar references", () => {
  const { text, parsed: initial } = parseImageFixture();
  const sourceLine = initial.images.find((image) => image.id === "imgSave")?.source?.line;
  const toolBar = initial.toolbars.find((entry) => entry.id === "#TbMain");
  const saveButton = toolBar?.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton && entry.idRaw === "#TbSave");

  assert.equal(typeof sourceLine, "number", "Expected source line for imgSave.");
  assert.equal(typeof saveButton?.source?.line, "number", "Expected toolbar button source line.");

  const { parsed, patchedText } = patchTwiceAndReparse(
    text,
    (document) => applyToolBarEntryUpdate(document, "#TbMain", saveButton!.source!.line, {
      kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton,
      idRaw: saveButton!.idRaw,
      iconRaw: "ImageID(#imgSave)",
      toggle: saveButton!.toggle,
    }),
    (document) => applyImageUpdate(document, sourceLine!, {
      inline: false,
      idRaw: "#imgSave",
      imageRaw: '"save.png"',
    })
  );

  const image = parsed.images.find((entry) => entry.id === "#imgSave");
  const updatedToolBar = parsed.toolbars.find((entry) => entry.id === "#TbMain");
  const updatedButton = updatedToolBar?.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton && entry.idRaw === "#TbSave");

  assert.ok(image, "Expected enum image entry after toggle.");
  assert.equal(image?.pbAny, false);
  assert.equal(image?.firstParam, "#imgSave");
  assert.equal(updatedButton?.iconId, "#imgSave");
  assert.match(patchedText, /LoadImage\(#imgSave, "save\.png"\)/);
  assert.match(patchedText, /ToolBarImageButton\(#TbSave, ImageID\(#imgSave\)\)/);
});

test("roundtrips image pbAny toggle updates statusbar references", () => {
  const { text, parsed: initial } = parseImageFixture();
  const sourceLine = initial.images.find((image) => image.id === "#ImgState")?.source?.line;
  const statusBar = initial.statusbars.find((entry) => entry.id === "#SbMain");
  const imageField = statusBar?.fields.find((field) => field.imageId === "#ImgState");

  assert.equal(typeof sourceLine, "number", "Expected source line for #ImgState.");
  assert.equal(typeof imageField?.source?.line, "number", "Expected statusbar field source line.");

  const { parsed, patchedText } = patchTwiceAndReparse(
    text,
    (document) => applyStatusBarFieldUpdate(document, "#SbMain", imageField!.source!.line, {
      widthRaw: imageField!.widthRaw,
      imageRaw: "ImageID(ImgState)",
    }),
    (document) => applyImageUpdate(document, sourceLine!, {
      inline: true,
      idRaw: "#PB_Any",
      assignedVar: "ImgState",
      imageRaw: "?ImgState",
    })
  );

  const image = parsed.images.find((entry) => entry.id === "ImgState");
  const updatedStatusBar = parsed.statusbars.find((entry) => entry.id === "#SbMain");
  const updatedField = updatedStatusBar?.fields.find((field) => field.imageId === "ImgState");

  assert.ok(image, "Expected pbAny status image entry after toggle.");
  assert.equal(image?.pbAny, true);
  assert.equal(updatedField?.imageId, "ImgState");
  assert.match(patchedText, /ImgState = CatchImage\(#PB_Any, \?ImgState\)/);
  assert.match(patchedText, /StatusBarImage\(#SbMain, 0, ImageID\(ImgState\)\)/);
});

test("roundtrips image pbAny toggle updates button image gadget references", () => {
  const { text, parsed: initial } = parseImageFixture();
  const sourceLine = initial.images.find((image) => image.id === "#ImgRelative")?.source?.line;

  assert.equal(typeof sourceLine, "number", "Expected source line for #ImgRelative.");

  const { parsed, patchedText } = patchTwiceAndReparse(
    text,
    (document) => applyGadgetOpenArgsUpdate(document, "#BtnApply", { imageRaw: "ImageID(ImgRelative)" }),
    (document) => applyImageUpdate(document, sourceLine!, {
      inline: false,
      idRaw: "#PB_Any",
      assignedVar: "ImgRelative",
      imageRaw: '"./icons/apply.png"',
    })
  );

  const image = parsed.images.find((entry) => entry.id === "ImgRelative");
  const gadget = parsed.gadgets.find((entry) => entry.id === "#BtnApply");

  assert.ok(image, "Expected pbAny image entry for button image gadget after toggle.");
  assert.equal(image?.pbAny, true);
  assert.equal(gadget?.kind, "ButtonImageGadget");
  assert.equal(gadget?.imageId, "ImgRelative");
  assert.match(patchedText, /ImgRelative = LoadImage\(#PB_Any, "\.\/icons\/apply\.png"\)/);
  assert.match(patchedText, /ButtonImageGadget\(#BtnApply, 52, 10, 96, 28, ImageID\(ImgRelative\), #PB_Button_Default\)/);
});
