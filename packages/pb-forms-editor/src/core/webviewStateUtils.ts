import { GADGET_KIND } from "./model";

export type RectSnapshotLike = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PanelStateGadgetLike = {
  id: string;
  kind: string;
  parentId?: string;
  parentItem?: number;
  items?: Array<unknown>;
};

export function hasRectChanged(current: RectSnapshotLike, start: RectSnapshotLike): boolean {
  return current.x !== start.x
    || current.y !== start.y
    || current.w !== start.w
    || current.h !== start.h;
}

export function retainPanelActiveItems(
  previous: ReadonlyMap<string, number>,
  gadgets: ReadonlyArray<PanelStateGadgetLike>
): Map<string, number> {
  const next = new Map<string, number>();

  for (const gadget of gadgets) {
    if (gadget.kind !== GADGET_KIND.PanelGadget) continue;

    const stored = previous.get(gadget.id);
    if (typeof stored !== "number" || !Number.isFinite(stored)) continue;

    const itemCount = gadget.items?.length ?? 0;
    if (itemCount <= 0) continue;

    const clamped = Math.max(0, Math.min(Math.trunc(stored), itemCount - 1));
    next.set(gadget.id, clamped);
  }

  return next;
}


export function syncPanelActiveItemsForSelection(
  previous: ReadonlyMap<string, number>,
  gadgets: ReadonlyArray<PanelStateGadgetLike>,
  selectedGadgetId: string
): Map<string, number> {
  const next = retainPanelActiveItems(previous, gadgets);
  const gadgetById = new Map<string, PanelStateGadgetLike>();

  for (const gadget of gadgets) {
    gadgetById.set(gadget.id, gadget);
  }

  let current = gadgetById.get(selectedGadgetId);
  while (current) {
    const parentId = current.parentId;
    if (!parentId) break;

    const parent = gadgetById.get(parentId);
    if (!parent) break;

    if (parent.kind === GADGET_KIND.PanelGadget && typeof current.parentItem === "number" && Number.isFinite(current.parentItem)) {
      const itemCount = parent.items?.length ?? 0;
      if (itemCount > 0) {
        const clamped = Math.max(0, Math.min(Math.trunc(current.parentItem), itemCount - 1));
        next.set(parent.id, clamped);
      }
    }

    current = parent;
  }

  return next;
}
