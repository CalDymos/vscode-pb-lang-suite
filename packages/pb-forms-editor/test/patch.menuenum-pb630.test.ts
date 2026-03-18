import test from "node:test";
import assert from "node:assert/strict";
import type { TextDocument } from "vscode";

import { parseFormDocument } from "../src/core/parser/formParser";
import { MENU_ENTRY_KIND } from "../src/core/model";
import {
  applyMenuEntryDelete,
  applyMenuEntryInsert,
  applyMenuEntryUpdate,
  type MenuEntryArgs,
} from "../src/core/emitter/patchEmitter";
import { FakeTextDocument } from "./helpers/fakeTextDocument";
import { applyWorkspaceEditToText } from "./helpers/applyWorkspaceEdit";

function patchAndReparse(
  text: string,
  editFactory: (document: TextDocument) =>
    | ReturnType<typeof applyMenuEntryInsert>
    | ReturnType<typeof applyMenuEntryUpdate>
    | ReturnType<typeof applyMenuEntryDelete>
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

test("inserts FormMenu before custom gadget initialisation when missing", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormGadget
  #Editor
EndEnumeration

; 0 Custom gadget initialisation (do Not remove this line)
InitEditorGadget()

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#FrmMain, x, y, width, height, "Menu")
  CreateMenu(0, WindowID(#FrmMain))
  MenuTitle("File")
EndProcedure
`;

  const args: MenuEntryArgs = {
    kind: MENU_ENTRY_KIND.MenuItem,
    idRaw: "#MenuSave",
    textRaw: '"Save"',
  };

  const { patchedText, parsed } = patchAndReparse(text, (document) =>
    applyMenuEntryInsert(document, "0", args)
  );

  assert.match(
    patchedText,
    /Enumeration FormGadget\r?\n  #Editor\r?\nEndEnumeration\r?\n\r?\nEnumeration FormMenu\r?\n  #MenuSave\r?\nEndEnumeration\r?\n\r?\n; 0 Custom gadget initialisation/
  );
  assert.equal(parsed.menus[0]?.entries.some((entry) => entry.idRaw === "#MenuSave"), true);
});

test("removes an empty FormMenu block when deleting the last menu symbol", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormGadget
  #Editor
EndEnumeration

Enumeration FormMenu
  #MenuSave
EndEnumeration

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#FrmMain, x, y, width, height, "Menu")
  CreateMenu(0, WindowID(#FrmMain))
  MenuTitle("File")
  MenuItem(#MenuSave, "Save")
EndProcedure
`;

  const parsed = parseFormDocument(text);
  const target = parsed.menus[0]?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem && entry.idRaw === "#MenuSave");
  const sourceLine = target?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for menu item.");

  const { patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryDelete(document, "0", sourceLine!, MENU_ENTRY_KIND.MenuItem)
  );

  assert.doesNotMatch(patchedText, /Enumeration FormMenu/);
  assert.doesNotMatch(patchedText, /#MenuSave/);
});

test("updates FormMenu symbols when renaming the only menu id", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormGadget
  #Editor
EndEnumeration

Enumeration FormMenu
  #MenuSave
EndEnumeration

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#FrmMain, x, y, width, height, "Menu")
  CreateMenu(0, WindowID(#FrmMain))
  MenuTitle("File")
  MenuItem(#MenuSave, "Save")
EndProcedure
`;

  const parsed = parseFormDocument(text);
  const target = parsed.menus[0]?.entries.find((entry) => entry.kind === MENU_ENTRY_KIND.MenuItem && entry.idRaw === "#MenuSave");
  const sourceLine = target?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected source line for menu item.");

  const args: MenuEntryArgs = {
    kind: MENU_ENTRY_KIND.MenuItem,
    idRaw: "#MenuStore",
    textRaw: '"Save"',
  };

  const { patchedText } = patchAndReparse(text, (document) =>
    applyMenuEntryUpdate(document, "0", sourceLine!, args)
  );

  assert.match(patchedText, /Enumeration FormMenu\r?\n  #MenuStore\r?\nEndEnumeration/);
  assert.doesNotMatch(patchedText, /Enumeration FormMenu\r?\n  #MenuSave/);
  assert.match(patchedText, /MenuItem\(#MenuStore, "Save"\)/);
});


test("inserts FormMenu before an existing FormImage block when no window or gadget enum is present", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormImage
  #ImgSave
EndEnumeration

UsePNGImageDecoder()

LoadImage(#ImgSave, "save.png")

Procedure OpenFrmMain(x = 0, y = 0, width = 320, height = 200)
  OpenWindow(#PB_Any, x, y, width, height, "Menu")
  CreateImageMenu(0, WindowID(#PB_Any))
  MenuTitle("File")
EndProcedure
`;

  const args: MenuEntryArgs = {
    kind: MENU_ENTRY_KIND.MenuItem,
    idRaw: "#MenuSave",
    textRaw: '"Save"',
    iconRaw: 'ImageID(#ImgSave)',
  };

  const { patchedText, parsed } = patchAndReparse(text, (document) =>
    applyMenuEntryInsert(document, "0", args)
  );

  assert.match(
    patchedText,
    /Enumeration FormMenu\r?\n  #MenuSave\r?\nEndEnumeration\r?\n\r?\nEnumeration FormImage\r?\n  #ImgSave\r?\nEndEnumeration/
  );
  assert.ok(parsed.menus[0]?.entries.some((entry) => entry.idRaw === "#MenuSave"));
});
