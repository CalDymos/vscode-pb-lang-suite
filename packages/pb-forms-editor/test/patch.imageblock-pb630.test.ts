import test from "node:test";
import assert from "node:assert/strict";
import type { TextDocument } from "vscode";

import { parseFormDocument } from "../src/core/parser/formParser";
import {
  applyImageDelete,
  applyImageInsert,
  applyImageUpdate,
  type ImageArgs,
} from "../src/core/emitter/patchEmitter";
import { FakeTextDocument } from "./helpers/fakeTextDocument";
import { applyWorkspaceEditToText } from "./helpers/applyWorkspaceEdit";

function patchAndReparse(
  text: string,
  editFactory: (document: TextDocument) =>
    | ReturnType<typeof applyImageInsert>
    | ReturnType<typeof applyImageUpdate>
    | ReturnType<typeof applyImageDelete>
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

test("inserts the first image block before the font block and injects the required decoder", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormFont
  #Font_FrmMain_0
EndEnumeration

LoadFont(#Font_FrmMain_0,"Arial", 10)

Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Images")
EndProcedure
`;

  const args: ImageArgs = {
    inline: false,
    idRaw: "#ImgMainLogo",
    imageRaw: '"logo.png"',
  };

  const { parsed, patchedText } = patchAndReparse(text, (document) => applyImageInsert(document, args));

  const image = parsed.images.find((entry) => entry.id === "#ImgMainLogo");
  assert.ok(image, "Expected inserted image entry.");
  assert.equal(image?.image, "logo.png");
  assert.match(
    patchedText,
    /UsePNGImageDecoder\(\)\r?\n\r?\nLoadImage\(#ImgMainLogo, "logo\.png"\)\r?\n\r?\nEnumeration FormFont/s
  );
  assert.doesNotMatch(
    patchedText,
    /Procedure OpenFrmMain[\s\S]*UsePNGImageDecoder\(\)/s
  );
});

test("removes the decoder together with the last remaining image in the block", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormImage
  #ImgMainLogo
EndEnumeration

UsePNGImageDecoder()

LoadImage(#ImgMainLogo,"logo.png")

Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Images")
EndProcedure
`;

  const parsed = parseFormDocument(text);
  const sourceLine = parsed.images.find((entry) => entry.id === "#ImgMainLogo")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected image source line.");

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) => applyImageDelete(document, sourceLine!));

  assert.equal(updated.images.length, 0);
  assert.doesNotMatch(patchedText, /UsePNGImageDecoder\(\)/);
  assert.doesNotMatch(patchedText, /LoadImage\(#ImgMainLogo, "logo\.png"\)/);
  assert.match(patchedText, /Procedure OpenFrmMain\(/);
});

test("rebuilds the decoder lines when the image file type changes", () => {
  const text = `; Form Designer for PureBasic - 6.30

Enumeration FormWindow
  #FrmMain
EndEnumeration

Enumeration FormImage
  #ImgMainLogo
EndEnumeration

UsePNGImageDecoder()

LoadImage(#ImgMainLogo,"logo.png")

Procedure OpenFrmMain(x = 0, y = 0, width = 220, height = 140)
  OpenWindow(#FrmMain, x, y, width, height, "Images")
EndProcedure
`;

  const parsed = parseFormDocument(text);
  const sourceLine = parsed.images.find((entry) => entry.id === "#ImgMainLogo")?.source?.line;
  assert.equal(typeof sourceLine, "number", "Expected image source line.");

  const args: ImageArgs = {
    inline: false,
    idRaw: "#ImgMainLogo",
    imageRaw: '"logo.jpg"',
  };

  const { parsed: updated, patchedText } = patchAndReparse(text, (document) => applyImageUpdate(document, sourceLine!, args));

  const image = updated.images.find((entry) => entry.id === "#ImgMainLogo");
  assert.ok(image, "Expected updated image entry.");
  assert.equal(image?.image, "logo.jpg");
  assert.match(patchedText, /UseJPEGImageDecoder\(\)/);
  assert.doesNotMatch(patchedText, /UsePNGImageDecoder\(\)/);
  assert.match(patchedText, /LoadImage\(#ImgMainLogo, "logo\.jpg"\)/);
});
