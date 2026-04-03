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
