export type SourceLineLike = {
  line: number;
};

export type MenuEntryLike = {
  kind: string;
  source?: SourceLineLike;
};

export type MenuModelLike = {
  id: string;
  entries?: MenuEntryLike[];
};

export type ToolBarEntryLike = {
  kind: string;
  source?: SourceLineLike;
};

export type ToolBarModelLike = {
  id: string;
  entries?: ToolBarEntryLike[];
};

export type StatusBarFieldLike = {
  source?: SourceLineLike;
};

export type StatusBarModelLike = {
  id: string;
  fields?: StatusBarFieldLike[];
};

export type TopLevelCanvasDeleteSelectionLike =
  | { kind: "menuEntry"; menuId: string; entryIndex: number }
  | { kind: "toolBarEntry"; toolBarId: string; entryIndex: number }
  | { kind: "statusBarField"; statusBarId: string; fieldIndex: number };

export type TopLevelCanvasDeleteContextMenuAction =
  | {
      kind: "deleteMenuEntry";
      label: "Delete MenuItem…";
      title: string;
      enabled: boolean;
      menuId: string;
      entryIndex: number;
      entryKind: string;
      sourceLine?: number;
      confirmLabel: "Delete Entry";
      message: string;
    }
  | {
      kind: "deleteToolBarEntry";
      label: "Delete ToolbarItem…";
      title: string;
      enabled: boolean;
      toolBarId: string;
      entryIndex: number;
      entryKind: string;
      sourceLine?: number;
      confirmLabel: "Delete Entry";
      message: string;
    }
  | {
      kind: "deleteStatusBarField";
      label: "Delete StatusBarField…";
      title: string;
      enabled: boolean;
      statusBarId: string;
      fieldIndex: number;
      sourceLine?: number;
      confirmLabel: "Delete Field";
      message: string;
    };

export function resolveTopLevelCanvasDeleteContextMenuAction(args: {
  selection: TopLevelCanvasDeleteSelectionLike;
  menus?: MenuModelLike[];
  toolbars?: ToolBarModelLike[];
  statusbars?: StatusBarModelLike[];
}): TopLevelCanvasDeleteContextMenuAction | null {
  const { selection } = args;
  switch (selection.kind) {
    case "menuEntry": {
      const menu = args.menus?.find(entry => entry.id === selection.menuId);
      const item = menu?.entries?.[selection.entryIndex];
      if (!menu || !item) return null;
      const sourceLine = item.source?.line;
      const enabled = typeof sourceLine === "number";
      return {
        kind: "deleteMenuEntry",
        label: "Delete MenuItem…",
        title: enabled
          ? "Delete the currently selected menu entry."
          : "Only parsed menu entries with a source line can be deleted.",
        enabled,
        menuId: menu.id,
        entryIndex: selection.entryIndex,
        entryKind: item.kind,
        sourceLine,
        confirmLabel: "Delete Entry",
        message: `Delete the selected ${item.kind} entry from menu '${menu.id}'?`
      };
    }
    case "toolBarEntry": {
      const toolBar = args.toolbars?.find(entry => entry.id === selection.toolBarId);
      const item = toolBar?.entries?.[selection.entryIndex];
      if (!toolBar || !item) return null;
      const sourceLine = item.source?.line;
      const enabled = typeof sourceLine === "number";
      return {
        kind: "deleteToolBarEntry",
        label: "Delete ToolbarItem…",
        title: enabled
          ? "Delete the currently selected toolbar entry."
          : "Only parsed toolbar entries with a source line can be deleted.",
        enabled,
        toolBarId: toolBar.id,
        entryIndex: selection.entryIndex,
        entryKind: item.kind,
        sourceLine,
        confirmLabel: "Delete Entry",
        message: `Delete the selected ${item.kind} entry from toolbar '${toolBar.id}'?`
      };
    }
    case "statusBarField": {
      const statusBar = args.statusbars?.find(entry => entry.id === selection.statusBarId);
      const field = statusBar?.fields?.[selection.fieldIndex];
      if (!statusBar || !field) return null;
      const sourceLine = field.source?.line;
      const enabled = typeof sourceLine === "number";
      return {
        kind: "deleteStatusBarField",
        label: "Delete StatusBarField…",
        title: enabled
          ? "Delete the currently selected statusbar field."
          : "Only parsed statusbar fields with a source line can be deleted.",
        enabled,
        statusBarId: statusBar.id,
        fieldIndex: selection.fieldIndex,
        sourceLine,
        confirmLabel: "Delete Field",
        message: `Delete field ${selection.fieldIndex} from statusbar '${statusBar.id}'?`
      };
    }
  }
}
