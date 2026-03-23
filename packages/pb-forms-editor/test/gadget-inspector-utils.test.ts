import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGadgetCheckedStateRaw,
  buildGadgetHorizontalLockResizeUpdate,
  buildGadgetVerticalLockResizeUpdate,
  buildGadgetTextRaw,
  buildGadgetTooltipRaw,
  canEditGadgetCheckedState,
  canEditGadgetColors,
  canEditGadgetHorizontalLocks,
  canEditGadgetText,
  getGadgetCtorRangeFieldLabels,
  getCustomGadgetHelpDisplay,
  getGadgetCaptionFieldConfig,
  getGadgetCurrentImageDisplay,
  getGadgetCtorRangeInspectorValue,
  getGadgetFontDisplaySummary,
  getGadgetTextInspectorValue,
  getGadgetTooltipInspectorValue
} from "../src/core/gadgetInspectorUtils";

test("marks original text-capable gadget constructors as caption-editable", () => {
  assert.equal(canEditGadgetText("StringGadget"), true);
  assert.equal(canEditGadgetText("ButtonGadget"), true);
  assert.equal(canEditGadgetText("OptionGadget"), true);
  assert.equal(canEditGadgetText("CustomGadget"), true);
  assert.equal(canEditGadgetText("ImageGadget"), false);
  assert.equal(canEditGadgetText("ProgressBarGadget"), false);
});

test("marks original color-capable gadget kinds for front/back color editing", () => {
  assert.equal(canEditGadgetColors("TextGadget"), true);
  assert.equal(canEditGadgetColors("ScrollAreaGadget"), true);
  assert.equal(canEditGadgetColors("ProgressBarGadget"), true);
  assert.equal(canEditGadgetColors("ButtonGadget"), false);
  assert.equal(canEditGadgetColors("ImageGadget"), false);
});


test("marks original checkbox/option gadget kinds as checked-state editable", () => {
  assert.equal(canEditGadgetCheckedState("CheckBoxGadget"), true);
  assert.equal(canEditGadgetCheckedState("OptionGadget"), true);
  assert.equal(canEditGadgetCheckedState("SplitterGadget"), false);
});

test("builds original saved checked-state raw values for checkbox and option gadgets", () => {
  assert.equal(buildGadgetCheckedStateRaw("CheckBoxGadget", true), "#PB_Checkbox_Checked");
  assert.equal(buildGadgetCheckedStateRaw("OptionGadget", true), "1");
  assert.equal(buildGadgetCheckedStateRaw("CheckBoxGadget", false), undefined);
  assert.equal(buildGadgetCheckedStateRaw("ImageGadget", true), undefined);
});

test("builds gadget caption raw values for literal and variable modes without trimming variable input", () => {
  assert.equal(buildGadgetTextRaw("Hello", false), '"Hello"');
  assert.equal(buildGadgetTextRaw("VarCaption$", true), "VarCaption$");
  assert.equal(buildGadgetTextRaw("", false), '""');
  assert.equal(buildGadgetTextRaw("  VarCaption$  ", true), "  VarCaption$  ");
});

test("builds gadget tooltip raw values for literal, variable and cleared modes without trimming variable input", () => {
  assert.equal(buildGadgetTooltipRaw("Tooltip text", false), '"Tooltip text"');
  assert.equal(buildGadgetTooltipRaw("Tooltip$", true), "Tooltip$");
  assert.equal(buildGadgetTooltipRaw("", false), undefined);
  assert.equal(buildGadgetTooltipRaw("  Tooltip$  ", true), "  Tooltip$  ");
});

test("returns the original caption field behavior for Date, Scintilla, Editor and Canvas gadgets", () => {
  assert.deepEqual(getGadgetCaptionFieldConfig("DateGadget"), {
    label: "Mask",
    textEditable: true,
    variableToggleEditable: true
  });
  assert.deepEqual(getGadgetCaptionFieldConfig("ScintillaGadget"), {
    label: "Callback",
    textEditable: true,
    variableToggleEditable: false
  });
  assert.deepEqual(getGadgetCaptionFieldConfig("EditorGadget"), {
    label: "Caption",
    textEditable: false,
    variableToggleEditable: true
  });
  assert.deepEqual(getGadgetCaptionFieldConfig("CanvasGadget"), {
    label: "Caption",
    textEditable: false,
    variableToggleEditable: true
  });
  assert.equal(getGadgetCaptionFieldConfig("ImageGadget"), undefined);
});


test("returns the original range/scrollarea field labels for constructor-bound gadget fields", () => {
  assert.deepEqual(getGadgetCtorRangeFieldLabels("ProgressBarGadget"), {
    minLabel: "Min",
    maxLabel: "Max",
    title: "Matches the original Min / Max constructor arguments."
  });
  assert.deepEqual(getGadgetCtorRangeFieldLabels("ScrollAreaGadget"), {
    minLabel: "InnerWidth",
    maxLabel: "InnerHeight",
    title: "Matches the original InnerWidth / InnerHeight constructor arguments."
  });
  assert.equal(getGadgetCtorRangeFieldLabels("ButtonGadget"), undefined);
});



