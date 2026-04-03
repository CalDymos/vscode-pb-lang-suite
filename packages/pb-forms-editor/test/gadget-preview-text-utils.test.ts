import test from 'node:test';
import assert from 'node:assert/strict';
import { getPreviewComboTextX, getPreviewGadgetText, getPreviewListHeaderTextY, getPreviewListRowAdvance, getPreviewTextLikeTextPosition } from '../src/core/preview/gadget-text';

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


test('getPreviewTextLikeTextPosition keeps TextGadget and HyperLinkGadget captions top-aligned like FD_DrawGadget', () => {
  assert.deepEqual(
    getPreviewTextLikeTextPosition({ x: 20, y: 12, width: 120, textWidth: 36 }),
    { x: 21, y: 12 }
  );
});

test('getPreviewTextLikeTextPosition preserves original right and center alignment on the top baseline', () => {
  assert.deepEqual(
    getPreviewTextLikeTextPosition({ x: 20, y: 12, width: 120, textWidth: 36, flagsExpr: '#PB_Text_Right' }),
    { x: 103, y: 12 }
  );
  assert.deepEqual(
    getPreviewTextLikeTextPosition({ x: 20, y: 12, width: 120, textWidth: 36, flagsExpr: '#PB_Text_Center' }),
    { x: 62, y: 12 }
  );
});


test('getPreviewListRowAdvance follows FD_DrawGadget item spacing for tree and list-like gadgets', () => {
  assert.equal(getPreviewListRowAdvance('tree', 12), 18);
  assert.equal(getPreviewListRowAdvance('listview', 12), 16);
  assert.equal(getPreviewListRowAdvance('listicon', 15), 19);
  assert.equal(getPreviewListRowAdvance('explorerlist', 10), 14);
});


test('getPreviewListHeaderTextY follows the original header baseline split for ListIcon and ExplorerList', () => {
  assert.equal(getPreviewListHeaderTextY('listicon', 40), 40);
  assert.equal(getPreviewListHeaderTextY('explorerlist', 40), 42);
});


test('getPreviewComboTextX follows the original editable/non-editable combo text inset split', () => {
  assert.equal(getPreviewComboTextX({ x: 20, isEditable: true, osSkin: 'windows7' }), 23);
  assert.equal(getPreviewComboTextX({ x: 20, isEditable: false, osSkin: 'windows7' }), 24);
  assert.equal(getPreviewComboTextX({ x: 20, isEditable: false, osSkin: 'linux' }), 24);
  assert.equal(getPreviewComboTextX({ x: 20, isEditable: false, osSkin: 'macos' }), 26);
});
