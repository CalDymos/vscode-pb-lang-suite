import type { Gadget } from "../model";

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
