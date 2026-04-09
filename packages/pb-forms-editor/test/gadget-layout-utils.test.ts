import test from "node:test";
import assert from "node:assert/strict";
import {
  inferGadgetCtorLocks,
  resolveGadgetCtorPreviewLocalRect,
} from "../src/core/gadget/layout";

test("infers original constructor locks from window-relative layout expressions", () => {
  assert.deepEqual(inferGadgetCtorLocks({
    xRaw: "FormWindowWidth - 180",
    yRaw: "ToolBarHeight(0) + FormWindowHeight - 210",
    wRaw: "80",
    hRaw: "FormWindowHeight - StatusBarHeight(0) - 120",
  }), {
    lockLeft: false,
    lockRight: true,
    lockTop: true,
    lockBottom: true,
  });

  assert.deepEqual(inferGadgetCtorLocks({
    xRaw: "10",
    yRaw: "ToolBarHeight(0) + 10",
    wRaw: "FormWindowWidth - 40",
    hRaw: "25",
  }), {
    lockLeft: true,
    lockRight: true,
    lockTop: true,
    lockBottom: false,
  });
});

test("resolves stored constructor offsets into actual preview rects against the current extent", () => {
  assert.deepEqual(resolveGadgetCtorPreviewLocalRect({
    x: 180,
    y: 10,
    w: 80,
    h: 24,
    xRaw: "FormWindowWidth - 180",
    yRaw: "10",
    wRaw: "80",
    hRaw: "24",
  }, 320, 220), {
    x: 140,
    y: 10,
    w: 80,
    h: 24,
  });

  assert.deepEqual(resolveGadgetCtorPreviewLocalRect({
    x: 10,
    y: 10,
    w: 40,
    h: 120,
    xRaw: "10",
    yRaw: "ToolBarHeight(0) + 10",
    wRaw: "FormWindowWidth - 40",
    hRaw: "FormWindowHeight - StatusBarHeight(0) - 120",
  }, 320, 220), {
    x: 10,
    y: 10,
    w: 280,
    h: 100,
  });
});
