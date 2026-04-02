import type { Gadget } from "../model";

const PB_FONT_BOLD = "#PB_Font_Bold";
const PB_FONT_ITALIC = "#PB_Font_Italic";
const PB_FONT_UNDERLINE = "#PB_Font_Underline";
const PB_FONT_STRIKEOUT = "#PB_Font_StrikeOut";

export type PreviewGadgetTextDrawingContext = {
  font: string;
  strokeStyle: unknown;
  lineWidth: number;
  save(): void;
  restore(): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  measureText(text: string): { width: number };
};

export type PreviewGadgetTextStyle = {
  font: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikeOut: boolean;
  sizePx: number;
  family: string;
};

function splitPbFontFlags(flagsRaw: string | undefined): string[] {
  if (!flagsRaw) return [];
  return flagsRaw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function quoteCssFontFamily(family: string): string {
  const trimmed = family.trim();
  if (!trimmed) return "sans-serif";
  return /^[A-Za-z0-9_-]+$/.test(trimmed)
    ? trimmed
    : `"${trimmed.replace(/"/g, '\\"')}"`;
}

export function buildPreviewGadgetTextStyle(
  gadget: Pick<Gadget, "gadgetFont" | "gadgetFontSize" | "gadgetFontFlagsRaw"> | undefined,
  fallbackSizePx: number,
  fallbackFamily = "sans-serif"
): PreviewGadgetTextStyle {
  const flags = new Set(splitPbFontFlags(gadget?.gadgetFontFlagsRaw));
  const isBold = flags.has(PB_FONT_BOLD);
  const isItalic = flags.has(PB_FONT_ITALIC);
  const isUnderline = flags.has(PB_FONT_UNDERLINE);
  const isStrikeOut = flags.has(PB_FONT_STRIKEOUT);
  const sizePx = Math.max(1, Math.trunc(gadget?.gadgetFontSize ?? fallbackSizePx));
  const family = quoteCssFontFamily(gadget?.gadgetFont ?? fallbackFamily);
  const fontParts = [
    isItalic ? "italic" : "normal",
    isBold ? "bold" : "normal",
    `${sizePx}px`,
    family,
  ];

  return {
    font: fontParts.join(" "),
    isBold,
    isItalic,
    isUnderline,
    isStrikeOut,
    sizePx,
    family,
  };
}

export function applyPreviewGadgetTextStyle(
  ctx: PreviewGadgetTextDrawingContext,
  gadget: Pick<Gadget, "gadgetFont" | "gadgetFontSize" | "gadgetFontFlagsRaw"> | undefined,
  fallbackSizePx: number,
  fallbackFamily = "sans-serif"
): PreviewGadgetTextStyle {
  const style = buildPreviewGadgetTextStyle(gadget, fallbackSizePx, fallbackFamily);
  ctx.font = style.font;
  return style;
}

export function drawPreviewTextDecorations(
  ctx: PreviewGadgetTextDrawingContext,
  text: string,
  x: number,
  y: number,
  style: PreviewGadgetTextStyle,
  color: string
): void {
  if ((!style.isUnderline && !style.isStrikeOut) || !text.length) return;

  const metrics = ctx.measureText(text);
  const width = Math.max(0, metrics.width);
  if (width <= 0) return;

  const underlineY = y + style.sizePx - 1.5;
  const strikeOutY = y + style.sizePx * 0.55;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  if (style.isUnderline) {
    ctx.beginPath();
    ctx.moveTo(x, underlineY);
    ctx.lineTo(x + width, underlineY);
    ctx.stroke();
  }

  if (style.isStrikeOut) {
    ctx.beginPath();
    ctx.moveTo(x, strikeOutY);
    ctx.lineTo(x + width, strikeOutY);
    ctx.stroke();
  }

  ctx.restore();
}
