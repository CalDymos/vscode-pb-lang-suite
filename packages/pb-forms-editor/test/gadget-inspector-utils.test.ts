import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGadgetCheckedStateRaw,
  buildGadgetTextRaw,
  buildGadgetTooltipRaw,
  canEditGadgetCheckedState,
  canEditGadgetColors,
  canEditGadgetText,
  getGadgetCtorRangeFieldLabels,
  getCustomGadgetHelpDisplay,
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

test("builds gadget caption raw values for literal and variable modes", () => {
  assert.equal(buildGadgetTextRaw("Hello", false), '"Hello"');
  assert.equal(buildGadgetTextRaw("VarCaption$", true), "VarCaption$");
  assert.equal(buildGadgetTextRaw("", false), '""');
  assert.equal(buildGadgetTextRaw("   ", true), '""');
});

test("builds gadget tooltip raw values for literal, variable and cleared modes", () => {
  assert.equal(buildGadgetTooltipRaw("Tooltip text", false), '"Tooltip text"');
  assert.equal(buildGadgetTooltipRaw("Tooltip$", true), "Tooltip$");
  assert.equal(buildGadgetTooltipRaw("", false), undefined);
  assert.equal(buildGadgetTooltipRaw("   ", true), undefined);
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

test("resolves constructor-bound gadget field inspector values from raw or parsed numbers", () => {
  assert.equal(getGadgetCtorRangeInspectorValue("MinValue", 5), "MinValue");
  assert.equal(getGadgetCtorRangeInspectorValue(undefined, 95), "95");
  assert.equal(getGadgetCtorRangeInspectorValue(undefined, undefined), "");
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
