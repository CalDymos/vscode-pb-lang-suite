export const WINDOW_KNOWN_FLAGS = [
  "#PB_Window_SystemMenu",
  "#PB_Window_MinimizeGadget",
  "#PB_Window_MaximizeGadget",
  "#PB_Window_SizeGadget",
  "#PB_Window_Invisible",
  "#PB_Window_TitleBar",
  "#PB_Window_Tool",
  "#PB_Window_BorderLess",
  "#PB_Window_ScreenCentered",
  "#PB_Window_WindowCentered",
  "#PB_Window_Maximize",
  "#PB_Window_Minimize",
  "#PB_Window_NoGadgets",
  "#PB_Window_NoActivate",
] as const;

const WINDOW_KNOWN_FLAG_SET = new Set<string>(WINDOW_KNOWN_FLAGS);

function splitFlags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split('|')
    .map(part => part.trim())
    .filter(Boolean);
}

export function parseWindowCustomFlagsInput(raw: string | undefined): string[] {
  const out: string[] = [];
  for (const flag of splitFlags(raw)) {
    if (WINDOW_KNOWN_FLAG_SET.has(flag)) continue;
    if (out.includes(flag)) continue;
    out.push(flag);
  }
  return out;
}

export function buildWindowFlagsExpr(enabledKnownFlags: readonly string[], customFlagsRaw?: string): string | undefined {
  const orderedKnown = WINDOW_KNOWN_FLAGS.filter(flag => enabledKnownFlags.includes(flag));
  const custom = parseWindowCustomFlagsInput(customFlagsRaw);
  const parts = [...orderedKnown, ...custom];
  return parts.length ? parts.join(' | ') : undefined;
}
