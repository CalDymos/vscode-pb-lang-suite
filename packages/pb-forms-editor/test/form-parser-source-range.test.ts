import test from "node:test";
import assert from "node:assert/strict";

import { parseFormDocument } from "../src/core/parser/form-parser";
import { GADGET_KIND } from "../src/core/model";

function buildCustomGadgetFixture(eol: string): string {
  return [
    "; Form Designer for PureBasic - 6.30",
    "; EnableExplicit",
    "",
    "Enumeration FormWindow",
    "  #Form",
    "EndEnumeration",
    "",
    "Procedure OpenForm(x = 0, y = 0, width = 260, height = 180)",
    '  If OpenWindow(#Form, x, y, width, height, "Custom", #PB_Window_SystemMenu)',
    "    ; 0 Custom gadget initialisation (do Not remove this line)",
    "    InitFancyWidget()",
    "    ; 0 Custom gadget creation (do not remove this line) FancyWidget(%id%, %x%, %y%, %w%, %h%, %txt%)",
    '    FancyWidget(#Fancy, 10, 20, 130, 24, "Caption")',
    "  EndIf",
    "EndProcedure",
    ""
  ].join(eol);
}

function parseSingleCustomGadget(text: string) {
  const doc = parseFormDocument(text);
  assert.equal(doc.gadgets.length, 1);

  const gadget = doc.gadgets[0];
  assert.ok(gadget);
  assert.equal(gadget?.kind, GADGET_KIND.CustomGadget);
  assert.ok(gadget?.customInitSource);
  assert.ok(gadget?.customCreateMarkerSource);
  assert.ok(gadget?.source);

  return gadget!;
}

test("keeps custom gadget SourceRange.lineStart byte-accurate for LF documents", () => {
  const text = buildCustomGadgetFixture("\n");
  const gadget = parseSingleCustomGadget(text);

  assert.equal(gadget.customInitSource?.lineStart, text.indexOf("    InitFancyWidget()"));
  assert.equal(
    gadget.customCreateMarkerSource?.lineStart,
    text.indexOf("    ; 0 Custom gadget creation (do not remove this line) FancyWidget(%id%, %x%, %y%, %w%, %h%, %txt%)")
  );
  assert.equal(gadget.source?.lineStart, text.indexOf('    FancyWidget(#Fancy, 10, 20, 130, 24, "Caption")'));
});

test("keeps custom gadget SourceRange.lineStart byte-accurate for CRLF documents", () => {
  const text = buildCustomGadgetFixture("\r\n");
  const gadget = parseSingleCustomGadget(text);

  assert.equal(gadget.customInitSource?.lineStart, text.indexOf("    InitFancyWidget()"));
  assert.equal(
    gadget.customCreateMarkerSource?.lineStart,
    text.indexOf("    ; 0 Custom gadget creation (do not remove this line) FancyWidget(%id%, %x%, %y%, %w%, %h%, %txt%)")
  );
  assert.equal(gadget.source?.lineStart, text.indexOf('    FancyWidget(#Fancy, 10, 20, 130, 24, "Caption")'));
});

test("keeps successive CRLF line starts stable across custom gadget marker and code lines", () => {
  const text = buildCustomGadgetFixture("\r\n");
  const gadget = parseSingleCustomGadget(text);
  const initStart = text.indexOf("    InitFancyWidget()");
  const markerStart = text.indexOf(
    "    ; 0 Custom gadget creation (do not remove this line) FancyWidget(%id%, %x%, %y%, %w%, %h%, %txt%)"
  );
  const callStart = text.indexOf('    FancyWidget(#Fancy, 10, 20, 130, 24, "Caption")');

  assert.equal(gadget.customInitSource?.lineStart, initStart);
  assert.equal(gadget.customCreateMarkerSource?.lineStart, markerStart);
  assert.equal(gadget.source?.lineStart, callStart);
  assert.equal(markerStart - initStart, "    InitFancyWidget()\r\n".length);
  assert.equal(callStart - markerStart, "    ; 0 Custom gadget creation (do not remove this line) FancyWidget(%id%, %x%, %y%, %w%, %h%, %txt%)\r\n".length);
});
