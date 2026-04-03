import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPreviewColumnHeaderTextStyle, buildPreviewGadgetTextStyle } from '../src/core/preview/gadget-font';

test('buildPreviewGadgetTextStyle falls back to a normal sans-serif preview font', () => {
  assert.deepEqual(
    buildPreviewGadgetTextStyle(undefined, 12),
    {
      font: 'normal normal 12px sans-serif',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikeOut: false,
      sizePx: 12,
      family: 'sans-serif'
    }
  );
});

test('buildPreviewGadgetTextStyle mirrors parsed gadget font family, size and PB font flags', () => {
  assert.deepEqual(
    buildPreviewGadgetTextStyle({
      gadgetFont: 'Segoe UI',
      gadgetFontSize: 9,
      gadgetFontFlagsRaw: '#PB_Font_Bold | #PB_Font_Italic | #PB_Font_Underline | #PB_Font_StrikeOut'
    }, 12),
    {
      font: 'italic bold 9px "Segoe UI"',
      isBold: true,
      isItalic: true,
      isUnderline: true,
      isStrikeOut: true,
      sizePx: 9,
      family: '"Segoe UI"'
    }
  );
});

test('buildPreviewGadgetTextStyle clamps non-positive sizes and keeps simple family names unquoted', () => {
  assert.deepEqual(
    buildPreviewGadgetTextStyle({
      gadgetFont: 'Tahoma',
      gadgetFontSize: 0,
      gadgetFontFlagsRaw: '#PB_Font_Bold'
    }, 12),
    {
      font: 'normal bold 1px Tahoma',
      isBold: true,
      isItalic: false,
      isUnderline: false,
      isStrikeOut: false,
      sizePx: 1,
      family: 'Tahoma'
    }
  );
});



test('buildPreviewColumnHeaderTextStyle returns the fixed column-header preview font', () => {
  assert.deepEqual(
    buildPreviewColumnHeaderTextStyle(11),
    {
      font: 'normal normal 11px sans-serif',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikeOut: false,
      sizePx: 11,
      family: 'sans-serif'
    }
  );
});
