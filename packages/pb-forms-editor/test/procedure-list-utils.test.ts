import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProcedureNamesFromText, sortUniqueProcedureNames } from '../src/core/procedureListUtils';

test('extractProcedureNamesFromText returns real procedures and skips macros/comments', () => {
  const names = extractProcedureNamesFromText(`
; Procedure CommentedOut()
Macro Dummy()
  Procedure MacroProc()
EndMacro
Procedure.s HandleFrmMain(Event, Window)
Procedure HandleApply()
ProcedureDLL HandleDll()
ProcedureC HandleC(EventType)
`);

  assert.deepEqual(names, ['HandleFrmMain', 'HandleApply', 'HandleDll', 'HandleC']);
});

test('sortUniqueProcedureNames deduplicates case-insensitively and sorts alphabetically', () => {
  const names = sortUniqueProcedureNames(['HandleZ', 'handlea', 'HandleA', 'HandleM']);
  assert.deepEqual(names, ['handlea', 'HandleM', 'HandleZ']);
});
