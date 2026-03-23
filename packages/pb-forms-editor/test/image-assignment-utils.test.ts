import test from "node:test";
import assert from "node:assert/strict";

import {
  buildImageReferenceFromEntry,
  resolveExistingLoadImageByFilePath
} from "../src/core/imageAssignmentUtils";

test("reuses an existing parsed LoadImage entry for the same selected file path", () => {
  const matched = resolveExistingLoadImageByFilePath([
    { id: "#ImgOpen", inline: false, image: "C:/forms/assets/open.png", imageRaw: '"C:/forms/assets/open.png"' },
    { id: "#ImgSave", inline: false, image: "C:/forms/assets/save.png", imageRaw: '"C:/forms/assets/save.png"' }
  ], "C:\\forms\\assets\\open.png");

  assert.equal(matched?.id, "#ImgOpen");
});

test("ignores inline image entries when resolving a chosen file path", () => {
  const matched = resolveExistingLoadImageByFilePath([
    { id: "#ImgInline", inline: true, imageRaw: "?toolbar_open" },
    { id: "#ImgOpen", inline: false, image: "images/open.png", imageRaw: '"images/open.png"' }
  ], "images/open.png");

  assert.equal(matched?.id, "#ImgOpen");
});

test("builds ImageID references from enum and #PB_Any image entries", () => {
  assert.equal(buildImageReferenceFromEntry({ id: "#ImgOpen" }), "ImageID(#ImgOpen)");
  assert.equal(buildImageReferenceFromEntry({ id: "img_open", variable: "img_open", firstParam: "#PB_Any" }), "ImageID(img_open)");
  assert.equal(buildImageReferenceFromEntry({ firstParam: "#PB_Any" }), undefined);
});
