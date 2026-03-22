import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWindowFlagsExpr, getWindowBooleanInspectorState, getWindowPositionInspectorValue, parseWindowCustomFlagsInput, parseWindowParentInspectorInput, parseWindowPositionInspectorInput, parseWindowVariableNameInspectorInput, WINDOW_KNOWN_FLAGS, WINDOW_POSITION_IGNORE_LITERAL } from '../src/core/windowInspectorUtils';

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


test('window X/Y inspector values prefer #PB_Ignore over the internal sentinel', () => {
  assert.equal(getWindowPositionInspectorValue('#PB_Ignore', 0), WINDOW_POSITION_IGNORE_LITERAL);
  assert.equal(getWindowPositionInspectorValue(undefined, -65535), WINDOW_POSITION_IGNORE_LITERAL);
  assert.equal(getWindowPositionInspectorValue('12', 12), '12');
});

test('window X/Y inspector input accepts integers and #PB_Ignore only', () => {
  assert.deepEqual(parseWindowPositionInspectorInput('#PB_Ignore'), {
    ok: true,
    raw: '#PB_Ignore',
    previewValue: 0,
    isIgnore: true,
  });

  assert.deepEqual(parseWindowPositionInspectorInput('-24'), {
    ok: true,
    raw: '-24',
    previewValue: -24,
    isIgnore: false,
  });

  assert.deepEqual(parseWindowPositionInspectorInput('ScreenCentered'), {
    ok: false,
    error: 'Only integer values or #PB_Ignore are supported.'
  });
});

test('window variable inspector input restores the current value when cleared', () => {
  assert.deepEqual(parseWindowVariableNameInspectorInput('', 'Window_0'), {
    ok: false,
    fallbackValue: 'Window_0'
  });

  assert.deepEqual(parseWindowVariableNameInspectorInput('  winMain  ', 'Window_0'), {
    ok: true,
    value: 'winMain'
  });
});


test('window hidden/disabled inspector state prefers parsed booleans and treats raw 0 as unchecked', () => {
  assert.equal(getWindowBooleanInspectorState('0', undefined), false);
  assert.equal(getWindowBooleanInspectorState('1', undefined), true);
  assert.equal(getWindowBooleanInspectorState('HiddenExpr()', undefined), true);
  assert.equal(getWindowBooleanInspectorState('1', false), false);
  assert.equal(getWindowBooleanInspectorState(undefined, true), true);
});


test('window parent inspector input keeps the original text unchanged instead of trimming it', () => {
  assert.deepEqual(parseWindowParentInspectorInput('WindowID(#FrmParent)'), {
    raw: 'WindowID(#FrmParent)',
    storedValue: 'WindowID(#FrmParent)'
  });

  assert.deepEqual(parseWindowParentInspectorInput('  WindowID(#FrmParent)  '), {
    raw: '  WindowID(#FrmParent)  ',
    storedValue: '  WindowID(#FrmParent)  '
  });

  assert.deepEqual(parseWindowParentInspectorInput(''), {
    raw: '',
    storedValue: undefined
  });
});



