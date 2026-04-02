import test from 'node:test';
import assert from 'node:assert/strict';
import { getPreviewGadgetText } from '../src/core/preview/gadget-text';

test('getPreviewGadgetText returns literal captions unchanged', () => {
  assert.equal(getPreviewGadgetText({ text: 'Apply', textVariable: false }, 'ButtonGadget'), 'Apply');
});

test('getPreviewGadgetText wraps variable captions in brackets like FD_DrawGadget', () => {
  assert.equal(getPreviewGadgetText({ text: 'Caption$', textVariable: true }, 'ButtonGadget'), '[Caption$]');
});

test('getPreviewGadgetText preserves fallback labels for empty captions', () => {
  assert.equal(getPreviewGadgetText({ text: '', textVariable: false }, 'ButtonGadget'), 'ButtonGadget');
  assert.equal(getPreviewGadgetText(undefined, 'SpinGadget'), 'SpinGadget');
});
