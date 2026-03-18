import test from "node:test";
import assert from "node:assert/strict";
import type { TextDocument } from "vscode";

import { parseFormDocument } from "../src/core/parser/formParser";
import {
  applyFontDelete,
  applyFontInsert,
  applyFontUpdate,
  type FontArgs,
} from "../src/core/emitter/patchEmitter";
import { FakeTextDocument } from "./helpers/fakeTextDocument";
import { applyWorkspaceEditToText } from "./helpers/applyWorkspaceEdit";

function patchAndReparse(
  text: string,
  editFactory: (document: TextDocument) =>
    | ReturnType<typeof applyFontInsert>
    | ReturnType<typeof applyFontUpdate>
    | ReturnType<typeof applyFontDelete>
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

function toLf(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

test("parses top-level FormFont declarations from the PB 6.30 fixture", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormFont
  #Font_FrmMain_0
EndEnumeration

LoadFont(#Font_FrmMain_0, "Arial", 10, #PB_Font_Bold)

Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Fonts")
EndProcedure
`;

  const parsed = parseFormDocument(text);
  const font = parsed.fonts.find((entry) => entry.id === "#Font_FrmMain_0");

  assert.ok(font, "Expected parsed top-level font entry.");
  assert.equal(font?.name, "Arial");
  assert.equal(font?.size, 10);
  assert.equal(font?.flagsRaw, "#PB_Font_Bold");
});

test("inserts the first enum font block after the image block and before the procedure", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormImage
  #ImgMainLogo
EndEnumeration

UsePNGImageDecoder()

LoadImage(#ImgMainLogo, "logo.png")

Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Fonts")
EndProcedure
`;

  const args: FontArgs = {
    idRaw: "#Font_FrmMain_0",
    nameRaw: '"Arial"',
    sizeRaw: "10",
    flagsRaw: "#PB_Font_Bold",
  };

  const { patchedText, parsed } = patchAndReparse(text, (document) => applyFontInsert(document, args));
  const normalized = toLf(patchedText);
  const font = parsed.fonts.find((entry) => entry.id === "#Font_FrmMain_0");

  assert.ok(font, "Expected inserted font entry.");
  assert.ok(normalized.includes([
    'LoadImage(#ImgMainLogo, "logo.png")',
    '',
    'Enumeration FormFont',
    '  #Font_FrmMain_0',
    'EndEnumeration',
    '',
    'LoadFont(#Font_FrmMain_0, "Arial", 10, #PB_Font_Bold)',
    '',
    'Procedure OpenFrmMain',
  ].join("\n")));
});

test("creates a Global font variable block when inserting the first pbAny font", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Fonts")
EndProcedure
`;

  const args: FontArgs = {
    idRaw: "#PB_Any",
    assignedVar: "FontMain",
    nameRaw: '"Arial"',
    sizeRaw: "10",
  };

  const { patchedText } = patchAndReparse(text, (document) => applyFontInsert(document, args));
  const normalized = toLf(patchedText);

  assert.ok(normalized.includes(['Global FontMain', '', 'Enumeration FormWindow'].join("\n")));
  assert.ok(normalized.includes([
    'FontMain = LoadFont(#PB_Any, "Arial", 10)',
    '',
    'Procedure OpenFrmMain',
  ].join("\n")));
  assert.doesNotMatch(patchedText, /Enumeration FormFont/);
});

test("moves font declarations from FormFont to Global when toggling the last enum font to pbAny", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormFont
  #Font_FrmMain_0
EndEnumeration

LoadFont(#Font_FrmMain_0, "Arial", 10)

Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Fonts")
EndProcedure
`;

  const parsed = parseFormDocument(text);
  const sourceLine = parsed.fonts.find((entry) => entry.id === "#Font_FrmMain_0")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected font source line.");

  const args: FontArgs = {
    idRaw: "#PB_Any",
    assignedVar: "FontMain",
    nameRaw: '"Arial"',
    sizeRaw: "10",
  };

  const { patchedText } = patchAndReparse(text, (document) => applyFontUpdate(document, sourceLine!, args));
  const normalized = toLf(patchedText);

  assert.ok(normalized.includes('Global FontMain'));
  assert.ok(!normalized.includes(['Enumeration FormFont', '  #Font_FrmMain_0', 'EndEnumeration'].join("\n")));
  assert.match(patchedText, /FontMain = LoadFont\(#PB_Any, "Arial", 10\)/);
});

test("moves font declarations from Global to FormFont when toggling the last pbAny font to enum mode", () => {
  const text = `; Form Designer for PureBasic - 6.30

Global FontMain

Enumeration FormWindow
  #FrmMain
EndEnumeration

FontMain = LoadFont(#PB_Any, "Arial", 10)

Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Fonts")
EndProcedure
`;

  const parsed = parseFormDocument(text);
  const sourceLine = parsed.fonts.find((entry) => entry.id === "FontMain")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected font source line.");

  const args: FontArgs = {
    idRaw: "#Font_FrmMain_0",
    nameRaw: '"Arial"',
    sizeRaw: "10",
    flagsRaw: "#PB_Font_Italic",
  };

  const { patchedText } = patchAndReparse(text, (document) => applyFontUpdate(document, sourceLine!, args));
  const normalized = toLf(patchedText);

  assert.ok(normalized.includes([
    'Enumeration FormFont',
    '  #Font_FrmMain_0',
    'EndEnumeration',
  ].join("\n")));
  assert.doesNotMatch(patchedText, /^Global FontMain$/m);
  assert.match(patchedText, /LoadFont\(#Font_FrmMain_0, "Arial", 10, #PB_Font_Italic\)/);
});

test("inserts an enum font block before Declare and XIncludeFile boundaries", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Declare ResizeGadgetsFrmMain()
XIncludeFile "events/form-main.pbi"
Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Fonts")
EndProcedure
`;

  const args: FontArgs = {
    idRaw: "#Font_FrmMain_0",
    nameRaw: '"Arial"',
    sizeRaw: "10",
    flagsRaw: "#PB_Font_Bold",
  };

  const { patchedText } = patchAndReparse(text, (document) => applyFontInsert(document, args));
  const normalized = toLf(patchedText);

  assert.ok(normalized.includes([
    'Enumeration FormFont',
    '  #Font_FrmMain_0',
    'EndEnumeration',
    '',
    'LoadFont(#Font_FrmMain_0, "Arial", 10, #PB_Font_Bold)',
    '',
    'Declare ResizeGadgetsFrmMain()',
    'XIncludeFile "events/form-main.pbi"',
  ].join("\n")));
});

test("inserts a pbAny font Global block before Declare and XIncludeFile boundaries", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Declare ResizeGadgetsFrmMain()
XIncludeFile "events/form-main.pbi"
Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Fonts")
EndProcedure
`;

  const args: FontArgs = {
    idRaw: "#PB_Any",
    assignedVar: "FontMain",
    nameRaw: '"Arial"',
    sizeRaw: "10",
  };

  const { patchedText } = patchAndReparse(text, (document) => applyFontInsert(document, args));
  const normalized = toLf(patchedText);

  assert.ok(normalized.includes([
    'Global FontMain',
    '',
    'Enumeration FormWindow',
  ].join("\n")));
  assert.ok(normalized.includes([
    'FontMain = LoadFont(#PB_Any, "Arial", 10)',
    '',
    'Declare ResizeGadgetsFrmMain()',
    'XIncludeFile "events/form-main.pbi"',
  ].join("\n")));
});
