import test from "node:test";
import assert from "node:assert/strict";

import {
  getStatusBarProgressInspectorValue,
  normalizeStatusBarProgressRaw,
  parseStatusBarWidthInspectorInput,
  STATUSBAR_WIDTH_IGNORE_LITERAL
} from "../src/core/statusbarInspectorUtils";

test("accepts statusbar width integers and #PB_Ignore like the original grid path", () => {
  assert.deepEqual(parseStatusBarWidthInspectorInput("120"), {
    ok: true,
    raw: "120",
    previewWidth: 120
  });
  assert.deepEqual(parseStatusBarWidthInspectorInput(" 0007 "), {
    ok: true,
    raw: "7",
    previewWidth: 7
  });
  assert.deepEqual(parseStatusBarWidthInspectorInput("#PB_Ignore"), {
    ok: true,
    raw: STATUSBAR_WIDTH_IGNORE_LITERAL,
    previewWidth: null
  });
  assert.deepEqual(parseStatusBarWidthInspectorInput("-1"), {
    ok: true,
    raw: STATUSBAR_WIDTH_IGNORE_LITERAL,
    previewWidth: null
  });
});

test("rejects unsupported raw statusbar width expressions", () => {
  const invalid = ["", "50 + 10", "WidthVar", "12.5", "-2"];
  for (const raw of invalid) {
    const parsed = parseStatusBarWidthInspectorInput(raw);
    assert.equal(parsed.ok, false, raw);
  }
});

test("canonicalizes progress decoration values back to the original checkbox semantics", () => {
  assert.equal(normalizeStatusBarProgressRaw(true, "75"), "0");
  assert.equal(normalizeStatusBarProgressRaw(true, undefined), "0");
  assert.equal(normalizeStatusBarProgressRaw(false, "75"), "");
  assert.equal(getStatusBarProgressInspectorValue(true, "75"), "0");
  assert.equal(getStatusBarProgressInspectorValue(false, "75"), "");
});
