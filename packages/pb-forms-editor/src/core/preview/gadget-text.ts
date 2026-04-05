import { getPreviewComboChromeHeight } from "./chrome";
import type { Gadget } from "../model";

function hasFlag(flagsExpr: string | undefined, flag: string): boolean {
  if (!flagsExpr) return false;
  return flagsExpr.split("|").map(part => part.trim()).includes(flag);
}

export function getPreviewGadgetText(
  gadget: Pick<Gadget, "text" | "textVariable"> | undefined,
  fallback = ""
): string {
  const text = gadget?.text ?? "";
  if (text.length > 0) {
    return gadget?.textVariable ? `[${text}]` : text;
  }
  return fallback;
}

export function getPreviewTextLikeTextPosition(args: {
  x: number;
  y: number;
  width: number;
  textWidth: number;
  flagsExpr?: string;
}): { x: number; y: number } {
  const { x, y, width, textWidth, flagsExpr } = args;
  let textX = x + 1;

  if (hasFlag(flagsExpr, "#PB_Text_Right")) {
    textX = x + Math.max(1, width - textWidth - 1);
  }
  else if (hasFlag(flagsExpr, "#PB_Text_Center")) {
    textX = x + Math.max(1, (width - textWidth) / 2);
  }

  return { x: textX, y };
}

export function getPreviewListRowAdvance(
  variant: "tree" | "listview" | "listicon" | "explorerlist",
  textHeight: number
): number {
  const safeTextHeight = Math.max(1, Math.trunc(textHeight));
  return safeTextHeight + (variant === "tree" ? 6 : 4);
}

export function getPreviewComboTextX(
  args: {
    x: number;
    isEditable: boolean;
    osSkin: "windows7" | "windows8" | "macos" | "linux";
  }
): number {
  const { x, isEditable, osSkin } = args;
  if (isEditable) return x + 3;
  return x + (osSkin === "macos" ? 6 : 4);
}

export function getPreviewComboTextY(
  args: {
    y: number;
    height: number;
    textHeight: number;
    isEditable: boolean;
    osSkin: "windows7" | "windows8" | "macos" | "linux";
  }
): number {
  const { y, height, textHeight, isEditable, osSkin } = args;
  const comboHeight = getPreviewComboChromeHeight(osSkin, height, isEditable);
  return y + Math.max(1, Math.trunc((comboHeight - textHeight) / 2));
}

export function getPreviewCheckableTextY(kind: "checkbox" | "option", y: number, height: number): number {
  return y + Math.trunc((height - (kind === "option" ? 17 : 15)) / 2);
}

export function getPreviewDateTextY(y: number, height: number, textHeight: number): number {
  return y + Math.trunc((height - textHeight) / 2);
}

export function getPreviewSpinTextY(y: number, height: number, textHeight: number): number {
  return y + Math.trunc((height - textHeight) / 2);
}

export function getPreviewListHeaderTextY(
  variant: "listicon" | "explorerlist",
  y: number
): number {
  return y + (variant === "explorerlist" ? 2 : 0);
}
