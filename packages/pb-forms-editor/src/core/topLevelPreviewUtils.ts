import { parseStatusBarWidth } from "./statusbarPreviewUtils";

export type SourceLineLike = {
  line: number;
};

export type MenuEntryLike = {
  kind: string;
  level?: number;
  idRaw?: string;
  textRaw?: string;
  text?: string;
  shortcut?: string;
  iconRaw?: string;
  source?: SourceLineLike;
};

export type MenuModelLike = {
  entries?: MenuEntryLike[];
};

export type ToolBarEntryLike = {
  kind: string;
  idRaw?: string;
};

export type ToolBarModelLike = {
  entries?: ToolBarEntryLike[];
};

export type StatusBarFieldLike = {
  widthRaw: string;
  textRaw?: string;
  text?: string;
  flagsRaw?: string;
  progressBar?: boolean;
  progressRaw?: string;
  imageRaw?: string;
  imageId?: string;
};

export type StatusBarModelLike = {
  fields?: StatusBarFieldLike[];
};

export type PreviewRectLike = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PreviewEntryRectLike = PreviewRectLike & {
  ownerId: string;
  index: number;
};

export type PreviewMenuFooterRectLike = PreviewRectLike & {
  menuId: string;
  parentIndex: number;
};

export type PreviewMenuAddRectLike = PreviewRectLike & {
  menuId: string;
};

export type PreviewToolBarAddRectLike = PreviewRectLike & {
  toolBarId: string;
};

export type PreviewStatusBarAddRectLike = PreviewRectLike & {
  statusBarId: string;
};

export type TopLevelChromeHitLike =
  | { selection: { kind: "menu"; id: string }; rect: PreviewRectLike }
  | { selection: { kind: "menuEntry"; menuId: string; entryIndex: number }; rect: PreviewEntryRectLike }
  | { selection: { kind: "toolbar"; id: string }; rect: PreviewRectLike }
  | { selection: { kind: "toolBarEntry"; toolBarId: string; entryIndex: number }; rect: PreviewEntryRectLike }
  | { selection: { kind: "statusbar"; id: string }; rect: PreviewRectLike }
  | { selection: { kind: "statusBarField"; statusBarId: string; fieldIndex: number }; rect: PreviewEntryRectLike };

export type ToolBarPreviewInsertAction = "button" | "toggle" | "separator";
export type StatusBarPreviewInsertAction = "image" | "label" | "progress";

