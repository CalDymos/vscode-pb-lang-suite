import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWindowFlagsExpr, getWindowBooleanInspectorState, getWindowParentAsRawExpression, getWindowParentAsRawExpressionWithOverride, getWindowParentInspectorValue, getWindowPositionInspectorValue, getWindowPreviewChromeTopPadding, getWindowPreviewTitleBarHeight, getWindowPreviewTitleButtons, getWindowVariableInspectorValue, hasWindowPreviewTitleBar, hasWindowPreviewTitleIcon, parseWindowCustomFlagsInput, parseWindowEventProcInspectorInput, parseWindowParentInspectorInput, parseWindowPositionInspectorInput, parseWindowVariableNameInspectorInput, WINDOW_KNOWN_FLAGS, WINDOW_POSITION_IGNORE_LITERAL } from '../src/core/windowInspectorUtils';

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

test('window variable inspector display uses the exact parsed variable without fallback synthesis', () => {
  assert.equal(getWindowVariableInspectorValue('Window_Main'), 'Window_Main');
  assert.equal(getWindowVariableInspectorValue('  Window_Main  '), '  Window_Main  ');
  assert.equal(getWindowVariableInspectorValue(undefined), '');
});

test('window variable inspector input restores the current value when cleared', () => {
  assert.deepEqual(parseWindowVariableNameInspectorInput('', 'Window_0'), {
    ok: false,
    fallbackValue: 'Window_0'
  });

  assert.deepEqual(parseWindowVariableNameInspectorInput('  winMain  ', 'Window_0'), {
    ok: true,
    value: '  winMain  '
  });

  assert.deepEqual(parseWindowVariableNameInspectorInput('', '  Window_0  '), {
    ok: false,
    fallbackValue: '  Window_0  '
  });
});


test('window hidden/disabled inspector state prefers parsed booleans and treats raw 0 as unchecked', () => {
  assert.equal(getWindowBooleanInspectorState('0', undefined), false);
  assert.equal(getWindowBooleanInspectorState('1', undefined), true);
  assert.equal(getWindowBooleanInspectorState('HiddenExpr()', undefined), true);
  assert.equal(getWindowBooleanInspectorState('1', false), false);
  assert.equal(getWindowBooleanInspectorState(undefined, true), true);
});


test('window parent inspector displays wrapped and raw parent expressions without the internal marker syntax', () => {
  assert.equal(getWindowParentInspectorValue('WindowID(#FrmParent)', '#FrmParent'), '#FrmParent');
  assert.equal(getWindowParentInspectorValue('ParentWindow', '=ParentWindow'), 'ParentWindow');
  assert.equal(getWindowParentInspectorValue(undefined, '=ParentWindow'), 'ParentWindow');
  assert.equal(getWindowParentInspectorValue(undefined, '#FrmParent'), '#FrmParent');
  assert.equal(getWindowParentInspectorValue(undefined, undefined), '');
});

test('window parent inspector derives the raw-expression toggle from the parsed parent form', () => {
  assert.equal(getWindowParentAsRawExpression('WindowID(#FrmParent)', '#FrmParent'), false);
  assert.equal(getWindowParentAsRawExpression('ParentWindow', '=ParentWindow'), true);
  assert.equal(getWindowParentAsRawExpression(undefined, '=ParentWindow'), true);
  assert.equal(getWindowParentAsRawExpression(undefined, '#FrmParent'), false);
});

test('window parent inspector override keeps the checkbox state even before a parent expression exists', () => {
  assert.equal(getWindowParentAsRawExpressionWithOverride(undefined, undefined, true), true);
  assert.equal(getWindowParentAsRawExpressionWithOverride(undefined, undefined, false), false);
  assert.equal(getWindowParentAsRawExpressionWithOverride('WindowID(#FrmParent)', '#FrmParent', undefined), false);
  assert.equal(getWindowParentAsRawExpressionWithOverride('ParentWindow', '=ParentWindow', undefined), true);
});

