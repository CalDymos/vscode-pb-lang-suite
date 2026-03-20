import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWindowFlagsExpr, parseWindowCustomFlagsInput, WINDOW_KNOWN_FLAGS } from '../src/core/windowInspectorUtils';

test('buildWindowFlagsExpr keeps original known window flag order and appends custom flags', () => {
  const expr = buildWindowFlagsExpr([
    '#PB_Window_NoActivate',
    '#PB_Window_SystemMenu',
    '#PB_Window_SizeGadget'
  ], '#PB_Window_CustomBeta | #PB_Window_CustomAlpha');

  assert.equal(
    expr,
    '#PB_Window_SystemMenu | #PB_Window_SizeGadget | #PB_Window_NoActivate | #PB_Window_CustomBeta | #PB_Window_CustomAlpha'
  );
});

test('parseWindowCustomFlagsInput removes known flags and duplicates', () => {
  const flags = parseWindowCustomFlagsInput('#PB_Window_SystemMenu | #PB_Window_CustomA | #PB_Window_CustomA | #PB_Window_CustomB');
  assert.deepEqual(flags, ['#PB_Window_CustomA', '#PB_Window_CustomB']);
});

test('window known flags list matches original PureBasic declaration order', () => {
  assert.deepEqual(WINDOW_KNOWN_FLAGS, [
    '#PB_Window_SystemMenu',
    '#PB_Window_MinimizeGadget',
    '#PB_Window_MaximizeGadget',
    '#PB_Window_SizeGadget',
    '#PB_Window_Invisible',
    '#PB_Window_TitleBar',
    '#PB_Window_Tool',
    '#PB_Window_BorderLess',
    '#PB_Window_ScreenCentered',
    '#PB_Window_WindowCentered',
    '#PB_Window_Maximize',
    '#PB_Window_Minimize',
    '#PB_Window_NoGadgets',
    '#PB_Window_NoActivate'
  ]);
});
