import test from "node:test";
import assert from "node:assert/strict";
import {
  STATUSBAR_KNOWN_FLAGS,
  buildStatusBarFlagsRaw,
  getStatusBarFieldDisplaySummary,
  getStatusBarProgressPreviewMetrics,
  parseStatusBarWidth,
  splitPbFlags
} from "../src/core/statusbar/preview";

test("parses statusbar widths and ignores invalid or flexible values", () => {
  assert.equal(parseStatusBarWidth("120"), 120);
  assert.equal(parseStatusBarWidth(" 64.9 "), 64);
  assert.equal(parseStatusBarWidth("#PB_Ignore"), null);
  assert.equal(parseStatusBarWidth("-5"), null);
  assert.equal(parseStatusBarWidth("abc"), null);
});

test("splits and rebuilds statusbar flag expressions in known-order form", () => {
  assert.deepEqual(splitPbFlags("#PB_StatusBar_Right | custom | #PB_StatusBar_Center"), [
    "#PB_StatusBar_Right",
    "custom",
    "#PB_StatusBar_Center"
  ]);

  assert.equal(
    buildStatusBarFlagsRaw("custom | #PB_StatusBar_Right", {
      [STATUSBAR_KNOWN_FLAGS[2]]: true,
      [STATUSBAR_KNOWN_FLAGS[1]]: true
    }),
    "#PB_StatusBar_BorderLess | #PB_StatusBar_Center | #PB_StatusBar_Right | custom"
  );

  assert.equal(
    buildStatusBarFlagsRaw("#PB_StatusBar_Right", { [STATUSBAR_KNOWN_FLAGS[3]]: false }),
    undefined
  );
});

test("builds display summaries for label, image, progress and empty fields", () => {
  assert.equal(getStatusBarFieldDisplaySummary({ textRaw: '"Ready"', text: "Ready" }), "Label Ready");
  assert.equal(getStatusBarFieldDisplaySummary({ imageRaw: "#Img0", imageId: "#Img0" }), "Image #Img0");
  assert.equal(getStatusBarFieldDisplaySummary({ progressBar: true, progressRaw: "25" }), "Progress 25");
  assert.equal(getStatusBarFieldDisplaySummary({}), "Empty");
});


test("uses the fixed half-fill preview for statusbar progress bars with 2px side padding", () => {
  assert.deepEqual(getStatusBarProgressPreviewMetrics(90, 23, "0"), {
    progress: 0,
    trackWidth: 86,
    trackHeight: 13,
    fillWidth: 41
  });

  assert.deepEqual(getStatusBarProgressPreviewMetrics(90, 23, "50"), {
    progress: 50,
    trackWidth: 86,
    trackHeight: 13,
    fillWidth: 41
  });

  assert.deepEqual(getStatusBarProgressPreviewMetrics(6, 8, "abc"), {
    progress: 0,
    trackWidth: 2,
    trackHeight: 6,
    fillWidth: 0
  });
});