test('window parent inspector input preserves the user expression and only toggles WindowID(...) wrapping', () => {
  assert.deepEqual(parseWindowParentInspectorInput('#FrmParent', false), {
    raw: 'WindowID(#FrmParent)',
    storedValue: '#FrmParent'
  });

  assert.deepEqual(parseWindowParentInspectorInput('  #FrmParent  ', false), {
    raw: 'WindowID(  #FrmParent  )',
    storedValue: '  #FrmParent  '
  });

  assert.deepEqual(parseWindowParentInspectorInput('ParentWindow', true), {
    raw: 'ParentWindow',
    storedValue: 'ParentWindow'
  });

  assert.deepEqual(parseWindowParentInspectorInput('', true), {
    raw: '',
    storedValue: undefined
  });
});





test('parseWindowEventProcInspectorInput preserves surrounding whitespace', () => {
  assert.deepEqual(parseWindowEventProcInspectorInput('  HandleMain  '), {
    raw: '  HandleMain  ',
    storedValue: '  HandleMain  ' 
  });

  assert.deepEqual(parseWindowEventProcInspectorInput(''), {
    raw: '',
    storedValue: undefined
  });
});


test('window preview title bar follows the original SystemMenu/TitleBar flag gate', () => {
  assert.equal(hasWindowPreviewTitleBar('#PB_Window_SystemMenu | #PB_Window_SizeGadget'), true);
  assert.equal(hasWindowPreviewTitleBar('#PB_Window_TitleBar'), true);
  assert.equal(hasWindowPreviewTitleBar('#PB_Window_SizeGadget | #PB_Window_BorderLess'), false);
  assert.equal(hasWindowPreviewTitleBar(undefined), false);
});

test('window preview title bar height collapses to zero without SystemMenu or TitleBar', () => {
  assert.equal(getWindowPreviewTitleBarHeight('#PB_Window_SystemMenu', 26), 26);
  assert.equal(getWindowPreviewTitleBarHeight('#PB_Window_TitleBar', 26), 26);
  assert.equal(getWindowPreviewTitleBarHeight('#PB_Window_SizeGadget', 26), 0);
  assert.equal(getWindowPreviewTitleBarHeight(undefined, 26), 0);
});


test('window preview title buttons follow the original close/minimize/maximize flag visibility', () => {
  assert.deepEqual(getWindowPreviewTitleButtons('#PB_Window_SystemMenu'), {
    showClose: true,
    showMinimize: false,
    showMaximize: false,
  });

  assert.deepEqual(getWindowPreviewTitleButtons('#PB_Window_TitleBar | #PB_Window_MinimizeGadget'), {
    showClose: true,
    showMinimize: true,
    showMaximize: false,
  });

  assert.deepEqual(getWindowPreviewTitleButtons('#PB_Window_SystemMenu | #PB_Window_MinimizeGadget | #PB_Window_MaximizeGadget'), {
    showClose: true,
    showMinimize: true,
    showMaximize: true,
  });

  assert.deepEqual(getWindowPreviewTitleButtons('#PB_Window_SizeGadget'), {
    showClose: false,
    showMinimize: false,
    showMaximize: false,
  });
});


test('window preview title icon follows the original Windows title-bar path only', () => {
  assert.equal(hasWindowPreviewTitleIcon('windows', '#PB_Window_SystemMenu'), true);
  assert.equal(hasWindowPreviewTitleIcon('windows', '#PB_Window_TitleBar'), true);
  assert.equal(hasWindowPreviewTitleIcon('linux', '#PB_Window_SystemMenu'), false);
  assert.equal(hasWindowPreviewTitleIcon('macos', '#PB_Window_SystemMenu'), false);
  assert.equal(hasWindowPreviewTitleIcon('windows', '#PB_Window_SizeGadget'), false);
  assert.equal(hasWindowPreviewTitleIcon(undefined, '#PB_Window_SystemMenu'), false);
});


test('window preview chrome top padding keeps the original 8px Windows inset when no title bar is present', () => {
  assert.equal(getWindowPreviewChromeTopPadding('windows', '#PB_Window_SystemMenu', 26), 26);
  assert.equal(getWindowPreviewChromeTopPadding('windows', '#PB_Window_SizeGadget', 26), 8);
  assert.equal(getWindowPreviewChromeTopPadding('windows', undefined, 26), 8);
  assert.equal(getWindowPreviewChromeTopPadding('linux', '#PB_Window_SizeGadget', 26), 0);
  assert.equal(getWindowPreviewChromeTopPadding('macos', undefined, 26), 0);
});
