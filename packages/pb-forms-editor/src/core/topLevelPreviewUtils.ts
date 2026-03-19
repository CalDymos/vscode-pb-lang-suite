export type ToolBarEntryLike = {
  kind: string;
  idRaw?: string;
};

export type ToolBarModelLike = {
  entries?: ToolBarEntryLike[];
};

export type ToolBarPreviewInsertAction = "button" | "toggle" | "separator";
export type StatusBarPreviewInsertAction = "image" | "label" | "progress";

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
