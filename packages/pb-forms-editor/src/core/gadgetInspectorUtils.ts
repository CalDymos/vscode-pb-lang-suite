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

const GADGET_TEXT_CAPABLE_KINDS: ReadonlySet<string> = new Set([
  "ButtonGadget",
  "ButtonImageGadget",
  "CalendarGadget",
  "CheckBoxGadget",
  "ComboBoxGadget",
  "ContainerGadget",
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
