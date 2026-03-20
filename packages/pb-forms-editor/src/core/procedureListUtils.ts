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