test("covers the full original constructor-range gadget matrix after the FD-042c audit", () => {
  assert.deepEqual(getGadgetCtorRangeFieldLabels("SpinGadget"), {
    minLabel: "Min",
    maxLabel: "Max",
    title: "Matches the original Min / Max constructor arguments."
  });
  assert.deepEqual(getGadgetCtorRangeFieldLabels("TrackBarGadget"), {
    minLabel: "Min",
    maxLabel: "Max",
    title: "Matches the original Min / Max constructor arguments."
  });
  assert.deepEqual(getGadgetCtorRangeFieldLabels("ScrollBarGadget"), {
    minLabel: "Min",
    maxLabel: "Max",
    title: "Matches the original Min / Max constructor arguments."
  });
  assert.deepEqual(getGadgetCtorRangeFieldLabels("ProgressBarGadget"), {
    minLabel: "Min",
    maxLabel: "Max",
    title: "Matches the original Min / Max constructor arguments."
  });
  assert.deepEqual(getGadgetCtorRangeFieldLabels("ScrollAreaGadget"), {
    minLabel: "InnerWidth",
    maxLabel: "InnerHeight",
    title: "Matches the original InnerWidth / InnerHeight constructor arguments."
  });
});

test("keeps the checked-state matrix limited to the original checkbox and option gadgets", () => {
  assert.equal(canEditGadgetCheckedState("CheckBoxGadget"), true);
  assert.equal(canEditGadgetCheckedState("OptionGadget"), true);
  assert.equal(canEditGadgetCheckedState("CustomGadget"), false);
  assert.equal(canEditGadgetCheckedState("ButtonGadget"), false);
});

test("resolves constructor-bound gadget field inspector values from raw or parsed numbers", () => {
  assert.equal(getGadgetCtorRangeInspectorValue("MinValue", 5), "MinValue");
  assert.equal(getGadgetCtorRangeInspectorValue(undefined, 95), "95");
  assert.equal(getGadgetCtorRangeInspectorValue(undefined, undefined), "");
});

test("prefers the parsed form image path for gadget CurrentImage display", () => {
  assert.equal(getGadgetCurrentImageDisplay({ imageRaw: "ImageID(#ImgOpen)" }, { image: "images/open.png" }), "images/open.png");
  assert.equal(getGadgetCurrentImageDisplay({ imageRaw: "ImageID(#ImgInline)" }, { imageRaw: "?toolbar_open" }), "?toolbar_open");
  assert.equal(getGadgetCurrentImageDisplay({ imageRaw: "0" }), "0");
});
test("resolves inspector display values from raw gadget caption and tooltip expressions", () => {
  assert.equal(getGadgetTextInspectorValue({ textRaw: '"Caption"', text: "Caption" }), "Caption");
  assert.equal(getGadgetTextInspectorValue({ textRaw: "Caption$", text: "Caption$", textVariable: true }), "Caption$");
  assert.equal(getGadgetTooltipInspectorValue({ tooltipRaw: '"Hint"', tooltip: "Hint" }), "Hint");
  assert.equal(getGadgetTooltipInspectorValue({ tooltipRaw: "ToolTip$", tooltip: "ToolTip$", tooltipVariable: true }), "ToolTip$");
});

test("formats parsed gadget font metadata into a compact display summary", () => {
  assert.equal(
    getGadgetFontDisplaySummary({
      gadgetFontRaw: "FontID(#FontBody)",
      gadgetFont: "Segoe UI",
      gadgetFontSize: 9,
      gadgetFontFlagsRaw: "#PB_Font_Bold"
    }),
    "Segoe UI 9 (#PB_Font_Bold)"
  );
  assert.equal(getGadgetFontDisplaySummary({ gadgetFontRaw: "FontID(#FontBody)" }), "FontID(#FontBody)");
  assert.equal(getGadgetFontDisplaySummary({}), "");
});


test("returns the original custom-gadget help placeholder line", () => {
  assert.equal(getCustomGadgetHelpDisplay(), "%id% %x% %y% %w% %h% %txt% %hwnd% ");
});


test("enables horizontal lock editing only for top-level gadgets with an existing ResizeGadget line", () => {
  assert.equal(canEditGadgetHorizontalLocks({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: true,
    lockRight: true,
    lockTop: true,
    lockBottom: false
  }, { w: 320 }), true);

  assert.equal(canEditGadgetHorizontalLocks({
    parentId: "#Container",
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: true,
    lockRight: true,
    lockTop: true,
    lockBottom: false
  }, { w: 320 }), false);
});

test("builds a horizontal resize update that matches the original right-anchor formulas", () => {
  const update = buildGadgetHorizontalLockResizeUpdate({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: true,
    lockRight: false,
    lockTop: true,
    lockBottom: false
  }, { w: 320 }, false, true);

  assert.deepEqual(update, {
    xRaw: "FormWindowWidth - 310",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24"
  });
});

