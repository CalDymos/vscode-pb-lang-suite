import test from "node:test";
import assert from "node:assert/strict";

import { getStatusBarCurrentImageEditState } from "../src/core/statusbarImageInspectorUtils";

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
