import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  discoverProcedureSourcePaths,
  extractProcedureNamesFromText,
  sortUniqueProcedureNames
} from '../src/core/procedure-list-utils';

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

test('discoverProcedureSourcePaths follows the original non-form scope and ignores heavy folders', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pbfd-proc-'));
  try {
    const formPath = path.join(tmpRoot, 'forms', 'sample.pbf');
    const eventPath = path.join(tmpRoot, 'forms', 'events', 'form-events.pbi');
    const modulePath = path.join(tmpRoot, 'src', 'handlers.pb');
    const ignoredPath = path.join(tmpRoot, 'node_modules', 'pkg', 'ignored.pb');
    const hiddenGitPath = path.join(tmpRoot, '.git', 'hooks', 'ignored.pbi');

    fs.mkdirSync(path.dirname(formPath), { recursive: true });
    fs.mkdirSync(path.dirname(eventPath), { recursive: true });
    fs.mkdirSync(path.dirname(modulePath), { recursive: true });
    fs.mkdirSync(path.dirname(ignoredPath), { recursive: true });
    fs.mkdirSync(path.dirname(hiddenGitPath), { recursive: true });

    fs.writeFileSync(formPath, 'Procedure FormProc()\nEndProcedure\n', 'utf8');
    fs.writeFileSync(eventPath, 'Procedure EventProc()\nEndProcedure\n', 'utf8');
    fs.writeFileSync(modulePath, 'Procedure WorkspaceProc()\nEndProcedure\n', 'utf8');
    fs.writeFileSync(ignoredPath, 'Procedure IgnoredNodeModulesProc()\nEndProcedure\n', 'utf8');
    fs.writeFileSync(hiddenGitPath, 'Procedure IgnoredGitProc()\nEndProcedure\n', 'utf8');

    const paths = discoverProcedureSourcePaths(formPath, tmpRoot, 'events/form-events.pbi');

    assert.deepEqual(paths, [eventPath, modulePath].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
