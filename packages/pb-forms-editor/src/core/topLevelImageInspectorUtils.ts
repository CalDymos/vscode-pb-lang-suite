export type TopLevelSelectedImageInspectorTarget = "menuEntry" | "toolBarEntry" | "statusBarField";

export interface TopLevelSelectedImageInspectorConfig {
  currentImageEditable: boolean;
  changeImageButtonLabel: string;
  changeImageButtonTitle: string;
  showExpertActions: boolean;
  showClearAction: boolean;
  showImageJumpAction: boolean;
}

export function getTopLevelSelectedImageInspectorConfig(target: TopLevelSelectedImageInspectorTarget): TopLevelSelectedImageInspectorConfig {
  switch (target) {
    case "menuEntry":
      return {
        currentImageEditable: false,
        changeImageButtonLabel: "Select",
        changeImageButtonTitle: "Choose a file for this menu entry.",
        showExpertActions: false,
        showClearAction: false,
        showImageJumpAction: false,
      };
    case "toolBarEntry":
      return {
        currentImageEditable: false,
        changeImageButtonLabel: "Select",
        changeImageButtonTitle: "Choose a file for this toolbar button.",
        showExpertActions: false,
        showClearAction: false,
        showImageJumpAction: false,
      };
    case "statusBarField":
      return {
        currentImageEditable: true,
        changeImageButtonLabel: "Select",
        changeImageButtonTitle: "Choose a file for this statusbar field.",
        showExpertActions: false,
        showClearAction: false,
        showImageJumpAction: false,
      };
  }
}
