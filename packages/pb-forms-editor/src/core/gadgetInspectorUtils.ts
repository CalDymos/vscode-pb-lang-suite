export type GadgetTextLike = {
  textRaw?: string;
  text?: string;
  textVariable?: boolean;
};

export type GadgetTooltipLike = {
  tooltipRaw?: string;
  tooltip?: string;
  tooltipVariable?: boolean;
};

export type GadgetFontLike = {
  gadgetFontRaw?: string;
  gadgetFont?: string;
  gadgetFontSize?: number;
  gadgetFontFlagsRaw?: string;
};

export type GadgetCtorRangeLike = {
  minRaw?: string;
  min?: number;
  maxRaw?: string;
  max?: number;
};

export type GadgetCtorRangeFieldLabels = {
  minLabel: string;
  maxLabel: string;
  title: string;
};

export type GadgetResizeLockLike = {
  parentId?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  xRaw?: string;
  yRaw?: string;
  wRaw?: string;
  hRaw?: string;
  resizeXRaw?: string;
  resizeYRaw?: string;
  resizeWRaw?: string;
  resizeHRaw?: string;
  resizeSource?: { line: number };
  lockLeft?: boolean;
  lockRight?: boolean;
  lockTop?: boolean;
  lockBottom?: boolean;
};

export type WindowResizeLockLike = {
  w: number;
  h?: number;
};

export type GadgetResizeRawUpdate = {
  deleteResize?: boolean;
  xRaw?: string;
  yRaw?: string;
  wRaw?: string;
  hRaw?: string;
};

const GADGET_TEXT_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  "ButtonGadget",
  "ButtonImageGadget",
  "CalendarGadget",
  "CheckBoxGadget",
  "ComboBoxGadget",
  "ContainerGadget",
  "CustomGadget",
  "DateGadget",
  "EditorGadget",
  "ExplorerComboGadget",
  "ExplorerListGadget",
  "ExplorerTreeGadget",
  "FrameGadget",
  "HyperLinkGadget",
  "ListIconGadget",
  "ListViewGadget",
  "MDIGadget",
  "OptionGadget",
  "PanelGadget",
  "ScintillaGadget",
  "StringGadget",
  "TextGadget",
  "TreeGadget",
  "WebGadget"
]);

const GADGET_CHECKED_STATE_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  "CheckBoxGadget",
  "OptionGadget"
]);

const GADGET_CTOR_RANGE_FIELD_LABELS: ReadonlyMap<string, GadgetCtorRangeFieldLabels> = new Map([
  ["ProgressBarGadget", { minLabel: "Min", maxLabel: "Max", title: "Matches the original Min / Max constructor arguments." }],
  ["ScrollBarGadget", { minLabel: "Min", maxLabel: "Max", title: "Matches the original Min / Max constructor arguments." }],
  ["SpinGadget", { minLabel: "Min", maxLabel: "Max", title: "Matches the original Min / Max constructor arguments." }],
  ["TrackBarGadget", { minLabel: "Min", maxLabel: "Max", title: "Matches the original Min / Max constructor arguments." }],
  ["ScrollAreaGadget", { minLabel: "InnerWidth", maxLabel: "InnerHeight", title: "Matches the original InnerWidth / InnerHeight constructor arguments." }]
]);

const GADGET_COLOR_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  "CalendarGadget",
  "ContainerGadget",
  "EditorGadget",
  "ExplorerListGadget",
  "ExplorerTreeGadget",
  "HyperLinkGadget",
  "ListIconGadget",
  "ListViewGadget",
  "ProgressBarGadget",
  "ScrollAreaGadget",
  "SpinGadget",
  "StringGadget",
  "TextGadget",
  "TreeGadget"
]);

