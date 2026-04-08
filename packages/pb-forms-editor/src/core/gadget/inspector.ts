import { GADGET_KIND } from "../model";
import { quotePbString, unquoteString } from "../parser/tokenizer";
import { parseDesignerLayoutRaw, parseUnscaledLayoutRaw, unscaleDisplayedLayoutValue, type DesignerLayoutNumericField } from "../utils/layout-dpi";

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

export type GadgetCurrentImageLike = {
  imageRaw?: string;
};

export type GadgetImageEntryLike = {
  image?: string;
  imageRaw?: string;
};

export type GadgetCtorRangeFieldLabels = {
  minLabel: string;
  maxLabel: string;
  title: string;
};

export type GadgetCaptionFieldConfig = {
  label: string;
  textEditable: boolean;
  variableToggleEditable: boolean;
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

export type PbFormSkinLike = "windows" | "linux" | "macos";

export type WindowResizeLockLike = {
  w: number;
  wRaw?: string;
  h?: number;
  hRaw?: string;
  menuCount?: number;
  toolbarCount?: number;
  statusBarCount?: number;
  platformSkin?: PbFormSkinLike;
  layoutDpiScale?: number;
  parent?: ParentResizeLockLike;
};

export type ParentResizeLockLike = {
  id: string;
  kind: string;
  pbAny?: boolean;
  variable?: string;
  firstParam?: string;
  w: number;
  wRaw?: string;
  h: number;
  hRaw?: string;
};

export type GadgetResizeRawUpdate = {
  deleteResize?: boolean;
  xRaw?: string;
  yRaw?: string;
  wRaw?: string;
  hRaw?: string;
};

export type GadgetInspectorDetailsLike = {
  parentId?: string;
  parentItem?: number;
};

const GADGET_TEXT_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  GADGET_KIND.ButtonGadget,
  GADGET_KIND.ButtonImageGadget,
  GADGET_KIND.CalendarGadget,
  GADGET_KIND.CheckBoxGadget,
  GADGET_KIND.ComboBoxGadget,
  GADGET_KIND.ContainerGadget,
  GADGET_KIND.CustomGadget,
  GADGET_KIND.DateGadget,
  GADGET_KIND.EditorGadget,
  GADGET_KIND.ExplorerComboGadget,
  GADGET_KIND.ExplorerListGadget,
  GADGET_KIND.ExplorerTreeGadget,
  GADGET_KIND.FrameGadget,
  GADGET_KIND.HyperLinkGadget,
  GADGET_KIND.ListIconGadget,
  GADGET_KIND.ListViewGadget,
  GADGET_KIND.MDIGadget,
  GADGET_KIND.OptionGadget,
  GADGET_KIND.PanelGadget,
  GADGET_KIND.ScintillaGadget,
  GADGET_KIND.StringGadget,
  GADGET_KIND.TextGadget,
  GADGET_KIND.TreeGadget,
  GADGET_KIND.WebGadget
]);

const GADGET_CHECKED_STATE_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  GADGET_KIND.CheckBoxGadget,
  GADGET_KIND.OptionGadget
]);

const GADGET_CTOR_RANGE_FIELD_LABELS: ReadonlyMap<string, GadgetCtorRangeFieldLabels> = new Map([
  [GADGET_KIND.ProgressBarGadget, { minLabel: "Min", maxLabel: "Max", title: "Matches the original Min / Max constructor arguments." }],
  [GADGET_KIND.ScrollBarGadget, { minLabel: "Min", maxLabel: "Max", title: "Matches the original Min / Max constructor arguments." }],
  [GADGET_KIND.SpinGadget, { minLabel: "Min", maxLabel: "Max", title: "Matches the original Min / Max constructor arguments." }],
  [GADGET_KIND.TrackBarGadget, { minLabel: "Min", maxLabel: "Max", title: "Matches the original Min / Max constructor arguments." }],
  [GADGET_KIND.ScrollAreaGadget, { minLabel: "InnerWidth", maxLabel: "InnerHeight", title: "Matches the original InnerWidth / InnerHeight constructor arguments." }]
]);

