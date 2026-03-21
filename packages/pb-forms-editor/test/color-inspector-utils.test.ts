import test from 'node:test';
import assert from 'node:assert/strict';
import { cssHexToPbRgbRaw, normalizeCssHexColor, pbColorNumberToCssHex } from '../src/core/colorInspectorUtils';

test('pbColorNumberToCssHex converts PB color integers to css hex', () => {
  assert.equal(pbColorNumberToCssHex(0x332211), '#112233');
  assert.equal(pbColorNumberToCssHex(0x000000), '#000000');
  assert.equal(pbColorNumberToCssHex(undefined), undefined);
});

test('cssHexToPbRgbRaw converts css hex to PB RGB literal', () => {
  assert.equal(cssHexToPbRgbRaw('#112233'), 'RGB(17,34,51)');
  assert.equal(cssHexToPbRgbRaw('#abcdef'), 'RGB(171,205,239)');
  assert.equal(cssHexToPbRgbRaw('bad'), undefined);
});

test('normalizeCssHexColor accepts only full css hex colors', () => {
  assert.equal(normalizeCssHexColor('#A1B2C3'), '#a1b2c3');
  assert.equal(normalizeCssHexColor('#123'), undefined);
  assert.equal(normalizeCssHexColor(''), undefined);
});
