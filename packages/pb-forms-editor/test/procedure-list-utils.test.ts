import test from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { extractProcedureNamesFromText } from "../src/core/parser/procedure-scanner";
import {
  resolveFixedProcedureSourcePaths,
  resolveProcedureEventFilePath,
  sortUniqueProcedureNames
} from "../src/core/procedures/list";

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

test('resolveProcedureEventFilePath resolves relative event files against the form document directory', () => {
  const documentPath = path.normalize('/workspace/forms/sample.pbf');
  const eventPath = resolveProcedureEventFilePath(documentPath, 'events/form-events.pbi');
  const expected = path.resolve(path.dirname(documentPath), 'events/form-events.pbi');

  assert.equal(eventPath, expected);
});

test('resolveFixedProcedureSourcePaths returns only the document and optional event file for form documents', () => {
  const documentPath = path.normalize('/workspace/forms/sample.pbf');
  const paths = resolveFixedProcedureSourcePaths(documentPath, 'events/form-events.pbi');
  const expected = [path.resolve(path.dirname(documentPath), 'events/form-events.pbi')].sort();

  assert.deepEqual(paths, expected);
});

test('resolveFixedProcedureSourcePaths returns the PB document itself plus the optional event file', () => {
  const documentPath = path.normalize('/workspace/forms/sample.pb');
  const paths = resolveFixedProcedureSourcePaths(documentPath, 'events/form-events.pbi');
  const expected = [
    path.normalize(documentPath),
    path.resolve(path.dirname(documentPath), 'events/form-events.pbi')
  ].sort();

  assert.deepEqual(paths, expected);
});
