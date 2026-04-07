import test from "node:test";
import assert from "node:assert/strict";

import {
  formatDisplayedLayoutUnscaledValue,
  getDisplayedLayoutValue,
  getLayoutDpiScale,
  getStableDisplayedLayoutValue,
  isLayoutDpiScalingActive,
  parseUnscaledLayoutRaw,
  unscaleDisplayedLayoutValue,
} from "../src/core/utils/layout-dpi";

test("normalizes the active layout DPI scale from the device pixel ratio", () => {
  assert.equal(getLayoutDpiScale(undefined), 1);
  assert.equal(getLayoutDpiScale(1), 1);
  assert.equal(getLayoutDpiScale(1.3333333333), 1.33);
});

test("detects whether layout DPI scaling is active", () => {
  assert.equal(isLayoutDpiScalingActive(1), false);
  assert.equal(isLayoutDpiScalingActive(1.25), true);
});

test("parses numeric unscaled layout literals and ignores expressions", () => {
  assert.equal(parseUnscaledLayoutRaw("10"), 10);
  assert.equal(parseUnscaledLayoutRaw("  -5  "), -5);
  assert.equal(parseUnscaledLayoutRaw("#PB_Ignore"), undefined);
  assert.equal(parseUnscaledLayoutRaw("FormWindowWidth - 10"), undefined);
});

test("maps displayed layout values back to unscaled code values", () => {
  assert.equal(unscaleDisplayedLayoutValue(10, 1.33), 8);
  assert.equal(unscaleDisplayedLayoutValue(11, 1.33), 8);
  assert.equal(unscaleDisplayedLayoutValue(15, 1.33), 11);
});

test("uses a stable lower-bound representative when rebuilding displayed layout values from code", () => {
  assert.equal(getStableDisplayedLayoutValue(8, 1.33), 10);
  assert.equal(getStableDisplayedLayoutValue(11, 1.33), 14);
  assert.equal(getDisplayedLayoutValue("8", 0, 1.33), 10);
});

test("formats readonly unscaled inspector values from the current displayed layout value", () => {
  assert.equal(formatDisplayedLayoutUnscaledValue("8", 10, 1.33), "8");
  assert.equal(formatDisplayedLayoutUnscaledValue("", 10, 1.33), "8");
  assert.equal(formatDisplayedLayoutUnscaledValue("#PB_Ignore", 0, 1.33), "#PB_Ignore");
});