function toPbStringLiteral(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function unquotePbString(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function getMenuEntryLevel(entry: MenuEntryLike | undefined): number {
  return Math.max(0, entry?.level ?? 0);
}

export function getMenuPreviewLabel(entry: MenuEntryLike): string {
  if (entry.kind === "MenuBar" || entry.kind === "CloseSubMenu") return "";
  return (entry.text ?? unquotePbString(entry.textRaw) ?? entry.idRaw ?? entry.kind).trim();
}

export function getDefaultMenuItemInsertArgs(menu: MenuModelLike): { idRaw: string; textRaw: string } {
  let logicalCount = 0;
  for (const entry of menu.entries ?? []) {
    if (entry.kind === "CloseSubMenu") continue;
    logicalCount += 1;
  }

  const nextIndex = logicalCount + 1;
  return {
    idRaw: `#MenuItem_${nextIndex}`,
    textRaw: toPbStringLiteral(`MenuItem${nextIndex}`)
  };
}

export function getDirectMenuChildIndices(menu: MenuModelLike, parentIndex: number): number[] {
  const entries = menu.entries ?? [];
  if (parentIndex < 0 || parentIndex >= entries.length) return [];

  const childLevel = getMenuEntryLevel(entries[parentIndex]) + 1;
  const result: number[] = [];
  for (let i = parentIndex + 1; i < entries.length; i++) {
    const entry = entries[i];
    const level = getMenuEntryLevel(entry);
    if (level < childLevel) break;
    if (level !== childLevel) continue;
    if (entry.kind === "CloseSubMenu") continue;
    result.push(i);
  }
  return result;
}

export function getMenuAncestorChain(menu: MenuModelLike, entryIndex: number): number[] {
  const entries = menu.entries ?? [];
  if (entryIndex < 0 || entryIndex >= entries.length) return [];

  const chain = [entryIndex];
  let searchIndex = entryIndex - 1;
  let level = getMenuEntryLevel(entries[entryIndex]);

  while (searchIndex >= 0 && level > 0) {
    let foundIndex = -1;
    for (let i = searchIndex; i >= 0; i--) {
      const candidateLevel = getMenuEntryLevel(entries[i]);
      if (candidateLevel < level) {
        foundIndex = i;
        break;
      }
    }
    if (foundIndex < 0) break;
    chain.push(foundIndex);
    level = getMenuEntryLevel(entries[foundIndex]);
    searchIndex = foundIndex - 1;
  }

  chain.reverse();
  return chain;
}

export function getMenuEntrySourceLine(menu: MenuModelLike, entryIndex: number): number | undefined {
  return menu.entries?.[entryIndex]?.source?.line;
}

export function getMenuEntryBlockEndIndex(entries: MenuEntryLike[], entryIndex: number): number {
  if (entryIndex < 0 || entryIndex >= entries.length) return entryIndex;

  const entryLevel = getMenuEntryLevel(entries[entryIndex]);
  let endIndex = entryIndex;
  for (let i = entryIndex + 1; i < entries.length; i++) {
    if (getMenuEntryLevel(entries[i]) <= entryLevel) {
      break;
    }
    endIndex = i;
  }

  return endIndex;
}

export function getPredictedMenuEntryMoveIndex(
  menu: MenuModelLike,
  sourceEntryIndex: number,
  targetEntryIndex: number,
  placement: "before" | "after" | "appendChild"
): number | null {
  const entries = menu.entries ?? [];
  if (sourceEntryIndex < 0 || sourceEntryIndex >= entries.length) return null;
  if (targetEntryIndex < 0 || targetEntryIndex >= entries.length) return null;

  const sourceEndIndex = getMenuEntryBlockEndIndex(entries, sourceEntryIndex);
  let insertIndex = placement === "before"
    ? targetEntryIndex
    : getMenuEntryBlockEndIndex(entries, targetEntryIndex) + 1;

  if (insertIndex >= sourceEntryIndex && insertIndex <= sourceEndIndex + 1) {
    return null;
  }

  const blockLength = sourceEndIndex - sourceEntryIndex + 1;
  if (sourceEntryIndex < insertIndex) {
    insertIndex -= blockLength;
  }

  return Math.max(0, insertIndex);
}

export function isBoundToolBarTooltipEntry(toolBar: ToolBarModelLike, entryIndex: number): boolean {
  const entry = toolBar.entries?.[entryIndex];
  if (!entry || entry.kind !== "ToolBarToolTip") return false;
  const entryId = entry.idRaw?.trim();
  if (!entryId) return false;

  for (let i = entryIndex - 1; i >= 0; i--) {
    const candidate = toolBar.entries?.[i];
    if (!candidate || candidate.kind === "ToolBarToolTip") continue;
    if ((candidate.idRaw?.trim() ?? "") === entryId) return true;
  }

  return false;
}

export function shouldShowToolBarStructureEntry(toolBar: ToolBarModelLike, entryIndex: number): boolean {
  const entry = toolBar.entries?.[entryIndex];
  if (!entry) return false;
  if (entry.kind !== "ToolBarToolTip") return true;
  return !isBoundToolBarTooltipEntry(toolBar, entryIndex);
}

export function getVisibleToolBarEntryCount(toolBar: ToolBarModelLike): number {
  let count = 0;
  for (let i = 0; i < (toolBar.entries?.length ?? 0); i++) {
    if (!shouldShowToolBarStructureEntry(toolBar, i)) continue;
    count += 1;
  }
  return count;
}

export function getDefaultToolBarInsertId(toolBar: ToolBarModelLike): string {
  let logicalCount = 0;
  for (const entry of toolBar.entries ?? []) {
    if (entry.kind === "ToolBarToolTip") continue;
    logicalCount += 1;
  }

  return `#Toolbar_${logicalCount}`;
}

export function canEditToolBarTooltip(entry: ToolBarEntryLike): boolean {
  return entry.kind !== "ToolBarSeparator"
    && entry.kind !== "ToolBarToolTip"
    && typeof entry.idRaw === "string"
    && entry.idRaw.trim().length > 0;
}

export function getToolBarPreviewInsertArgs(
  toolBar: ToolBarModelLike,
  action: ToolBarPreviewInsertAction
): { kind: string; idRaw?: string; iconRaw?: string; toggle?: boolean } {
  const idRaw = getDefaultToolBarInsertId(toolBar);
  switch (action) {
    case "button":
      return { kind: "ToolBarImageButton", idRaw, iconRaw: "0" };
    case "toggle":
      return { kind: "ToolBarImageButton", idRaw, iconRaw: "0", toggle: true };
    case "separator":
      return { kind: "ToolBarSeparator" };
  }
}

export function getStatusBarPreviewInsertArgs(
  action: StatusBarPreviewInsertAction
): { widthRaw: string; textRaw?: string; imageRaw?: string; flagsRaw?: string; progressBar?: boolean; progressRaw?: string } {
  switch (action) {
    case "image":
      return { widthRaw: "96", imageRaw: "0", flagsRaw: "#PB_StatusBar_Raised" };
    case "label":
      return { widthRaw: "120", textRaw: '"StatusBarField"' };
    case "progress":
      return { widthRaw: "120", progressBar: true, progressRaw: "50" };
  }
}

export function hasPbFlag(flagsExpr: string | undefined, flag: string): boolean {
  if (!flagsExpr) return false;
  const parts = flagsExpr.split("|").map((part) => part.trim());
  return parts.includes(flag);
}

export function getStatusBarFieldWidths(
  statusBar: StatusBarModelLike,
  totalWidth: number,
  minWidth = 18
): number[] {
  let fixedWidth = 0;
  let flexibleCount = 0;
  for (const field of statusBar.fields ?? []) {
    const parsed = parseStatusBarWidth(field.widthRaw);
    if (parsed === null) {
      flexibleCount += 1;
    } else {
      fixedWidth += parsed;
    }
  }

  const remainingWidth = Math.max(0, totalWidth - fixedWidth);
  const flexibleWidth = flexibleCount > 0 ? Math.max(1, Math.floor(remainingWidth / flexibleCount)) : 0;

  return (statusBar.fields ?? []).map((field) => {
    const parsedWidth = parseStatusBarWidth(field.widthRaw);
    return Math.max(minWidth, parsedWidth ?? flexibleWidth);
  });
}

export function getMenuFlyoutPanelRect(
  menu: MenuModelLike,
  parentIndex: number,
  anchorRect: PreviewRectLike,
  measureText: (text: string) => number
): PreviewRectLike | null {
  const childIndices = getDirectMenuChildIndices(menu, parentIndex);

  let innerWidth = 0;
  let height = 20;
  for (const childIndex of childIndices) {
    const entry = menu.entries?.[childIndex];
    if (!entry) continue;
    if (entry.kind === "MenuBar") {
      height += 12;
      continue;
    }

    let textWidth = Math.ceil(measureText(getMenuPreviewLabel(entry)));
    if (entry.shortcut) {
      textWidth += Math.ceil(measureText(entry.shortcut));
    }
    textWidth += 24;
    innerWidth = Math.max(innerWidth, textWidth);
    height += 20;
  }

  const width = Math.max(100, innerWidth + 40);
  return {
    x: anchorRect.x,
    y: anchorRect.y,
    w: width,
    h: Math.max(0, height)
  };
}


function rectContainsPoint(rect: PreviewRectLike, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function resolvePreviewRectHit<T extends PreviewRectLike>(
  rect: T | null | undefined,
  x: number,
  y: number
): T | null {
  return rect && rectContainsPoint(rect, x, y) ? rect : null;
}

export function resolvePreviewRectListHit<T extends PreviewRectLike>(
  rects: T[] | undefined,
  x: number,
  y: number
): T | null {
  return rects?.find((rect) => rectContainsPoint(rect, x, y)) ?? null;
}

export function resolveTopLevelChromeHit(args: {
  x: number;
  y: number;
  windowHit: boolean;
  menuId?: string;
  menuRect?: PreviewRectLike | null;
  menuEntryRects?: PreviewEntryRectLike[];
  toolBarId?: string;
  toolBarRect?: PreviewRectLike | null;
  toolBarEntryRects?: PreviewEntryRectLike[];
  statusBarId?: string;
  statusBarRect?: PreviewRectLike | null;
  statusBarFieldRects?: PreviewEntryRectLike[];
}): TopLevelChromeHitLike | null {
  if (!args.windowHit) return null;

  if (args.statusBarId && args.statusBarRect && rectContainsPoint(args.statusBarRect, args.x, args.y)) {
    const fieldHit = resolvePreviewRectListHit(args.statusBarFieldRects, args.x, args.y);
    if (fieldHit) {
      return { selection: { kind: "statusBarField", statusBarId: fieldHit.ownerId, fieldIndex: fieldHit.index }, rect: fieldHit };
    }
    return { selection: { kind: "statusbar", id: args.statusBarId }, rect: args.statusBarRect };
  }

  if (args.menuId && args.menuRect && rectContainsPoint(args.menuRect, args.x, args.y)) {
    const entryHit = resolvePreviewRectListHit(args.menuEntryRects, args.x, args.y);
    if (entryHit) {
      return { selection: { kind: "menuEntry", menuId: entryHit.ownerId, entryIndex: entryHit.index }, rect: entryHit };
    }
    return { selection: { kind: "menu", id: args.menuId }, rect: args.menuRect };
  }

  if (args.toolBarId && args.toolBarRect && rectContainsPoint(args.toolBarRect, args.x, args.y)) {
    const entryHit = resolvePreviewRectListHit(args.toolBarEntryRects, args.x, args.y);
    if (entryHit) {
      return { selection: { kind: "toolBarEntry", toolBarId: entryHit.ownerId, entryIndex: entryHit.index }, rect: entryHit };
    }
    return { selection: { kind: "toolbar", id: args.toolBarId }, rect: args.toolBarRect };
  }

  return null;
}
