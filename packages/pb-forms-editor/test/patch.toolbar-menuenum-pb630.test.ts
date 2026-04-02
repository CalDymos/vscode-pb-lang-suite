import test from "node:test";
import assert from "node:assert/strict";
import type { TextDocument } from "vscode";

import { parseFormDocument } from "../src/core/parser/form-parser";
import {
  applyToolBarEntryDelete,
  applyToolBarEntryInsert,
  applyToolBarEntryUpdate,
  type ToolBarEntryArgs,
} from "../src/core/emitter/patch-emitter";
import { TOOLBAR_ENTRY_KIND } from "../src/core/model";
import { FakeTextDocument } from "./helpers/fakeTextDocument";
import { applyWorkspaceEditToText } from "./helpers/applyWorkspaceEdit";

function patchAndReparse(
  text: string,
  editFactory: (document: TextDocument) => ReturnType<typeof applyToolBarEntryInsert> | ReturnType<typeof applyToolBarEntryUpdate> | ReturnType<typeof applyToolBarEntryDelete>
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

const TOOLBAR_ONLY_FIXTURE = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormGadget
  #Editor
EndEnumeration

; 0 Custom gadget initialisation (do Not remove this line)
Editor_CustomInit()

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#FrmMain, x, y, width, height, "Toolbar Only")
  CreateToolbar(0, WindowID(#FrmMain))
  ToolBarSeparator()
EndProcedure
`;

const MENU_AND_TOOLBAR_FIXTURE = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormGadget
  #Editor
EndEnumeration

Enumeration FormMenu
  #MenuOpen
  #TbSave
EndEnumeration

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#FrmMain, x, y, width, height, "Menu and Toolbar")
  CreateImageMenu(0, WindowID(#FrmMain))
  MenuTitle("File")
  MenuItem(#MenuOpen, "Open")
  CreateToolbar(0, WindowID(#FrmMain))
  ToolBarImageButton(#TbSave, ImageID(#ImgSave))
  ToolBarToolTip(0, #TbSave, "Save")
EndProcedure
`;

test("inserts toolbar ids into FormMenu before custom gadget initialisation when missing", () => {
  const args: ToolBarEntryArgs = {
    kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton,
    idRaw: "#TbSave",
    iconRaw: "ImageID(#ImgSave)",
  };

  const { patchedText, parsed } = patchAndReparse(TOOLBAR_ONLY_FIXTURE, (document) =>
    applyToolBarEntryInsert(document, "0", args)
  );

  const toolBar = parsed.toolbars[0];
  assert.ok(toolBar, "Expected parsed toolbar.");
  assert.ok(toolBar.entries.some((entry) => entry.idRaw === "#TbSave"), "Expected inserted toolbar id.");
  assert.match(
    patchedText,
    /Enumeration FormGadget\r?\n  #Editor\r?\nEndEnumeration\r?\n\r?\nEnumeration FormMenu\r?\n  #TbSave\r?\nEndEnumeration\r?\n\r?\n; 0 Custom gadget initialisation/
  );
});

test("updates FormMenu symbols when renaming the only toolbar id", () => {
  const parsed = parseFormDocument(MENU_AND_TOOLBAR_FIXTURE);
  const sourceLine = parsed.toolbars[0]?.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton && entry.idRaw === "#TbSave")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected toolbar entry source line.");

  const args: ToolBarEntryArgs = {
    kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton,
    idRaw: "#TbStore",
    iconRaw: "ImageID(#ImgSave)",
  };

  const { patchedText } = patchAndReparse(MENU_AND_TOOLBAR_FIXTURE, (document) =>
    applyToolBarEntryUpdate(document, "0", sourceLine!, args)
  );

  assert.match(patchedText, /Enumeration FormMenu\r?\n  #MenuOpen\r?\n  #TbStore\r?\nEndEnumeration/);
  assert.doesNotMatch(patchedText, /Enumeration FormMenu\r?\n[\s\S]*#TbSave/);
});

test("removes FormMenu when deleting the last toolbar symbol", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormMenu
  #TbSave
EndEnumeration

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#FrmMain, x, y, width, height, "Toolbar Only")
  CreateToolbar(0, WindowID(#FrmMain))
  ToolBarImageButton(#TbSave, ImageID(#ImgSave))
  ToolBarToolTip(0, #TbSave, "Save")
EndProcedure
`;

  const parsed = parseFormDocument(text);
  const sourceLine = parsed.toolbars[0]?.entries.find((entry) => entry.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton && entry.idRaw === "#TbSave")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected toolbar entry source line.");

  const { patchedText } = patchAndReparse(text, (document) =>
    applyToolBarEntryDelete(document, "0", sourceLine!, TOOLBAR_ENTRY_KIND.ToolBarImageButton)
  );

  assert.doesNotMatch(patchedText, /Enumeration FormMenu/);
  assert.doesNotMatch(patchedText, /ToolBarImageButton\(#TbSave, ImageID\(#ImgSave\)\)/);
});

test("does not duplicate an enum symbol when menu and toolbar share the same id", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormGadget
  #Editor
EndEnumeration

Enumeration FormMenu
  #MenuOpen
EndEnumeration

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#FrmMain, x, y, width, height, "Shared Id")
  CreateImageMenu(0, WindowID(#FrmMain))
  MenuTitle("File")
  MenuItem(#MenuOpen, "Open")
  CreateToolbar(0, WindowID(#FrmMain))
  ToolBarSeparator()
EndProcedure
`;

  const args: ToolBarEntryArgs = {
    kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton,
    idRaw: "#MenuOpen",
    iconRaw: "ImageID(#ImgOpen)",
  };

  const { patchedText } = patchAndReparse(text, (document) =>
    applyToolBarEntryInsert(document, "0", args)
  );

  const matches = patchedText.match(/#MenuOpen/g) ?? [];
  assert.ok(matches.length >= 2, "Expected shared id in enum and call sites.");
  assert.match(patchedText, /Enumeration FormMenu\r?\n  #MenuOpen\r?\nEndEnumeration/);
  assert.doesNotMatch(patchedText, /Enumeration FormMenu\r?\n  #MenuOpen\r?\n  #MenuOpen/);
});


test("inserts toolbar-only FormMenu before image decoder and load blocks when no window or gadget enum is present", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormImage
  #ImgSave
EndEnumeration

UsePNGImageDecoder()

LoadImage(#ImgSave, "save.png")

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#PB_Any, x, y, width, height, "Toolbar Only")
  CreateToolbar(0, WindowID(#PB_Any))
  ToolBarSeparator()
EndProcedure
`;

  const args: ToolBarEntryArgs = {
    kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton,
    idRaw: "#TbSave",
    iconRaw: "ImageID(#ImgSave)",
  };

  const { patchedText, parsed } = patchAndReparse(text, (document) =>
    applyToolBarEntryInsert(document, "0", args)
  );

  assert.match(
    patchedText,
    /Enumeration FormMenu\r?\n  #TbSave\r?\nEndEnumeration\r?\n\r?\nEnumeration FormImage\r?\n  #ImgSave\r?\nEndEnumeration/
  );
  assert.ok(parsed.toolbars[0]?.entries.some((entry) => entry.idRaw === "#TbSave"));
});