test("returns a delete instruction when horizontal locks no longer require ResizeGadget emission", () => {
  const update = buildGadgetHorizontalLockResizeUpdate({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: false,
    lockRight: true,
    lockTop: true,
    lockBottom: false,
    resizeXRaw: "FormWindowWidth - 310",
    resizeYRaw: "20",
    resizeWRaw: "80",
    resizeHRaw: "24"
  }, { w: 320 }, true, false);

  assert.deepEqual(update, { deleteResize: true });
});


test("builds a vertical resize update that safely drops stretch-height back to the base gadget height", () => {
  const update = buildGadgetVerticalLockResizeUpdate({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: true,
    lockRight: false,
    lockTop: true,
    lockBottom: true,
    resizeXRaw: "10",
    resizeYRaw: "20",
    resizeWRaw: "80",
    resizeHRaw: "FormWindowHeight - 120"
  }, { w: 320, h: 220 }, true, false);

  assert.deepEqual(update, { deleteResize: true });
});

test("preserves current horizontal resize formulas when a verified vertical lock transition is patched", () => {
  const update = buildGadgetVerticalLockResizeUpdate({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: false,
    lockRight: true,
    lockTop: true,
    lockBottom: true,
    resizeXRaw: "FormWindowWidth - 310",
    resizeYRaw: "20",
    resizeWRaw: "80",
    resizeHRaw: "FormWindowHeight - 120"
  }, { w: 320, h: 220 }, true, false);

  assert.deepEqual(update, {
    xRaw: "FormWindowWidth - 310",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24"
  });
});



test("preserves horizontal-only ResizeGadget emission when both vertical locks are turned off", () => {
  const update = buildGadgetVerticalLockResizeUpdate({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: false,
    lockRight: true,
    lockTop: true,
    lockBottom: false,
    resizeXRaw: "FormWindowWidth - 310",
    resizeYRaw: "20",
    resizeWRaw: "80",
    resizeHRaw: "24"
  }, { w: 320, h: 220 }, false, false);

  assert.deepEqual(update, {
    xRaw: "FormWindowWidth - 310",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24"
  });
});

test("derives the original top-level bottom-anchor formula from the preserved constructor y expression", () => {
  const update = buildGadgetVerticalLockResizeUpdate({
    x: 10,
    y: 10,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "ToolBarHeight(0) + 10",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: true,
    lockRight: false,
    lockTop: true,
    lockBottom: true,
    resizeXRaw: "10",
    resizeYRaw: "ToolBarHeight(0) + 10",
    resizeWRaw: "80",
    resizeHRaw: "FormWindowHeight - StatusBarHeight(0) - ToolBarHeight(0) - 120"
  }, { w: 320, h: 220 }, false, true);

  assert.deepEqual(update, {
    xRaw: "10",
    yRaw: "ToolBarHeight(0) + FormWindowHeight - 210",
    wRaw: "80",
    hRaw: "24"
  });
});

test("rebuilds the original top-level stretch-height formula for the current host skin", () => {
  const update = buildGadgetVerticalLockResizeUpdate({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: true,
    lockRight: false,
    lockTop: true,
    lockBottom: false,
    resizeXRaw: "10",
    resizeYRaw: "20",
    resizeWRaw: "80",
    resizeHRaw: "24"
  }, { w: 320, h: 220, menuCount: 1, toolbarCount: 1, statusBarCount: 1, platformSkin: "windows" }, true, true);

  assert.deepEqual(update, {
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "FormWindowHeight - MenuHeight() - ToolBarHeight(0) - StatusBarHeight(0) - 127"
  });
});

test("uses the original linux height constants when rebuilding a top-level stretch-height formula", () => {
  const update = buildGadgetVerticalLockResizeUpdate({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: true,
    lockRight: false,
    lockTop: true,
    lockBottom: false,
    resizeXRaw: "10",
    resizeYRaw: "20",
    resizeWRaw: "80",
    resizeHRaw: "24"
  }, { w: 320, h: 220, menuCount: 1, toolbarCount: 1, statusBarCount: 1, platformSkin: "linux" }, true, true);

  assert.deepEqual(update, {
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "FormWindowHeight - MenuHeight() - StatusBarHeight(0) - 142"
  });
});

test("keeps blocking top-level stretch-height synthesis when the host skin is unknown", () => {
  const update = buildGadgetVerticalLockResizeUpdate({
    x: 10,
    y: 20,
    w: 80,
    h: 24,
    xRaw: "10",
    yRaw: "20",
    wRaw: "80",
    hRaw: "24",
    resizeSource: { line: 12 },
    lockLeft: true,
    lockRight: false,
    lockTop: true,
    lockBottom: false,
    resizeXRaw: "10",
    resizeYRaw: "20",
    resizeWRaw: "80",
    resizeHRaw: "24"
  }, { w: 320, h: 220, menuCount: 1, toolbarCount: 1, statusBarCount: 1 }, true, true);

  assert.equal(update, undefined);
});