const GADGET_COLOR_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  GADGET_KIND.CalendarGadget,
  GADGET_KIND.ContainerGadget,
  GADGET_KIND.EditorGadget,
  GADGET_KIND.ExplorerListGadget,
  GADGET_KIND.ExplorerTreeGadget,
  GADGET_KIND.HyperLinkGadget,
  GADGET_KIND.ListIconGadget,
  GADGET_KIND.ListViewGadget,
  GADGET_KIND.ProgressBarGadget,
  GADGET_KIND.ScrollAreaGadget,
  GADGET_KIND.SpinGadget,
  GADGET_KIND.StringGadget,
  GADGET_KIND.TextGadget,
  GADGET_KIND.TreeGadget
]);

const GADGET_ITEM_EDITOR_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  GADGET_KIND.ComboBoxGadget,
  GADGET_KIND.EditorGadget,
  GADGET_KIND.ListIconGadget,
  GADGET_KIND.ListViewGadget,
  GADGET_KIND.PanelGadget,
  GADGET_KIND.TreeGadget
]);

const GADGET_COLUMN_EDITOR_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  GADGET_KIND.ListIconGadget
]);

function buildInspectorValue(raw: string | undefined, fallback: string | undefined): string {
  const literal = raw ? unquoteString(raw) : undefined;
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

export function canInspectGadgetItems(kind: string | undefined): boolean {
  return typeof kind === "string" && GADGET_ITEM_EDITOR_CAPABLE_KINDS.has(kind);
}

export function canInspectGadgetColumns(kind: string | undefined): boolean {
  return typeof kind === "string" && GADGET_COLUMN_EDITOR_CAPABLE_KINDS.has(kind);
}

export function shouldShowGadgetParentDetail(gadget: GadgetInspectorDetailsLike): boolean {
  return typeof gadget.parentId === "string" && gadget.parentId.trim().length > 0;
}

export function shouldShowGadgetTabDetail(gadget: GadgetInspectorDetailsLike): boolean {
  return typeof gadget.parentItem === "number" && Number.isFinite(gadget.parentItem);
}

export function buildGadgetCheckedStateRaw(kind: string | undefined, checked: boolean): string | undefined {
  if (!checked) return undefined;
  if (kind === GADGET_KIND.CheckBoxGadget) return "#PB_Checkbox_Checked";
  if (kind === GADGET_KIND.OptionGadget) return "1";
  return undefined;
}

export function getGadgetCtorRangeFieldLabels(kind: string | undefined): GadgetCtorRangeFieldLabels | undefined {
  if (typeof kind !== "string") return undefined;
  return GADGET_CTOR_RANGE_FIELD_LABELS.get(kind);
}
export function isDpiScaledGadgetCtorRange(kind: string | undefined): boolean {
  return kind === GADGET_KIND.ScrollAreaGadget;
}

export function isDpiScaledGadgetState(kind: string | undefined): boolean {
  return kind === GADGET_KIND.SplitterGadget;
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

export function getGadgetCurrentImageDisplay(gadget: GadgetCurrentImageLike, imageEntry?: GadgetImageEntryLike): string {
  const resolved = imageEntry?.image ?? imageEntry?.imageRaw;
  if (typeof resolved === "string" && resolved.trim().length) return resolved;
  return gadget.imageRaw?.trim() ?? "";
}

export function getGadgetVariableInspectorValue(gadget: { variable?: string; firstParam: string }): string {
  if (typeof gadget.variable === "string" && gadget.variable.trim().length) {
    return gadget.variable;
  }
  return gadget.firstParam.replace(/^#/, "");
}

export function getGadgetCaptionFieldConfig(kind: string | undefined): GadgetCaptionFieldConfig | undefined {
  if (kind === GADGET_KIND.CanvasGadget) {
    return { label: "Caption", textEditable: false, variableToggleEditable: true };
  }
  if (!canEditGadgetText(kind)) return undefined;
  switch (kind) {
    case GADGET_KIND.DateGadget:
      return { label: "Mask", textEditable: true, variableToggleEditable: true };
    case GADGET_KIND.ScintillaGadget:
      return { label: "Callback", textEditable: true, variableToggleEditable: false };
    case GADGET_KIND.EditorGadget:
      return { label: "Caption", textEditable: false, variableToggleEditable: true };
    default:
      return { label: "Caption", textEditable: true, variableToggleEditable: true };
  }
}

export function buildGadgetTextRaw(value: string, isVariable: boolean): string {
  if (isVariable) {
    return value;
  }
  return quotePbString(value);
}

export function buildGadgetTooltipRaw(value: string, isVariable: boolean): string | undefined {
  if (isVariable) {
    return value.length ? value : undefined;
  }
  return value.length ? quotePbString(value) : undefined;
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

const PB_FORM_SKIN_CONSTANTS: Readonly<Record<PbFormSkinLike, { statusHeight: number; menuHeight: number; toolBarPaddingHeight: number }>> = {
  windows: { statusHeight: 23, menuHeight: 22, toolBarPaddingHeight: 24 },
  linux: { statusHeight: 26, menuHeight: 28, toolBarPaddingHeight: 38 },
  macos: { statusHeight: 24, menuHeight: 23, toolBarPaddingHeight: 36 }
};

function getTopLevelStretchHeightDynamicParts(win: WindowResizeLockLike): string[] {
  const parts: string[] = [];
  const menuCount = win.menuCount ?? 0;
  const toolbarCount = win.toolbarCount ?? 0;
  const statusBarCount = win.statusBarCount ?? 0;
  const skin = win.platformSkin;

  if (menuCount > 0) {
    parts.push('MenuHeight()');
  }
  if (toolbarCount > 0 && skin === 'windows') {
    parts.push(`ToolBarHeight(${toolbarCount - 1})`);
  }
  if (statusBarCount > 0) {
    parts.push(`StatusBarHeight(${statusBarCount - 1})`);
  }

  return parts;
}

function buildTopLevelStretchHeightRaw(gadget: GadgetResizeLockLike, win: WindowResizeLockLike): string | undefined {
  const skin = win.platformSkin;
  const scale = getResizeLockLayoutScale(win);
  const winH = resolveUnscaledLayoutNumber(win.hRaw, win.h, scale, "h", { allowExpressionFallback: false });
  const gadgetH = resolveUnscaledLayoutNumber(gadget.hRaw, gadget.h, scale, "h", { allowExpressionFallback: false });
  if (!skin || typeof winH !== 'number' || !Number.isFinite(winH) || winH <= 0 || typeof gadgetH !== 'number' || !Number.isFinite(gadgetH)) {
    return undefined;
  }

  const constants = PB_FORM_SKIN_CONSTANTS[skin];
  const menuCount = win.menuCount ?? 0;
  const toolbarCount = win.toolbarCount ?? 0;
  const statusBarCount = win.statusBarCount ?? 0;
  const dynamicParts = getTopLevelStretchHeightDynamicParts(win);

  let value = Math.trunc(winH - gadgetH);
  if (statusBarCount > 0) {
    value -= constants.statusHeight;
  }

  if (skin === 'windows') {
    if (toolbarCount > 0) {
      value -= constants.toolBarPaddingHeight;
    }
    if (menuCount > 0) {
      value -= constants.menuHeight;
    }
  } else if (skin === 'linux') {
    if (menuCount > 0) {
      value -= constants.menuHeight;
    }
  }

  const suffix = dynamicParts.length ? ` - ${dynamicParts.join(' - ')}` : '';
  return `FormWindowHeight${suffix} - ${value}`;
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

function getResizeLockLayoutScale(win: WindowResizeLockLike | undefined): number {
  const scale = win?.layoutDpiScale;
  return typeof scale === "number" && Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function getParentResizeReferenceRaw(parent: ParentResizeLockLike | undefined): string | undefined {
  if (!parent) return undefined;
  if (parent.pbAny) {
    return parent.variable?.trim() || parent.id.trim();
  }

  const firstParam = parent.firstParam?.trim();
  if (firstParam?.length) return firstParam;
  const trimmedId = parent.id.trim();
  if (!trimmedId.length) return undefined;
  return trimmedId.startsWith("#") ? trimmedId : `#${trimmedId}`;
}

function resolvePanelHeaderHeight(skin: PbFormSkinLike | undefined): number | undefined {
  switch (skin) {
    case "macos":
      return 31;
    case "linux":
      return 29;
    case "windows":
      return 22;
    default:
      return undefined;
  }
}

function getParentWidthResizeReferenceRaw(parent: ParentResizeLockLike | undefined): string | undefined {
  const parentRef = getParentResizeReferenceRaw(parent);
  if (!parentRef) return undefined;
  if (parent?.kind === GADGET_KIND.PanelGadget) {
    return `GetGadgetAttribute(${parentRef},#PB_Panel_ItemWidth)`;
  }
  return `GadgetWidth(${parentRef})`;
}

function getParentHeightResizeReferenceRaw(parent: ParentResizeLockLike | undefined): string | undefined {
  const parentRef = getParentResizeReferenceRaw(parent);
  if (!parentRef) return undefined;
  if (parent?.kind === GADGET_KIND.PanelGadget) {
    return `GetGadgetAttribute(${parentRef},#PB_Panel_ItemHeight)`;
  }
  return `GadgetHeight(${parentRef})`;
}

function isSupportedParentResizeContext(parent: ParentResizeLockLike | undefined): boolean {
  return Boolean(parent);
}

function resolveParentUnscaledLayoutNumber(
  parent: ParentResizeLockLike | undefined,
  field: "w" | "h",
  scale: number,
  skin?: PbFormSkinLike
): number | undefined {
  if (!parent) return undefined;
  const resolved = field === "w"
    ? resolveUnscaledLayoutNumber(parent.wRaw, parent.w, scale, "w", { allowExpressionFallback: false })
    : resolveUnscaledLayoutNumber(parent.hRaw, parent.h, scale, "h", { allowExpressionFallback: false });
  if (typeof resolved !== "number") return undefined;
  if (field === "h" && parent.kind === GADGET_KIND.PanelGadget) {
    const panelHeader = resolvePanelHeaderHeight(skin);
    if (typeof panelHeader !== "number") return undefined;
    return Math.max(0, Math.trunc(resolved - panelHeader));
  }
  return resolved;
}

function buildParentRightAnchorXRaw(gadget: GadgetResizeLockLike, parent: ParentResizeLockLike, scale: number): string | undefined {
  const gadgetX = resolveUnscaledLayoutNumber(gadget.xRaw, gadget.x, scale, "x", { allowExpressionFallback: false });
  const parentW = resolveParentUnscaledLayoutNumber(parent, "w", scale);
  const parentRef = getParentWidthResizeReferenceRaw(parent);
  if (typeof gadgetX !== "number" || typeof parentW !== "number" || !parentRef) return undefined;
  return `${parentRef} - ${Math.trunc(parentW - gadgetX)}`;
}

function buildParentStretchWidthRaw(gadget: GadgetResizeLockLike, parent: ParentResizeLockLike, scale: number): string | undefined {
  const gadgetW = resolveUnscaledLayoutNumber(gadget.wRaw, gadget.w, scale, "w", { allowExpressionFallback: false });
  const parentW = resolveParentUnscaledLayoutNumber(parent, "w", scale);
  const parentRef = getParentWidthResizeReferenceRaw(parent);
  if (typeof gadgetW !== "number" || typeof parentW !== "number" || !parentRef) return undefined;
  return `${parentRef} - ${Math.trunc(parentW - gadgetW)}`;
}

function buildParentBottomAnchorYRaw(
  gadget: GadgetResizeLockLike,
  parent: ParentResizeLockLike,
  scale: number,
  skin?: PbFormSkinLike
): string | undefined {
  const gadgetY = resolveUnscaledLayoutNumber(gadget.yRaw, gadget.y, scale, "y", { allowExpressionFallback: false });
  const parentH = resolveParentUnscaledLayoutNumber(parent, "h", scale, skin);
  const parentRef = getParentHeightResizeReferenceRaw(parent);
  if (typeof gadgetY !== "number" || typeof parentH !== "number" || !parentRef) return undefined;
  return `${parentRef} - ${Math.trunc(parentH - gadgetY)}`;
}

function buildParentStretchHeightRaw(
  gadget: GadgetResizeLockLike,
  parent: ParentResizeLockLike,
  scale: number,
  skin?: PbFormSkinLike
): string | undefined {
  const gadgetH = resolveUnscaledLayoutNumber(gadget.hRaw, gadget.h, scale, "h", { allowExpressionFallback: false });
  const parentH = resolveParentUnscaledLayoutNumber(parent, "h", scale, skin);
  const parentRef = getParentHeightResizeReferenceRaw(parent);
  if (typeof gadgetH !== "number" || typeof parentH !== "number" || !parentRef) return undefined;
  return `${parentRef} - ${Math.trunc(parentH - gadgetH)}`;
}

function hasExplicitNonNumericLayoutRaw(raw: string | undefined): boolean {
  const trimmed = raw?.trim();
  return Boolean(trimmed?.length) && parseUnscaledLayoutRaw(trimmed) === undefined;
}

function resolveUnscaledLayoutNumber(
  raw: string | undefined,
  displayValue: number | undefined,
  scale: number,
  field: DesignerLayoutNumericField,
  options?: { allowExpressionFallback?: boolean }
): number | undefined {
  const parsed = parseDesignerLayoutRaw(raw, field);
  if (typeof parsed === "number" && Number.isFinite(parsed)) return parsed;
  if (options?.allowExpressionFallback === false && hasExplicitNonNumericLayoutRaw(raw)) return undefined;
  if (typeof displayValue !== "number" || !Number.isFinite(displayValue)) return undefined;
  return unscaleDisplayedLayoutValue(displayValue, scale);
}

function getBaseRectRaw(raw: string | undefined, fallback: number, field: DesignerLayoutNumericField, scale = 1): string | undefined {
  const trimmed = raw?.trim();
  if (trimmed?.length) return trimmed;
  const unscaled = resolveUnscaledLayoutNumber(undefined, fallback, scale, field);
  return typeof unscaled === "number" && Number.isFinite(unscaled) ? String(Math.trunc(unscaled)) : undefined;
}

function buildTopLevelRightAnchorXRaw(gadget: GadgetResizeLockLike, win: WindowResizeLockLike): string | undefined {
  const scale = getResizeLockLayoutScale(win);
  const gadgetX = resolveUnscaledLayoutNumber(gadget.xRaw, gadget.x, scale, "x", { allowExpressionFallback: false });
  const winW = resolveUnscaledLayoutNumber(win.wRaw, win.w, scale, "w", { allowExpressionFallback: false });
  if (typeof gadgetX !== "number" || typeof winW !== "number") return undefined;
  return `FormWindowWidth - ${Math.trunc(winW - gadgetX)}`;
}

function buildTopLevelStretchWidthRaw(gadget: GadgetResizeLockLike, win: WindowResizeLockLike): string | undefined {
  const scale = getResizeLockLayoutScale(win);
  const gadgetW = resolveUnscaledLayoutNumber(gadget.wRaw, gadget.w, scale, "w", { allowExpressionFallback: false });
  const winW = resolveUnscaledLayoutNumber(win.wRaw, win.w, scale, "w", { allowExpressionFallback: false });
  if (typeof gadgetW !== "number" || typeof winW !== "number") return undefined;
  return `FormWindowWidth - ${Math.trunc(winW - gadgetW)}`;
}

function buildCurrentVerticalResizeArgs(gadget: GadgetResizeLockLike, scale = 1): { yRaw?: string; hRaw?: string } | undefined {
  const lockTop = gadget.lockTop !== false;
  const lockBottom = gadget.lockBottom === true;
  const yRaw = lockTop
    ? getBaseRectRaw(gadget.yRaw, gadget.y, "y", scale)
    : gadget.resizeYRaw?.trim();
  const hRaw = lockTop && lockBottom
    ? gadget.resizeHRaw?.trim()
    : getBaseRectRaw(gadget.hRaw, gadget.h, "h", scale);

  if (!yRaw || !hRaw) return undefined;
  return { yRaw, hRaw };
}

function buildCurrentHorizontalResizeArgs(gadget: GadgetResizeLockLike, scale = 1): { xRaw?: string; wRaw?: string } | undefined {
  const lockLeft = gadget.lockLeft !== false;
  const lockRight = gadget.lockRight === true;
  const xRaw = lockLeft
    ? getBaseRectRaw(gadget.xRaw, gadget.x, "x", scale)
    : gadget.resizeXRaw?.trim();
  const wRaw = lockLeft && lockRight
    ? gadget.resizeWRaw?.trim()
    : getBaseRectRaw(gadget.wRaw, gadget.w, "w", scale);

  if (!xRaw || !wRaw) return undefined;
  return { xRaw, wRaw };
}

function buildTopLevelBottomAnchorYRaw(gadget: GadgetResizeLockLike, win: WindowResizeLockLike): string | undefined {
  const scale = getResizeLockLayoutScale(win);
  const winH = resolveUnscaledLayoutNumber(win.hRaw, win.h, scale, "h", { allowExpressionFallback: false });
  const gadgetY = resolveUnscaledLayoutNumber(gadget.yRaw, gadget.y, scale, "y", { allowExpressionFallback: false });
  if (typeof gadgetY !== "number" || typeof winH !== "number" || !Number.isFinite(winH) || winH <= 0) return undefined;
  const baseYRaw = getBaseRectRaw(gadget.yRaw, gadget.y, "y", scale);
  if (!baseYRaw) return undefined;

  const trimmed = baseYRaw.trim();
  const baseOffset = Math.trunc(winH - gadgetY);
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
  if (!win) return false;
  const scale = getResizeLockLayoutScale(win);
  const parent = isSupportedParentResizeContext(win.parent) ? win.parent : undefined;
  if (gadget.parentId) {
    if (!parent) return false;
    const parentW = resolveParentUnscaledLayoutNumber(parent, "w", scale);
    if (typeof parentW !== "number" || !Number.isFinite(parentW) || parentW <= 0) return false;
  } else if (!Number.isFinite(win.w) || win.w <= 0) {
    return false;
  }
  if (!Number.isFinite(gadget.x) || !Number.isFinite(gadget.w)) return false;
  const baseXRaw = getBaseRectRaw(gadget.xRaw, gadget.x, "x", scale);
  const baseWRaw = getBaseRectRaw(gadget.wRaw, gadget.w, "w", scale);
  if (!baseXRaw || !baseWRaw) return false;
  const verticalArgs = buildCurrentVerticalResizeArgs(gadget, scale);
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

  const scale = getResizeLockLayoutScale(win);
  const parent = gadget.parentId && isSupportedParentResizeContext(win.parent) ? win.parent : undefined;
  const baseXRaw = getBaseRectRaw(gadget.xRaw, gadget.x, "x", scale);
  const baseWRaw = getBaseRectRaw(gadget.wRaw, gadget.w, "w", scale);
  const verticalArgs = buildCurrentVerticalResizeArgs(gadget, scale);
  if (!baseXRaw || !baseWRaw || !verticalArgs?.yRaw || !verticalArgs.hRaw) return undefined;

  const rightAnchorXRaw = usesWidthResizeReference(gadget.resizeXRaw)
    ? gadget.resizeXRaw?.trim()
    : (parent ? buildParentRightAnchorXRaw(gadget, parent, scale) : buildTopLevelRightAnchorXRaw(gadget, win));
  const stretchWidthRaw = usesWidthResizeReference(gadget.resizeWRaw)
    ? gadget.resizeWRaw?.trim()
    : (parent ? buildParentStretchWidthRaw(gadget, parent, scale) : buildTopLevelStretchWidthRaw(gadget, win));

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

  const lockLeft = gadget.lockLeft !== false;
  const lockRight = gadget.lockRight === true;
  if (!shouldEmitResizeGadget(lockLeft, lockRight, nextLockTop, nextLockBottom)) {
    return { deleteResize: true };
  }

  const scale = getResizeLockLayoutScale(win);
  const parent = gadget.parentId && isSupportedParentResizeContext(win?.parent) ? win?.parent : undefined;
  const skin = win?.platformSkin;
  if (gadget.parentId && !parent) return undefined;
  const horizontalArgs = buildCurrentHorizontalResizeArgs(gadget, scale);
  const baseYRaw = getBaseRectRaw(gadget.yRaw, gadget.y, "y", scale);
  const baseHRaw = getBaseRectRaw(gadget.hRaw, gadget.h, "h", scale);
  if (!horizontalArgs?.xRaw || !horizontalArgs.wRaw || !baseYRaw || !baseHRaw) return undefined;

  const bottomAnchorYRaw = usesHeightResizeReference(gadget.resizeYRaw)
    ? gadget.resizeYRaw?.trim()
    : (parent ? buildParentBottomAnchorYRaw(gadget, parent, scale, skin) : (win ? buildTopLevelBottomAnchorYRaw(gadget, win) : undefined));
  const stretchHeightRaw = usesHeightResizeReference(gadget.resizeHRaw)
    ? gadget.resizeHRaw?.trim()
    : (parent ? buildParentStretchHeightRaw(gadget, parent, scale, skin) : (win ? buildTopLevelStretchHeightRaw(gadget, win) : undefined));

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
