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

export const WINDOW_POSITION_IGNORE_LITERAL = "#PB_Ignore";

const WINDOW_KNOWN_FLAG_SET = new Set<string>(WINDOW_KNOWN_FLAGS);
const WINDOW_TITLEBAR_PREVIEW_FLAGS = new Set<string>([
  "#PB_Window_SystemMenu",
  "#PB_Window_TitleBar",
]);

function splitFlags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split('|')
    .map(part => part.trim())
    .filter(Boolean);
}

function isIntegerLiteral(raw: string): boolean {
  return /^-?\d+$/.test(raw);
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

export function getWindowPositionInspectorValue(raw: string | undefined, value: number): string {
  const trimmed = (raw ?? "").trim();
  if (trimmed === WINDOW_POSITION_IGNORE_LITERAL || value === -65535) {
    return WINDOW_POSITION_IGNORE_LITERAL;
  }

  if (isIntegerLiteral(trimmed)) {
    return trimmed;
  }

  return String(Math.trunc(value));
}

export type ParsedWindowVariableNameInput =
  | { ok: true; value: string }
  | { ok: false; fallbackValue: string };

export function getWindowVariableInspectorValue(currentValue: string | undefined): string {
  return currentValue ?? '';
}

export type ParsedWindowParentInput = {
  raw: string;
  storedValue: string | undefined;
};

function unwrapWindowIdParent(raw: string): string | undefined {
  const match = /^WindowID\((.*)\)$/i.exec(raw);
  return match ? match[1] : undefined;
}

export function getWindowParentInspectorValue(parentRaw: string | undefined, normalizedParent: string | undefined): string {
  if (typeof parentRaw === 'string') {
    const unwrapped = unwrapWindowIdParent(parentRaw);
    if (unwrapped !== undefined) {
      return unwrapped;
    }
    return parentRaw;
  }

  if (!normalizedParent) {
    return '';
  }

  return normalizedParent.startsWith('=') ? normalizedParent.slice(1) : normalizedParent;
}

export function getWindowParentAsRawExpression(parentRaw: string | undefined, normalizedParent: string | undefined): boolean {
  if (typeof parentRaw === 'string') {
    return unwrapWindowIdParent(parentRaw) === undefined && parentRaw.length > 0;
  }

  return Boolean(normalizedParent?.startsWith('='));
}

export function getWindowParentAsRawExpressionWithOverride(
  parentRaw: string | undefined,
  normalizedParent: string | undefined,
  override: boolean | undefined
): boolean {
  if (typeof override === 'boolean') {
    return override;
  }

  return getWindowParentAsRawExpression(parentRaw, normalizedParent);
}

export type ParsedWindowEventProcInput = {
  raw: string;
  storedValue: string | undefined;
};

export function parseWindowParentInspectorInput(raw: string, parentAsRawExpression: boolean): ParsedWindowParentInput {
  if (!raw.length) {
    return {
      raw: '',
      storedValue: undefined,
    };
  }

  return {
    raw: parentAsRawExpression ? raw : `WindowID(${raw})`,
    storedValue: raw,
  };
}

export function parseWindowEventProcInspectorInput(raw: string): ParsedWindowEventProcInput {
  return {
    raw,
    storedValue: raw.length ? raw : undefined,
  };
}

export function parseWindowVariableNameInspectorInput(raw: string, currentValue: string): ParsedWindowVariableNameInput {
  if (!raw.length) {
    return {
      ok: false,
      fallbackValue: currentValue,
    };
  }

  return {
    ok: true,
    value: raw,
  };
}

export function hasWindowPreviewTitleBar(flagsExpr: string | undefined): boolean {
  for (const flag of splitFlags(flagsExpr)) {
    if (WINDOW_TITLEBAR_PREVIEW_FLAGS.has(flag)) {
      return true;
    }
  }

  return false;
}

export function getWindowPreviewTitleBarHeight(flagsExpr: string | undefined, configuredHeight: number): number {
  if (!hasWindowPreviewTitleBar(flagsExpr)) {
    return 0;
  }

  return Math.max(0, Math.trunc(configuredHeight));
}

export function getWindowBooleanInspectorState(raw: string | undefined, value: boolean | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  const trimmed = (raw ?? '').trim();
  if (!trimmed || trimmed === '0') {
    return false;
  }

  return true;
}

export type ParsedWindowPositionInput =
  | { ok: true; raw: string; previewValue: number; isIgnore: boolean }
  | { ok: false; error: string };

export function parseWindowPositionInspectorInput(raw: string): ParsedWindowPositionInput {
  const trimmed = raw.trim();
  if (trimmed === WINDOW_POSITION_IGNORE_LITERAL) {
    return {
      ok: true,
      raw: WINDOW_POSITION_IGNORE_LITERAL,
      previewValue: 0,
      isIgnore: true,
    };
  }

  if (!isIntegerLiteral(trimmed)) {
    return {
      ok: false,
      error: `Only integer values or ${WINDOW_POSITION_IGNORE_LITERAL} are supported.`
    };
  }

  return {
    ok: true,
    raw: trimmed,
    previewValue: Number(trimmed),
    isIgnore: false,
  };
}
