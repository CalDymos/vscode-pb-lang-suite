export type ParsedProcedureHeaderLine = {
  name: string;
  nameStart: number;
  nameEnd: number;
};

export function parseProcedureHeaderLine(line: string): ParsedProcedureHeaderLine | undefined {
  const match = /^\s*Procedure(?:C|CDLL|DLL)?(?:\s*\.[A-Za-z_][A-Za-z0-9_]*)?\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/i.exec(line);
  if (!match) return undefined;

  const name = match[1];
  const nameStart = line.indexOf(name);
  if (nameStart < 0) return undefined;

  return {
    name,
    nameStart,
    nameEnd: nameStart + name.length,
  };
}

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

    const parsed = parseProcedureHeaderLine(trimmed);
    if (!parsed) continue;

    const name = parsed.name;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
}