function quotePbStringLiteral(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function unquotePbStringLiteral(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const unescaped = trimmed.startsWith('~"') ? trimmed.slice(1) : trimmed;
  if (unescaped.length >= 2 && unescaped.startsWith('"') && unescaped.endsWith('"')) {
    return unescaped.slice(1, -1).replace(/""/g, '"');
  }
  return undefined;
}

function buildInspectorValue(raw: string | undefined, fallback: string | undefined): string {
  const literal = unquotePbStringLiteral(raw);
  if (literal !== undefined) return literal;
  if (typeof fallback === "string") return fallback;
  return raw?.trim() ?? "";
}

export function canEditGadgetText(kind: string | undefined): boolean {
  return typeof kind === "string" && GADGET_TEXT_CAPABLE_KINDS.has(kind);
}

export function canEditGadgetColors(kind: string | undefined): boolean {
  return typeof kind === "string" && GADGET_COLOR_CAPABLE_KINDS.has(kind);
}

export function canEditGadgetCheckedState(kind: string | undefined): boolean {
  return typeof kind === "string" && GADGET_CHECKED_STATE_CAPABLE_KINDS.has(kind);
}

export function buildGadgetCheckedStateRaw(kind: string | undefined, checked: boolean): string | undefined {
  if (!checked) return undefined;
  if (kind === "CheckBoxGadget") return "#PB_Checkbox_Checked";
  if (kind === "OptionGadget") return "1";
  return undefined;
}

export function getGadgetCtorRangeFieldLabels(kind: string | undefined): GadgetCtorRangeFieldLabels | undefined {
  if (typeof kind !== "string") return undefined;
  return GADGET_CTOR_RANGE_FIELD_LABELS.get(kind);
}

export function getGadgetTextInspectorValue(gadget: GadgetTextLike): string {
  return buildInspectorValue(gadget.textRaw, gadget.text);
}

export function getGadgetTooltipInspectorValue(gadget: GadgetTooltipLike): string {
  return buildInspectorValue(gadget.tooltipRaw, gadget.tooltip);
}

export function getGadgetCtorRangeInspectorValue(raw: string | undefined, fallback: number | undefined): string {
  const trimmed = raw?.trim();
  if (trimmed?.length) return trimmed;
  return Number.isFinite(fallback) ? String(fallback) : "";
}

export function buildGadgetTextRaw(value: string, isVariable: boolean): string {
  if (isVariable) {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : '""';
  }
  return quotePbStringLiteral(value);
}

export function buildGadgetTooltipRaw(value: string, isVariable: boolean): string | undefined {
  if (isVariable) {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return value.length ? quotePbStringLiteral(value) : undefined;
}


export function getCustomGadgetHelpDisplay(): string {
  return "%id% %x% %y% %w% %h% %txt% %hwnd% ";
}

export function getGadgetFontDisplaySummary(gadget: GadgetFontLike): string {
  if (gadget.gadgetFontRaw?.trim()) {
    if (gadget.gadgetFont && Number.isFinite(gadget.gadgetFontSize)) {
      const flags = gadget.gadgetFontFlagsRaw?.trim();
      return flags?.length
        ? `${gadget.gadgetFont} ${gadget.gadgetFontSize} (${flags})`
        : `${gadget.gadgetFont} ${gadget.gadgetFontSize}`;
    }
    return gadget.gadgetFontRaw.trim();
  }
  return "";
}

function usesWidthResizeReference(raw: string | undefined): boolean {
  const trimmed = raw?.trim();
  if (!trimmed?.length) return false;
  return /FormWindowWidth|WindowWidth|GadgetWidth|GetGadgetAttribute/i.test(trimmed);
}

function usesHeightResizeReference(raw: string | undefined): boolean {
  const trimmed = raw?.trim();
  if (!trimmed?.length) return false;
  return /FormWindowHeight|WindowHeight|GadgetHeight|GetGadgetAttribute/i.test(trimmed);
}

function getBaseRectRaw(raw: string | undefined, fallback: number): string | undefined {
  const trimmed = raw?.trim();
  if (trimmed?.length) return trimmed;
  return Number.isFinite(fallback) ? String(Math.trunc(fallback)) : undefined;
}

function buildTopLevelRightAnchorXRaw(gadget: GadgetResizeLockLike, win: WindowResizeLockLike): string | undefined {
  if (!Number.isFinite(gadget.x) || !Number.isFinite(win.w)) return undefined;
  return `FormWindowWidth - ${Math.trunc(win.w - gadget.x)}`;
}

function buildTopLevelStretchWidthRaw(gadget: GadgetResizeLockLike, win: WindowResizeLockLike): string | undefined {
  if (!Number.isFinite(gadget.w) || !Number.isFinite(win.w)) return undefined;
  return `FormWindowWidth - ${Math.trunc(win.w - gadget.w)}`;
}

function buildCurrentVerticalResizeArgs(gadget: GadgetResizeLockLike): { yRaw?: string; hRaw?: string } | undefined {
  const lockTop = gadget.lockTop !== false;
  const lockBottom = gadget.lockBottom === true;
  const yRaw = lockTop
    ? getBaseRectRaw(gadget.yRaw, gadget.y)
    : gadget.resizeYRaw?.trim();
  const hRaw = lockTop && lockBottom
    ? gadget.resizeHRaw?.trim()
    : getBaseRectRaw(gadget.hRaw, gadget.h);

  if (!yRaw || !hRaw) return undefined;
  return { yRaw, hRaw };
}

function buildCurrentHorizontalResizeArgs(gadget: GadgetResizeLockLike): { xRaw?: string; wRaw?: string } | undefined {
  const lockLeft = gadget.lockLeft !== false;
  const lockRight = gadget.lockRight === true;
  const xRaw = lockLeft
    ? getBaseRectRaw(gadget.xRaw, gadget.x)
    : gadget.resizeXRaw?.trim();
  const wRaw = lockLeft && lockRight
    ? gadget.resizeWRaw?.trim()
    : getBaseRectRaw(gadget.wRaw, gadget.w);

  if (!xRaw || !wRaw) return undefined;
  return { xRaw, wRaw };
}

function buildTopLevelBottomAnchorYRaw(gadget: GadgetResizeLockLike, win: WindowResizeLockLike): string | undefined {
  const winH = win.h;
  if (!Number.isFinite(gadget.y) || typeof winH !== "number" || !Number.isFinite(winH) || winH <= 0) return undefined;
  const baseYRaw = getBaseRectRaw(gadget.yRaw, gadget.y);
  if (!baseYRaw) return undefined;

  const trimmed = baseYRaw.trim();
  const baseOffset = Math.trunc(winH - gadget.y);
  if (/^-?\d+$/.test(trimmed)) {
    return `FormWindowHeight - ${baseOffset}`;
  }

  const toolbarMatch = trimmed.match(/^ToolBarHeight\((\d+)\)\s*\+\s*-?\d+$/);
  if (toolbarMatch) {
    return `ToolBarHeight(${toolbarMatch[1]}) + FormWindowHeight - ${baseOffset}`;
  }

  return undefined;
}

function shouldEmitResizeGadget(lockLeft: boolean, lockRight: boolean, lockTop: boolean, lockBottom: boolean): boolean {
  return (lockRight && lockLeft)
    || (lockTop && lockBottom)
    || (!lockTop && lockBottom)
    || (lockRight && !lockLeft);
}

export function canEditGadgetHorizontalLocks(gadget: GadgetResizeLockLike, win: WindowResizeLockLike | undefined): boolean {
  if (!gadget.resizeSource) return false;
  if (gadget.parentId) return false;
  if (!win) return false;
  if (!Number.isFinite(win.w) || win.w <= 0) return false;
  if (!Number.isFinite(gadget.x) || !Number.isFinite(gadget.w)) return false;
  const baseXRaw = getBaseRectRaw(gadget.xRaw, gadget.x);
  const baseWRaw = getBaseRectRaw(gadget.wRaw, gadget.w);
  if (!baseXRaw || !baseWRaw) return false;
  const verticalArgs = buildCurrentVerticalResizeArgs(gadget);
  if (!verticalArgs) return false;
  return true;
}

export function buildGadgetHorizontalLockResizeUpdate(
  gadget: GadgetResizeLockLike,
  win: WindowResizeLockLike,
  nextLockLeft: boolean,
  nextLockRight: boolean
): GadgetResizeRawUpdate | undefined {
  if (!canEditGadgetHorizontalLocks(gadget, win)) return undefined;

  const lockTop = gadget.lockTop !== false;
  const lockBottom = gadget.lockBottom === true;
  if (!shouldEmitResizeGadget(nextLockLeft, nextLockRight, lockTop, lockBottom)) {
    return { deleteResize: true };
  }

  const baseXRaw = getBaseRectRaw(gadget.xRaw, gadget.x);
  const baseWRaw = getBaseRectRaw(gadget.wRaw, gadget.w);
  const verticalArgs = buildCurrentVerticalResizeArgs(gadget);
  if (!baseXRaw || !baseWRaw || !verticalArgs?.yRaw || !verticalArgs.hRaw) return undefined;

  const rightAnchorXRaw = usesWidthResizeReference(gadget.resizeXRaw)
    ? gadget.resizeXRaw?.trim()
    : buildTopLevelRightAnchorXRaw(gadget, win);
  const stretchWidthRaw = usesWidthResizeReference(gadget.resizeWRaw)
    ? gadget.resizeWRaw?.trim()
    : buildTopLevelStretchWidthRaw(gadget, win);

  const xRaw = nextLockLeft ? baseXRaw : rightAnchorXRaw;
  const wRaw = nextLockLeft && nextLockRight ? stretchWidthRaw : baseWRaw;
  if (!xRaw || !wRaw) return undefined;

  return {
    xRaw,
    yRaw: verticalArgs.yRaw,
    wRaw,
    hRaw: verticalArgs.hRaw
  };
}

export function buildGadgetVerticalLockResizeUpdate(
  gadget: GadgetResizeLockLike,
  win: WindowResizeLockLike | undefined,
  nextLockTop: boolean,
  nextLockBottom: boolean
): GadgetResizeRawUpdate | undefined {
  if (!gadget.resizeSource) return undefined;
  if (gadget.parentId) return undefined;

  const lockLeft = gadget.lockLeft !== false;
  const lockRight = gadget.lockRight === true;
  if (!shouldEmitResizeGadget(lockLeft, lockRight, nextLockTop, nextLockBottom)) {
    return { deleteResize: true };
  }

  const horizontalArgs = buildCurrentHorizontalResizeArgs(gadget);
  const baseYRaw = getBaseRectRaw(gadget.yRaw, gadget.y);
  const baseHRaw = getBaseRectRaw(gadget.hRaw, gadget.h);
  if (!horizontalArgs?.xRaw || !horizontalArgs.wRaw || !baseYRaw || !baseHRaw) return undefined;

  const bottomAnchorYRaw = usesHeightResizeReference(gadget.resizeYRaw)
    ? gadget.resizeYRaw?.trim()
    : (win ? buildTopLevelBottomAnchorYRaw(gadget, win) : undefined);
  const stretchHeightRaw = usesHeightResizeReference(gadget.resizeHRaw)
    ? gadget.resizeHRaw?.trim()
    : undefined;

  if (!nextLockBottom) {
    return {
      xRaw: horizontalArgs.xRaw,
      yRaw: baseYRaw,
      wRaw: horizontalArgs.wRaw,
      hRaw: baseHRaw
    };
  }

  if (!nextLockTop) {
    if (!bottomAnchorYRaw) return undefined;
    return {
      xRaw: horizontalArgs.xRaw,
      yRaw: bottomAnchorYRaw,
      wRaw: horizontalArgs.wRaw,
      hRaw: baseHRaw
    };
  }

  if (!stretchHeightRaw) return undefined;
  return {
    xRaw: horizontalArgs.xRaw,
    yRaw: baseYRaw,
    wRaw: horizontalArgs.wRaw,
    hRaw: stretchHeightRaw
  };
}
