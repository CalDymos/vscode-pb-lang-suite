import * as fs from "fs";
import * as path from "path";

const PROCEDURE_SOURCE_EXTENSIONS: ReadonlySet<string> = new Set([".pb", ".pbi"]);
const PROCEDURE_SOURCE_IGNORED_DIRS: ReadonlySet<string> = new Set([
  ".git",
  ".hg",
  ".svn",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "out-test"
]);

export function extractProcedureNamesFromText(text: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);
  let insideMacro = false;

  for (const rawLine of lines) {
    const line = rawLine ?? "";
    const trimmed = line.trim();
    if (!trimmed.length) continue;
    if (/^;/i.test(trimmed)) continue;

    if (/^Macro\b/i.test(trimmed)) {
      insideMacro = true;
      continue;
    }

    if (/^EndMacro\b/i.test(trimmed)) {
      insideMacro = false;
      continue;
    }

    if (insideMacro) continue;

    const match = /^Procedure(?:C|CDLL|DLL)?(?:\s*\.[A-Za-z_][A-Za-z0-9_]*)?\s+([A-Za-z_][A-Za-z0-9_]*)\b/i.exec(trimmed);
    if (!match) continue;

    const name = match[1];
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
}

export function sortUniqueProcedureNames(names: Iterable<string>): string[] {
  const unique = new Map<string, string>();
  for (const entry of names) {
    const name = (entry ?? "").trim();
    if (!name.length) continue;
    const key = name.toLowerCase();
    if (!unique.has(key)) unique.set(key, name);
  }

  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function isProcedureSourceFilePath(filePath: string): boolean {
  return PROCEDURE_SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export function resolveProcedureEventFilePath(documentPath: string, eventFile?: string): string | undefined {
  const trimmedEventFile = (eventFile ?? "").trim();
  if (!trimmedEventFile.length) return undefined;

  return path.isAbsolute(trimmedEventFile)
    ? path.normalize(trimmedEventFile)
    : path.normalize(path.resolve(path.dirname(documentPath), trimmedEventFile));
}

export function discoverProcedureSourcePaths(documentPath: string, workspaceRoot?: string, eventFile?: string): string[] {
  const resolved = new Set<string>();
  const addPath = (filePath: string | undefined) => {
    const trimmed = (filePath ?? "").trim();
    if (!trimmed.length) return;
    resolved.add(path.normalize(trimmed));
  };

  if (isProcedureSourceFilePath(documentPath)) addPath(documentPath);
  addPath(resolveProcedureEventFilePath(documentPath, eventFile));

  const trimmedWorkspaceRoot = (workspaceRoot ?? "").trim();
  if (!trimmedWorkspaceRoot.length) return Array.from(resolved).sort();

  const visitDir = (dirPath: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (PROCEDURE_SOURCE_IGNORED_DIRS.has(entry.name)) continue;
        visitDir(entryPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!isProcedureSourceFilePath(entryPath)) continue;
      addPath(entryPath);
    }
  };

  visitDir(path.normalize(trimmedWorkspaceRoot));
  return Array.from(resolved).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
