export type RectSnapshotLike = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PanelStateGadgetLike = {
  id: string;
  kind: string;
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
    if (gadget.kind !== "PanelGadget") continue;

    const stored = previous.get(gadget.id);
    if (typeof stored !== "number" || !Number.isFinite(stored)) continue;

    const itemCount = gadget.items?.length ?? 0;
    if (itemCount <= 0) continue;

    const clamped = Math.max(0, Math.min(Math.trunc(stored), itemCount - 1));
    next.set(gadget.id, clamped);
  }

  return next;
}
