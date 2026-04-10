export type TopLevelMenuSelection = {
  kind: "menu";
  id: string;
};

export type TopLevelMenuEntrySelection = {
  kind: "menuEntry";
  menuId: string;
  entryIndex: number;
};

export type TopLevelToolBarSelection = {
  kind: "toolbar";
  id: string;
};

export type TopLevelToolBarEntrySelection = {
  kind: "toolBarEntry";
  toolBarId: string;
  entryIndex: number;
};

export type TopLevelStatusBarSelection = {
  kind: "statusbar";
  id: string;
};

export type TopLevelStatusBarFieldSelection = {
  kind: "statusBarField";
  statusBarId: string;
  fieldIndex: number;
};

export type DesignerTopLevelSelection =
  | TopLevelMenuSelection
  | TopLevelMenuEntrySelection
  | TopLevelToolBarSelection
  | TopLevelToolBarEntrySelection
  | TopLevelStatusBarSelection
  | TopLevelStatusBarFieldSelection;

export type DesignerTopLevelContainerSelection =
  | TopLevelMenuSelection
  | TopLevelToolBarSelection
  | TopLevelStatusBarSelection;

export type DesignerTopLevelEntrySelection =
  | TopLevelMenuEntrySelection
  | TopLevelToolBarEntrySelection
  | TopLevelStatusBarFieldSelection;

export type TopLevelSelectedImageInspectorTarget = DesignerTopLevelEntrySelection["kind"];

export type TopLevelCanvasContextMenuSelection =
  | DesignerTopLevelSelection
  | {
      kind: "toolBarAddButton";
      toolBarId: string;
    }
  | {
      kind: "statusBarAddButton";
      statusBarId: string;
    };
