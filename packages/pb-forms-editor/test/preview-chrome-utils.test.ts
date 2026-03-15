import test from "node:test";
import assert from "node:assert/strict";
import {
  getScrollAreaHorizontalBarRect,
  getScrollAreaHorizontalThumbRect,
  getScrollAreaMaxOffsetX,
  getScrollAreaMaxOffsetY,
  getScrollAreaVerticalBarRect,
  getScrollAreaVerticalThumbRect,
  getSplitterBarRect,
  intersectRect,
  isPointOnRectBorder,
  rectContainsPoint,
  type PreviewChromeMetrics,
  type PreviewRect
} from "../src/core/previewChromeUtils";

const METRICS: PreviewChromeMetrics = {
  panelHeight: 22,
  scrollAreaWidth: 20,
  splitterWidth: 9
};

const RECT: PreviewRect = { x: 10, y: 20, w: 120, h: 80 };

test("detects points on rect border but not in the inner area", () => {
  assert.equal(isPointOnRectBorder(RECT, 10, 40), true);
  assert.equal(isPointOnRectBorder(RECT, 14, 24), true);
  assert.equal(isPointOnRectBorder(RECT, 60, 60), false);
  assert.equal(isPointOnRectBorder(RECT, 200, 200), false);
});

test("computes scrollarea chrome bars without overlapping the viewport corner", () => {
  const vertical = getScrollAreaVerticalBarRect(RECT, METRICS);
  const horizontal = getScrollAreaHorizontalBarRect(RECT, METRICS);
  const overlap = intersectRect(vertical, horizontal);

  assert.deepEqual(vertical, { x: 110, y: 20, w: 20, h: 60 });
  assert.deepEqual(horizontal, { x: 10, y: 80, w: 100, h: 20 });
  assert.equal(overlap.w, 0);
  assert.equal(overlap.h, 0);
});

test("computes a vertical splitter bar from state and width", () => {
  const bar = getSplitterBarRect(RECT, true, METRICS.splitterWidth, 30);
  assert.deepEqual(bar, { x: 40, y: 20, w: 9, h: 80 });
  assert.equal(rectContainsPoint(bar, 44, 50), true);
  assert.equal(rectContainsPoint(bar, 70, 50), false);
});

test("computes a horizontal splitter bar and clamps oversized state", () => {
  const bar = getSplitterBarRect(RECT, false, METRICS.splitterWidth, 999);
  assert.deepEqual(bar, { x: 10, y: 91, w: 120, h: 9 });
  assert.equal(rectContainsPoint(bar, 60, 95), true);
  assert.equal(rectContainsPoint(bar, 60, 70), false);
});


test("computes scrollarea thumb rects from inner size and offset", () => {
  assert.equal(getScrollAreaMaxOffsetX(RECT, METRICS, 240), 140);
  assert.equal(getScrollAreaMaxOffsetY(RECT, METRICS, 180), 120);

  const verticalThumb = getScrollAreaVerticalThumbRect(RECT, METRICS, 180, 60);
  const horizontalThumb = getScrollAreaHorizontalThumbRect(RECT, METRICS, 240, 70);

  assert.deepEqual(verticalThumb, { x: 110, y: 40, w: 20, h: 20 });
  assert.deepEqual(horizontalThumb, { x: 39, y: 80, w: 42, h: 20 });
});
