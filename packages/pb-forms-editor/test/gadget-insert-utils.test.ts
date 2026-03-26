import test from 'node:test';
import assert from 'node:assert/strict';

import { insertedGadgetHasAmbiguousEmptyTextDefault, shouldInsertGadgetAsPbAny } from '../src/core/gadgetInsertUtils';

test('shouldInsertGadgetAsPbAny honours the configured default when provided', () => {
  const mixedIds = [
    { id: '#Button_0', pbAny: false, firstParam: '#Button_0' },
    { id: 'Button_1', pbAny: true, variable: 'Button_1', firstParam: '#PB_Any' }
  ];

  assert.equal(shouldInsertGadgetAsPbAny(mixedIds, true), true);
  assert.equal(shouldInsertGadgetAsPbAny(mixedIds, false), false);
});

test('shouldInsertGadgetAsPbAny keeps the legacy heuristic without an explicit setting', () => {
  assert.equal(
    shouldInsertGadgetAsPbAny([
      { id: 'Button_0', pbAny: true, variable: 'Button_0', firstParam: '#PB_Any' }
    ]),
    true
  );

  assert.equal(
    shouldInsertGadgetAsPbAny([
      { id: '#Button_0', pbAny: false, firstParam: '#Button_0' },
      { id: 'Button_1', pbAny: true, variable: 'Button_1', firstParam: '#PB_Any' }
    ]),
    false
  );
});


test('insertedGadgetHasAmbiguousEmptyTextDefault matches the constructor kinds that start with an empty caption literal', () => {
  assert.equal(insertedGadgetHasAmbiguousEmptyTextDefault('ButtonGadget'), true);
  assert.equal(insertedGadgetHasAmbiguousEmptyTextDefault('DateGadget'), true);
  assert.equal(insertedGadgetHasAmbiguousEmptyTextDefault('WebGadget'), true);
  assert.equal(insertedGadgetHasAmbiguousEmptyTextDefault('ListViewGadget'), false);
  assert.equal(insertedGadgetHasAmbiguousEmptyTextDefault('PanelGadget'), false);
  assert.equal(insertedGadgetHasAmbiguousEmptyTextDefault(undefined), false);
});
