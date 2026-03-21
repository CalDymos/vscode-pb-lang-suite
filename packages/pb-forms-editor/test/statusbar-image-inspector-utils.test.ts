import test from "node:test";
import assert from "node:assert/strict";

import {
  getStatusBarCurrentImageEditState,
  resolveStatusBarCurrentImageRebind,
  shouldCleanupStatusBarReboundImage
} from "../src/core/statusbarImageInspectorUtils";

test("allows direct CurrentImage edit for unique parsed LoadImage entries", () => {
  const state = getStatusBarCurrentImageEditState({ inline: false, source: { line: 12 } }, 1);
  assert.equal(state.canDirectEdit, true);
  assert.match(state.reason ?? "", /LoadImage/i);
});

test("blocks direct CurrentImage edit for shared image entries", () => {
  const state = getStatusBarCurrentImageEditState({ inline: false, source: { line: 12 } }, 2);
  assert.equal(state.canDirectEdit, false);
  assert.match(state.reason ?? "", /shared/i);
});

test("blocks direct CurrentImage edit for CatchImage entries", () => {
  const state = getStatusBarCurrentImageEditState({ inline: true, source: { line: 12 } }, 1);
  assert.equal(state.canDirectEdit, false);
  assert.match(state.reason ?? "", /CatchImage/i);
});

test("blocks direct CurrentImage edit when no parsed image entry exists", () => {
  const state = getStatusBarCurrentImageEditState(undefined, 0);
  assert.equal(state.canDirectEdit, false);
  assert.match(state.reason ?? "", /assign one first/i);
});

test("rebinds shared CurrentImage to an existing parsed LoadImage path", () => {
  const resolution = resolveStatusBarCurrentImageRebind(
    [
      { id: "#ImgOpen", imageRaw: '"open.png"', image: "open.png", inline: false },
      { id: "#ImgState", imageRaw: "?ImgState", image: "ImgState", inline: true },
    ],
    "open.png",
    "#ImgState"
  );

  assert.equal(resolution.matchedImage?.id, "#ImgOpen");
  assert.equal(resolution.reason, undefined);
});

test("rebinds CatchImage CurrentImage by matching the normalized inline label", () => {
  const resolution = resolveStatusBarCurrentImageRebind(
    [
      { id: "#ImgState", imageRaw: "?ImgState", image: "ImgState", inline: true },
    ],
    "ImgState",
    "#ImgOther"
  );

  assert.equal(resolution.matchedImage?.id, "#ImgState");
});

test("rejects CurrentImage rebind when multiple parsed image entries match", () => {
  const resolution = resolveStatusBarCurrentImageRebind(
    [
      { id: "#ImgOpenA", imageRaw: '"open.png"', image: "open.png", inline: false },
      { id: "#ImgOpenB", imageRaw: '"open.png"', image: "open.png", inline: false },
    ],
    "open.png",
    "#ImgState"
  );

  assert.equal(resolution.matchedImage, undefined);
  assert.match(resolution.reason ?? "", /multiple/i);
});

test("cleans the previous image entry only for unique rebinding targets", () => {
  assert.equal(shouldCleanupStatusBarReboundImage("#ImgState", 1, 42, "#ImgOpen"), true);
  assert.equal(shouldCleanupStatusBarReboundImage("#ImgState", 2, 42, "#ImgOpen"), false);
  assert.equal(shouldCleanupStatusBarReboundImage("#ImgState", 1, undefined, "#ImgOpen"), false);
  assert.equal(shouldCleanupStatusBarReboundImage("#ImgState", 1, 42, "#ImgState"), false);
});
