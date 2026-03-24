export interface DeletePlanGadgetLike {
  id: string;
  parentId?: string;
  kind?: string;
  gadget1Id?: string;
  gadget2Id?: string;
  splitterId?: string;
}

export interface OriginalDeletePlan {
  requestedIds: Set<string>;
  deletedIds: Set<string>;
  skippedIds: Set<string>;
}

export function collectRequestedGadgetDeleteIds<T extends DeletePlanGadgetLike>(gadgets: readonly T[], rootId: string): Set<string> {
  const requested = new Set<string>();

  const visit = (gadgetId: string): void => {
    if (requested.has(gadgetId)) return;
    requested.add(gadgetId);

    for (const gadget of gadgets) {
      if (gadget.parentId === gadgetId) {
        visit(gadget.id);
      }
    }
  };

  visit(rootId);
  return requested;
}

export function buildOriginalGadgetDeletePlan<T extends DeletePlanGadgetLike>(gadgets: readonly T[], rootId: string): OriginalDeletePlan {
  const requestedIds = collectRequestedGadgetDeleteIds(gadgets, rootId);
  const deletedIds = new Set<string>();
  const skippedIds = new Set<string>();
  const splitterOwners = new Map<string, string>();

  for (const gadget of gadgets) {
    if (gadget.splitterId) {
      splitterOwners.set(gadget.id, gadget.splitterId);
    }
  }

  const orderedRequested = gadgets.filter(gadget => requestedIds.has(gadget.id));

  for (const gadget of orderedRequested) {
    if (gadget.kind === "SplitterGadget") {
      if (gadget.gadget1Id) splitterOwners.delete(gadget.gadget1Id);
      if (gadget.gadget2Id) splitterOwners.delete(gadget.gadget2Id);
    }

    if (splitterOwners.has(gadget.id)) {
      skippedIds.add(gadget.id);
      continue;
    }

    deletedIds.add(gadget.id);
  }

  return {
    requestedIds,
    deletedIds,
    skippedIds,
  };
}
