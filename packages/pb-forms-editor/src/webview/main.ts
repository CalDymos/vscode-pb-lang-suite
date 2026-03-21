import {
  type PreviewRect,
  type PreviewChromeMetrics,
  type PanelTabLayout,
  type WindowChromeLayout,
  type ResizeHandle,
  intersectRect,
  rectContainsPoint,
  isPointOnRectBorder,
  getScrollAreaBarSize,
  getScrollAreaVerticalBarRect,
  getScrollAreaHorizontalBarRect,
  getScrollAreaViewportRect,
  clampScrollAreaOffset,
  getScrollAreaMaxOffsetX,
  getScrollAreaMaxOffsetY,
  getScrollAreaVerticalThumbRect,
  getScrollAreaHorizontalThumbRect,
  resolvePanelActiveItem,
  getPanelTabLayouts,
  getSplitterBarRect,
  getSplitterPaneRect,
  getGadgetContentRect,
  getStatusBarAlignedX,
  getWindowChromeLayout,
  resolvePreviewChromeMetrics,
  getRectHandlePoints,
  hitHandlePoints,
  clampRect,
  applyResize,
  isPointInTitleBar as isPointInWindowTitleBarRect,
  isPointInWindowRect,
  toWindowGlobalPoint,
  toWindowLocalPoint
} from "../core/previewChromeUtils";
import {
  STATUSBAR_KNOWN_FLAGS,
  buildStatusBarFlagsRaw,
  getStatusBarFieldDisplaySummary,
  getStatusBarProgressPreviewMetrics,
  parseStatusBarWidth
} from "../core/statusbarPreviewUtils";
import {
  getStatusBarProgressInspectorValue,
  normalizeStatusBarProgressRaw,
  parseStatusBarWidthInspectorInput,
  STATUSBAR_WIDTH_IGNORE_LITERAL
} from "../core/statusbarInspectorUtils";
import {
  type MenuEntryMovePlacement,
  type MenuEntryMoveTargetLike,
  canEditToolBarTooltip,
  getDefaultMenuItemInsertArgs,
  getMenuEntryMoveTarget,
  getMenuEntryRect,
  getMenuFlyoutPanelRect,
  getOpenSubMenuBalance,
  getDirectMenuChildIndices,
  getMenuAncestorChain,
  getMenuEntryBlockEndIndex,
  getMenuEntryLevel,
  getMenuEntrySourceLine,
  getMenuFooterRect,
  getMenuPreviewLabel,
  getMenuVisibleEntries,
  getPredictedMenuEntryMoveIndex,
  getStatusBarFieldWidths,
  getStatusBarPreviewInsertArgs,
  getToolBarPreviewInsertArgs,
  hasPbFlag,
  resolveMenuFooterHit,
  resolvePreviewRectHit,
  resolveTopLevelChromeHit,
  unquotePbString,
  getVisibleToolBarEntryCount,
  shouldShowToolBarStructureEntry
} from "../core/topLevelPreviewUtils";

import {
  buildGadgetCheckedStateRaw,
  buildGadgetHorizontalLockResizeUpdate,
  buildGadgetVerticalLockResizeUpdate,
  buildGadgetTextRaw,
  buildGadgetTooltipRaw,
  canEditGadgetCheckedState,
  canEditGadgetColors,
  canEditGadgetHorizontalLocks,
  canEditGadgetText,
  getCustomGadgetHelpDisplay,
  getGadgetCtorRangeFieldLabels,
  getGadgetCtorRangeInspectorValue,
  getGadgetFontDisplaySummary,
  getGadgetTextInspectorValue,
  getGadgetTooltipInspectorValue
} from "../core/gadgetInspectorUtils";

import {
  hasRectChanged,
  retainPanelActiveItems,
  syncPanelActiveItemsForSelection
} from "../core/webviewStateUtils";
import {
  buildWindowFlagsExpr,
  getWindowPositionInspectorValue,
  parseWindowCustomFlagsInput,
  parseWindowVariableNameInspectorInput,
  parseWindowPositionInspectorInput,
  WINDOW_POSITION_IGNORE_LITERAL
} from "../core/windowInspectorUtils";
import {
  cssHexToPbRgbRaw,
  parseWindowColorInspectorInput,
  pbColorNumberToCssHex,
  WINDOW_COLOR_LITERAL_ERROR_MESSAGE
} from "../core/colorInspectorUtils";
import {
  PB_WRONG_VARIABLE_NAME_MESSAGE,
  isValidPbVariableReference
} from "../core/propertyValidationUtils";
import {
  getStatusBarCurrentImageEditState,
  resolveStatusBarCurrentImageCreate,
  resolveStatusBarCurrentImageRebind,
  shouldCleanupStatusBarReboundImage
} from "../core/statusbarImageInspectorUtils";

type SourceRange = { line: number };

type GadgetItem = {
  index?: number;
  posRaw: string;
  textRaw?: string;
  text?: string;
  imageRaw?: string;
  imageId?: string;
  flagsRaw?: string;
  source?: SourceRange;
};

type GadgetColumn = {
  index?: number;
  colRaw: string;
  titleRaw?: string;
  title?: string;
  widthRaw?: string;
  source?: SourceRange;
};

type Gadget = {
  id: string;
  kind: string;
  parentId?: string;
  parentItem?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  xRaw?: string;
  yRaw?: string;
  wRaw?: string;
  hRaw?: string;
  textRaw?: string;
  text?: string;
  textVariable?: boolean;
  imageRaw?: string;
  imageId?: string;
  minRaw?: string;
  min?: number;
  maxRaw?: string;
  max?: number;
  gadget1Raw?: string;
  gadget1Id?: string;
  gadget2Raw?: string;
  gadget2Id?: string;
  splitterId?: string;
  flagsExpr?: string;
  tooltipRaw?: string;
  tooltip?: string;
  tooltipVariable?: boolean;
  stateRaw?: string;
  state?: number;
  customSelectName?: string;
  customInitRaw?: string;
  customCreateRaw?: string;
  frontColorRaw?: string;
  frontColor?: number;
  backColorRaw?: string;
  backColor?: number;
  gadgetFontRaw?: string;
  gadgetFont?: string;
  gadgetFontSize?: number;
  gadgetFontFlagsRaw?: string;
  hiddenRaw?: string;
  hidden?: boolean;
  disabledRaw?: string;
  disabled?: boolean;
  lockLeft?: boolean;
  lockRight?: boolean;
  lockTop?: boolean;
  lockBottom?: boolean;
  resizeXRaw?: string;
  resizeYRaw?: string;
  resizeWRaw?: string;
  resizeHRaw?: string;
  resizeSource?: SourceRange;
  eventProc?: string;
  items?: GadgetItem[];
  columns?: GadgetColumn[];
};

type WindowModel = {
  id: string;
  pbAny: boolean;
  variable?: string;
  enumValueRaw?: string;
  firstParam: string;
  x: number;
  y: number;
  w: number;
  h: number;
  xRaw?: string;
  yRaw?: string;
  wRaw?: string;
  hRaw?: string;
  captionRaw?: string;
  captionVariable?: boolean;
  title?: string;
  flagsExpr?: string;
  knownFlags?: string[];
  customFlags?: string[];
  hiddenRaw?: string;
  hidden?: boolean;
  disabledRaw?: string;
  disabled?: boolean;
  parentRaw?: string;
  parent?: string;
  colorRaw?: string;
  color?: number;
  eventFile?: string;
  eventProc?: string;
  generateEventLoop?: boolean;
  hasEventGadgetBlock?: boolean;
  hasEventGadgetCaseBranches?: boolean;
  hasEventMenuBlock?: boolean;
};

type MenuEntry = {
  kind: string;
  level?: number;
  idRaw?: string;
  textRaw?: string;
  text?: string;
  shortcut?: string;
  iconRaw?: string;
  iconId?: string;
  widthRaw?: string;
  toggle?: boolean;
  event?: string;
  source?: SourceRange;
};

type MenuModel = {
  id: string;
  entries: MenuEntry[];
};

type ToolBarEntry = {
  kind: string;
  idRaw?: string;
  iconRaw?: string;
  iconId?: string;
  textRaw?: string;
  text?: string;
  tooltip?: string;
  toggle?: boolean;
  event?: string;
  source?: SourceRange;
};

type ToolbarModel = {
  id: string;
  entries: ToolBarEntry[];
};

type StatusbarField = {
  widthRaw: string;
  textRaw?: string;
  text?: string;
  imageRaw?: string;
  imageId?: string;
  flagsRaw?: string;
  progressBar?: boolean;
  progressRaw?: string;
  source?: SourceRange;
};

type StatusbarModel = {
  id: string;
  fields: StatusbarField[];
};

type ImageEntry = {
  id: string;
  pbAny: boolean;
  variable?: string;
  firstParam: string;
  imageRaw: string;
  image?: string;
  inline: boolean;
  source?: SourceRange;
};

type Model = {
  window?: WindowModel;
  gadgets: Gadget[];
  menus?: MenuModel[];
  toolbars?: ToolbarModel[];
  statusbars?: StatusbarModel[];
  images: ImageEntry[];
  procedureNames?: string[];
  meta?: {
    header?: { version?: string; line: number; hasStrictSyntaxWarning: boolean };
    issues?: Array<{ severity: "error" | "warning" | "info"; message: string; line?: number }>;
  };
};

type GridMode = "dots" | "lines";
type SnapMode = "live" | "drop";

type DesignerSettings = {
  showGrid: boolean;
  gridMode: GridMode;
  gridSize: number;
  gridOpacity: number;

  snapToGrid: boolean;
  snapMode: SnapMode;

  windowFillOpacity: number;
  outsideDimOpacity: number;
  titleBarHeight: number;

  canvasBackground: string;
  canvasReadonlyBackground: string;
};

const EXT_TO_WEBVIEW_MSG_TYPE = {
  init: "init",
  settings: "settings",
  error: "error"
} as const;

const WEBVIEW_TO_EXT_MSG_TYPE = {
  ready: "ready",

  moveGadget: "moveGadget",
  setGadgetRect: "setGadgetRect",
  setGadgetOpenArgs: "setGadgetOpenArgs",
  setCustomGadgetCode: "setCustomGadgetCode",
  setGadgetProperties: "setGadgetProperties",
  setGadgetEventProc: "setGadgetEventProc",
  setGadgetImageRaw: "setGadgetImageRaw",
  setGadgetStateRaw: "setGadgetStateRaw",
  setGadgetResizeRaw: "setGadgetResizeRaw",
  setWindowRect: "setWindowRect",
  setWindowOpenArgs: "setWindowOpenArgs",
  setWindowProperties: "setWindowProperties",
  toggleWindowPbAny: "toggleWindowPbAny",
  setWindowEnumValue: "setWindowEnumValue",
  setWindowVariableName: "setWindowVariableName",
  setWindowEventFile: "setWindowEventFile",
  setWindowEventProc: "setWindowEventProc",
  setWindowGenerateEventLoop: "setWindowGenerateEventLoop",

  insertGadgetItem: "insertGadgetItem",
  updateGadgetItem: "updateGadgetItem",
  deleteGadgetItem: "deleteGadgetItem",

  insertGadgetColumn: "insertGadgetColumn",
  updateGadgetColumn: "updateGadgetColumn",
  deleteGadgetColumn: "deleteGadgetColumn",

  insertMenuEntry: "insertMenuEntry",
  moveMenuEntry: "moveMenuEntry",
  updateMenuEntry: "updateMenuEntry",
  deleteMenuEntry: "deleteMenuEntry",
  deleteMenu: "deleteMenu",
  setMenuEntryEvent: "setMenuEntryEvent",

  insertToolBarEntry: "insertToolBarEntry",
  updateToolBarEntry: "updateToolBarEntry",
  deleteToolBarEntry: "deleteToolBarEntry",
  deleteToolBar: "deleteToolBar",
  setToolBarEntryEvent: "setToolBarEntryEvent",
  setToolBarEntryTooltip: "setToolBarEntryTooltip",

  insertStatusBarField: "insertStatusBarField",
  updateStatusBarField: "updateStatusBarField",
  deleteStatusBarField: "deleteStatusBarField",
  deleteStatusBar: "deleteStatusBar",

  insertImage: "insertImage",
  updateImage: "updateImage",
  deleteImage: "deleteImage",
  relativizeImagePath: "relativizeImagePath",
  chooseImageFileForEntry: "chooseImageFileForEntry",
  toggleImagePbAny: "toggleImagePbAny",

  createAndAssignGadgetImage: "createAndAssignGadgetImage",
  chooseFileAndAssignGadgetImage: "chooseFileAndAssignGadgetImage",
  createAndAssignMenuEntryImage: "createAndAssignMenuEntryImage",
  createAndAssignToolBarEntryImage: "createAndAssignToolBarEntryImage",
  createAndAssignStatusBarFieldImage: "createAndAssignStatusBarFieldImage",
  chooseFileAndAssignMenuEntryImage: "chooseFileAndAssignMenuEntryImage",
  chooseFileAndAssignToolBarEntryImage: "chooseFileAndAssignToolBarEntryImage",
  chooseFileAndAssignStatusBarFieldImage: "chooseFileAndAssignStatusBarFieldImage",
  rebindStatusBarFieldImage: "rebindStatusBarFieldImage"
} as const;

// Backwards compatible:
// - init may come without settings
type ExtensionToWebviewMessage =
  | { type: typeof EXT_TO_WEBVIEW_MSG_TYPE.init; model: Model; settings?: DesignerSettings }
  | { type: typeof EXT_TO_WEBVIEW_MSG_TYPE.settings; settings: DesignerSettings }
  | { type: typeof EXT_TO_WEBVIEW_MSG_TYPE.error; message: string };

type WebviewToExtensionMessage =
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.ready }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.moveGadget; id: string; x: number; y: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetRect; id: string; x: number; y: number; w: number; h: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetOpenArgs; id: string; textRaw?: string; minRaw?: string; maxRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setCustomGadgetCode; id: string; customInitRaw?: string; customCreateRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetProperties; id: string; hiddenRaw?: string; disabledRaw?: string; tooltipRaw?: string; frontColorRaw?: string; backColorRaw?: string; gadgetFontRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetEventProc; id: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetImageRaw; id: string; imageRaw: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetStateRaw; id: string; stateRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetResizeRaw; id: string; xRaw?: string; yRaw?: string; wRaw?: string; hRaw?: string; deleteResize?: boolean }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowRect; id: string; x: number; y: number; w: number; h: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowOpenArgs; windowKey: string; xRaw?: string; yRaw?: string; wRaw?: string; hRaw?: string; captionRaw?: string; flagsExpr?: string; parentRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowProperties; windowKey: string; hiddenRaw?: string; disabledRaw?: string; colorRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.toggleWindowPbAny; windowKey: string; toPbAny: boolean; variableName: string; enumSymbol: string; enumValueRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowEnumValue; enumSymbol: string; enumValueRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowVariableName; variableName?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowEventFile; windowKey: string; eventFile?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowEventProc; windowKey: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowGenerateEventLoop; windowKey: string; enabled: boolean }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertGadgetItem; id: string; posRaw: string; textRaw: string; imageRaw?: string; flagsRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateGadgetItem; id: string; sourceLine: number; posRaw: string; textRaw: string; imageRaw?: string; flagsRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteGadgetItem; id: string; sourceLine: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertGadgetColumn; id: string; colRaw: string; titleRaw: string; widthRaw: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateGadgetColumn; id: string; sourceLine: number; colRaw: string; titleRaw: string; widthRaw: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteGadgetColumn; id: string; sourceLine: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertMenuEntry; menuId: string; kind: string; idRaw?: string; textRaw?: string; parentSourceLine?: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.moveMenuEntry; menuId: string; sourceLine: number; kind: string; targetSourceLine: number; placement: "before" | "after" | "appendChild" }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateMenuEntry; menuId: string; sourceLine: number; kind: string; idRaw?: string; textRaw?: string; shortcut?: string; iconRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteMenuEntry; menuId: string; sourceLine: number; kind: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteMenu; menuId: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setMenuEntryEvent; entryIdRaw: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertToolBarEntry; toolBarId: string; kind: string; idRaw?: string; iconRaw?: string; textRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateToolBarEntry; toolBarId: string; sourceLine: number; kind: string; idRaw?: string; iconRaw?: string; textRaw?: string; toggle?: boolean }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteToolBarEntry; toolBarId: string; sourceLine: number; kind: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteToolBar; toolBarId: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setToolBarEntryEvent; entryIdRaw: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setToolBarEntryTooltip; toolBarId: string; sourceLine: number; entryIdRaw: string; textRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertStatusBarField; statusBarId: string; widthRaw: string; textRaw?: string; imageRaw?: string; flagsRaw?: string; progressBar?: boolean; progressRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateStatusBarField; statusBarId: string; sourceLine: number; widthRaw: string; textRaw?: string; imageRaw?: string; flagsRaw?: string; progressBar?: boolean; progressRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteStatusBarField; statusBarId: string; sourceLine: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteStatusBar; statusBarId: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertImage; inline: boolean; idRaw: string; imageRaw: string; assignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateImage; sourceLine: number; inline: boolean; idRaw: string; imageRaw: string; assignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteImage; sourceLine: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.relativizeImagePath; sourceLine: number; inline: boolean; idRaw: string; imageRaw: string; assignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseImageFileForEntry; sourceLine: number; inline: boolean; idRaw: string; assignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.toggleImagePbAny; sourceLine: number; toPbAny: boolean }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignGadgetImage; id: string; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignGadgetImage; id: string; x: number; y: number; resizeToImage: boolean; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignMenuEntryImage; menuId: string; sourceLine: number; kind: string; idRaw?: string; textRaw?: string; shortcut?: string; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignToolBarEntryImage; toolBarId: string; sourceLine: number; kind: string; idRaw?: string; toggle?: boolean; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignStatusBarFieldImage; statusBarId: string; sourceLine: number; widthRaw: string; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string; oldImageId?: string; oldImageSourceLine?: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignMenuEntryImage; menuId: string; sourceLine: number; kind: string; idRaw?: string; textRaw?: string; shortcut?: string; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignToolBarEntryImage; toolBarId: string; sourceLine: number; kind: string; idRaw?: string; toggle?: boolean; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignStatusBarFieldImage; statusBarId: string; sourceLine: number; widthRaw: string; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.rebindStatusBarFieldImage; statusBarId: string; sourceLine: number; widthRaw: string; imageRaw: string; oldImageId?: string; oldImageSourceLine?: number };

declare const acquireVsCodeApi: () => { postMessage: (msg: WebviewToExtensionMessage) => void };

const vscode = acquireVsCodeApi();

function post(msg: WebviewToExtensionMessage) {
  vscode.postMessage(msg);
}


const canvas = document.getElementById("designer") as HTMLCanvasElement;
const propsEl = document.getElementById("props") as HTMLDivElement;
const listEl = document.getElementById("list") as HTMLDivElement;
const parentSelEl = document.getElementById("parentSel") as HTMLSelectElement;
const errEl = document.getElementById("err") as HTMLDivElement;
const diagEl = document.getElementById("diag") as HTMLDivElement;
const infoHintEl = document.getElementById("infoHint") as HTMLDivElement;
const infoSelectionEl = document.getElementById("infoSelection") as HTMLDivElement;

let model: Model = { gadgets: [], images: [] };

type DesignerSelection =
  | { kind: "gadget"; id: string }
  | { kind: "window" }
  | { kind: "menu"; id: string }
  | { kind: "menuEntry"; menuId: string; entryIndex: number }
  | { kind: "toolbar"; id: string }
  | { kind: "toolBarEntry"; toolBarId: string; entryIndex: number }
  | { kind: "statusbar"; id: string }
  | { kind: "statusBarField"; statusBarId: string; fieldIndex: number }
  | { kind: "images" }
  | { kind: "image"; id: string }
  | null;
let selection: DesignerSelection = null;

type PendingMenuEntrySelection = {
  menuId: string;
  preferredIndex: number;
  kind: string;
  level: number;
  idRaw?: string;
  textRaw?: string;
  shortcut?: string;
  iconRaw?: string;
};

type PendingToolBarEntrySelection = {
  toolBarId: string;
  preferredIndex: number;
  kind: string;
  idRaw?: string;
  iconRaw?: string;
  textRaw?: string;
  toggle?: boolean;
};

type PendingStatusBarFieldSelection = {
  statusBarId: string;
  preferredIndex: number;
  widthRaw: string;
  textRaw?: string;
  imageRaw?: string;
  flagsRaw?: string;
  progressBar?: boolean;
  progressRaw?: string;
};

let pendingMenuEntrySelection: PendingMenuEntrySelection | null = null;
let pendingToolBarEntrySelection: PendingToolBarEntrySelection | null = null;
let pendingStatusBarFieldSelection: PendingStatusBarFieldSelection | null = null;

type PendingImageEditor = {
  sourceLine: number;
  inline: boolean;
  idRaw: string;
  imageRaw: string;
  assignedVar: string;
};

type ImageAssignmentTarget =
  | { kind: "menuEntry"; menuId: string; entryIndex: number }
  | { kind: "toolBarEntry"; toolBarId: string; entryIndex: number }
  | { kind: "statusBarField"; statusBarId: string; fieldIndex: number }
  | { kind: "gadget"; gadgetId: string };

type PendingImageReferencePicker = {
  target: ImageAssignmentTarget;
  selectedImageId: string;
};

type PendingImageAssignmentDraft = {
  target: ImageAssignmentTarget;
  mode: "create" | "chooseFile";
  inline: boolean;
  idRaw: string;
  imageRaw: string;
  assignedVar: string;
  resizeToImage: boolean;
};

type PendingImageInsertDraft = {
  inline: boolean;
  idRaw: string;
  imageRaw: string;
  assignedVar: string;
};

type PendingGadgetItemEditor = {
  gadgetId: string;
  sourceLine?: number;
  posRaw: string;
  text: string;
  imageRaw: string;
  flagsRaw: string;
};

type PendingGadgetColumnEditor = {
  gadgetId: string;
  sourceLine?: number;
  colRaw: string;
  title: string;
  widthRaw: string;
};

type PendingDestructiveAction =
  | { kind: "deleteMenuEntry"; menuId: string; entryIndex: number; sourceLine: number; entryKind: string; message: string; confirmLabel: string }
  | { kind: "deleteMenu"; menuId: string; message: string; confirmLabel: string }
  | { kind: "deleteToolBarEntry"; toolBarId: string; entryIndex: number; sourceLine: number; entryKind: string; message: string; confirmLabel: string }
  | { kind: "deleteToolBar"; toolBarId: string; message: string; confirmLabel: string }
  | { kind: "deleteStatusBarField"; statusBarId: string; fieldIndex: number; sourceLine: number; message: string; confirmLabel: string }
  | { kind: "clearStatusBarField"; statusBarId: string; fieldIndex: number; sourceLine: number; message: string; confirmLabel: string }
  | { kind: "deleteStatusBar"; statusBarId: string; message: string; confirmLabel: string }
  | { kind: "deleteImage"; imageId: string; sourceLine: number; message: string; confirmLabel: string }
  | { kind: "deleteGadgetItem"; gadgetId: string; sourceLine: number; message: string; confirmLabel: string }
  | { kind: "deleteGadgetColumn"; gadgetId: string; sourceLine: number; message: string; confirmLabel: string };

let pendingImageEditor: PendingImageEditor | null = null;
let pendingImageReferencePicker: PendingImageReferencePicker | null = null;
let pendingImageAssignmentDraft: PendingImageAssignmentDraft | null = null;
let pendingImageInsertDraft: PendingImageInsertDraft | null = null;
let pendingGadgetItemEditor: PendingGadgetItemEditor | null = null;
let pendingGadgetColumnEditor: PendingGadgetColumnEditor | null = null;
let pendingDestructiveAction: PendingDestructiveAction | null = null;

const expanded = new Map<string, boolean>();
const panelActiveItems = new Map<string, number>();
const scrollAreaOffsets = new Map<string, { x: number; y: number }>();

type PreviewEntryRect = PreviewRect & { ownerId: string; index: number };
type PreviewMenuFooterRect = PreviewRect & { menuId: string; parentIndex: number };
type PreviewMenuAddRect = PreviewRect & { menuId: string };
type PreviewToolBarAddRect = PreviewRect & { toolBarId: string };
type PreviewStatusBarAddRect = PreviewRect & { statusBarId: string };
let menuEntryPreviewRects: PreviewEntryRect[] = [];
let menuFooterPreviewRects: PreviewMenuFooterRect[] = [];
let menuAddPreviewRect: PreviewMenuAddRect | null = null;
let toolBarAddPreviewRect: PreviewToolBarAddRect | null = null;
let statusBarAddPreviewRect: PreviewStatusBarAddRect | null = null;
let toolBarEntryPreviewRects: PreviewEntryRect[] = [];
let statusBarFieldPreviewRects: PreviewEntryRect[] = [];

let settings: DesignerSettings = {
  showGrid: true,
  gridMode: "dots",
  gridSize: 10,
  gridOpacity: 0.14,

  snapToGrid: false,
  snapMode: "drop",

  windowFillOpacity: 0.05,
  outsideDimOpacity: 0.12,
  titleBarHeight: 26,

  canvasBackground: "",
  canvasReadonlyBackground: ""
};

const previewChromeMetrics = resolvePreviewChromeMetrics(typeof navigator !== "undefined" ? navigator.userAgent : "");

type PbfdSymbols = {
  menuEntryKinds: readonly string[];
  toolBarEntryKinds: readonly string[];
  containerGadgetKinds: readonly string[];
  windowKnownFlags?: readonly string[];
  enumNames?: { windows: string; gadgets: string };
};

type PbfdWindow = Window & {
  __PBFD_SYMBOLS__?: PbfdSymbols;
};

const pbfdWindow = window as PbfdWindow;

if (!pbfdWindow.__PBFD_SYMBOLS__) {
  throw new Error("__PBFD_SYMBOLS__ is not defined");
}

const EVENT_UI_HINT = {
  eventGadgetMissing: "Requires an existing Select EventGadget() block. Enable 'Generate Event Loop' first.",
  eventMenuMissing: "Event editing requires an existing Select EventMenu() block.",
  menuIdRequired: "Only menu entries with ids can have event procedures.",
  toolBarIdRequired: "Only toolbar entries with ids can have event procedures.",
  generateEventLoopMenuBlock: "Cannot disable while a Select EventMenu() block exists.",
  generateEventLoopGadgetCases: "Cannot disable while Select EventGadget() contains Case branches."
} as const;

function getProcedureSuggestions(): string[] {
  return Array.isArray(model.procedureNames) ? model.procedureNames : [];
}

function getEventMenuEntryHint(hasEventMenuBlock: boolean, idRaw?: string, entryLabel: "menu" | "toolbar" = "menu"): string {
  if (!idRaw) {
    return entryLabel === "menu" ? EVENT_UI_HINT.menuIdRequired : EVENT_UI_HINT.toolBarIdRequired;
  }
  return hasEventMenuBlock ? "" : EVENT_UI_HINT.eventMenuMissing;
}

function getGenerateEventLoopDisableHint(win?: WindowModel): string {
  if (!win) return "";
  if (win.hasEventMenuBlock) return EVENT_UI_HINT.generateEventLoopMenuBlock;
  if (win.hasEventGadgetCaseBranches) return EVENT_UI_HINT.generateEventLoopGadgetCases;
  return "";
}

const PBFD_SYMBOLS: PbfdSymbols = pbfdWindow.__PBFD_SYMBOLS__;

function menuEntryKindHint(): string {
  return `Entry kind (${PBFD_SYMBOLS.menuEntryKinds.join("/")})`;
}

function toolBarEntryKindHint(): string {
  return `Entry kind (${PBFD_SYMBOLS.toolBarEntryKinds.join("/")})`;
}

function buildWindowCaptionRaw(value: string, isVariable: boolean): string {
  return isVariable ? value.trim() : toPbString(value);
}

function getWindowCurrentFlagsExpr(win: WindowModel): string | undefined {
  return buildWindowFlagsExpr(win.knownFlags ?? [], (win.customFlags ?? []).join(" | "));
}

function postWindowOpenArgs(win: WindowModel, updates: { xRaw?: string; yRaw?: string; wRaw?: string; hRaw?: string; captionRaw?: string; flagsExpr?: string; parentRaw?: string }) {
  post({
    type: WEBVIEW_TO_EXT_MSG_TYPE.setWindowOpenArgs,
    windowKey: win.id,
    ...(Object.prototype.hasOwnProperty.call(updates, "xRaw") ? { xRaw: updates.xRaw } : {}),
    ...(Object.prototype.hasOwnProperty.call(updates, "yRaw") ? { yRaw: updates.yRaw } : {}),
    ...(Object.prototype.hasOwnProperty.call(updates, "wRaw") ? { wRaw: updates.wRaw } : {}),
    ...(Object.prototype.hasOwnProperty.call(updates, "hRaw") ? { hRaw: updates.hRaw } : {}),
    captionRaw: Object.prototype.hasOwnProperty.call(updates, "captionRaw") ? updates.captionRaw : (win.captionRaw ?? buildWindowCaptionRaw(win.title ?? "", Boolean(win.captionVariable))),
    flagsExpr: Object.prototype.hasOwnProperty.call(updates, "flagsExpr") ? updates.flagsExpr : getWindowCurrentFlagsExpr(win),
    parentRaw: Object.prototype.hasOwnProperty.call(updates, "parentRaw") ? updates.parentRaw : (win.parentRaw ?? "")
  });
}

function postWindowProperties(win: WindowModel, updates: { hiddenRaw?: string; disabledRaw?: string; colorRaw?: string }) {
  post({
    type: WEBVIEW_TO_EXT_MSG_TYPE.setWindowProperties,
    windowKey: win.id,
    hiddenRaw: Object.prototype.hasOwnProperty.call(updates, "hiddenRaw") ? updates.hiddenRaw : (win.hiddenRaw ?? ""),
    disabledRaw: Object.prototype.hasOwnProperty.call(updates, "disabledRaw") ? updates.disabledRaw : (win.disabledRaw ?? ""),
    colorRaw: Object.prototype.hasOwnProperty.call(updates, "colorRaw") ? updates.colorRaw : (win.colorRaw ?? "")
  });
}

function setInfoError(message: string): void {
  errEl.textContent = message;
  renderInfoPanel();
}

function clearInfoError(): void {
  if (!(errEl.textContent ?? "").trim().length) return;
  errEl.textContent = "";
  renderInfoPanel();
}

function ensureValidPbVariableReference(value: string): boolean {
  if (isValidPbVariableReference(value)) {
    clearInfoError();
    return true;
  }

  setInfoError(PB_WRONG_VARIABLE_NAME_MESSAGE);
  return false;
}

function postWindowPositionRaw(win: WindowModel, axis: "x" | "y", rawValue: string): void {
  const parsed = parseWindowPositionInspectorInput(rawValue);
  if (!parsed.ok) {
    setInfoError(`Window ${axis.toUpperCase()} accepts only an integer or ${WINDOW_POSITION_IGNORE_LITERAL}.`);
    return;
  }

  clearInfoError();

  if (axis === "x") {
    win.xRaw = parsed.raw;
    win.x = parsed.previewValue;
    postWindowOpenArgs(win, { xRaw: parsed.raw });
  } else {
    win.yRaw = parsed.raw;
    win.y = parsed.previewValue;
    postWindowOpenArgs(win, { yRaw: parsed.raw });
  }

  render();
  renderProps();
}

type ImageUsage = {
  label: string;
  select: DesignerSelection;
};

function getSelectionParentId(sel: DesignerSelection): string | undefined {
  if (!sel) return undefined;
  switch (sel.kind) {
    case "menu": return sel.id;
    case "menuEntry": return sel.menuId;
    case "toolbar": return sel.id;
    case "toolBarEntry": return sel.toolBarId;
    case "statusbar": return sel.id;
    case "statusBarField": return sel.statusBarId;
    default: return undefined;
  }
}

function setSelectionAndRefresh(next: DesignerSelection): void {
  selection = next;
  render();
  renderListAndParentSelector();
  renderProps();
}

function openDestructiveAction(action: PendingDestructiveAction, nextSelection?: DesignerSelection): void {
  pendingDestructiveAction = action;
  if (nextSelection) {
    setSelectionAndRefresh(nextSelection);
    return;
  }
  renderProps();
}

function closeDestructiveAction(): void {
  pendingDestructiveAction = null;
  renderProps();
}

function confirmDestructiveAction(): void {
  const action = pendingDestructiveAction;
  if (!action) return;

  pendingDestructiveAction = null;

  switch (action.kind) {
    case "deleteMenuEntry":
      post({
        type: "deleteMenuEntry",
        menuId: action.menuId,
        sourceLine: action.sourceLine,
        kind: action.entryKind
      });
      return;
    case "deleteMenu":
      post({ type: "deleteMenu", menuId: action.menuId });
      return;
    case "deleteToolBarEntry":
      post({
        type: "deleteToolBarEntry",
        toolBarId: action.toolBarId,
        sourceLine: action.sourceLine,
        kind: action.entryKind
      });
      return;
    case "deleteToolBar":
      post({ type: "deleteToolBar", toolBarId: action.toolBarId });
      return;
    case "deleteStatusBarField":
      post({
        type: "deleteStatusBarField",
        statusBarId: action.statusBarId,
        sourceLine: action.sourceLine
      });
      return;
    case "clearStatusBarField": {
      const statusBar = (model.statusbars ?? []).find(entry => entry.id === action.statusBarId);
      const field = statusBar?.fields?.[action.fieldIndex];
      if (!statusBar || !field || typeof field.source?.line !== "number") {
        renderProps();
        return;
      }
      post({
        type: "updateStatusBarField",
        statusBarId: statusBar.id,
        sourceLine: field.source.line,
        widthRaw: field.widthRaw,
        textRaw: "",
        imageRaw: "",
        flagsRaw: field.flagsRaw ?? "",
        progressBar: false,
        progressRaw: ""
      });
      return;
    }
    case "deleteStatusBar":
      post({ type: "deleteStatusBar", statusBarId: action.statusBarId });
      return;
    case "deleteImage":
      post({ type: "deleteImage", sourceLine: action.sourceLine });
      return;
    case "deleteGadgetItem":
      post({ type: "deleteGadgetItem", id: action.gadgetId, sourceLine: action.sourceLine });
      return;
    case "deleteGadgetColumn":
      post({ type: "deleteGadgetColumn", id: action.gadgetId, sourceLine: action.sourceLine });
      return;
  }
}

function isMenuEntrySelection(sel: DesignerSelection, menuId: string, entryIndex: number): boolean {
  return Boolean(sel && sel.kind === "menuEntry" && sel.menuId === menuId && sel.entryIndex === entryIndex);
}

function isToolBarEntrySelection(sel: DesignerSelection, toolBarId: string, entryIndex: number): boolean {
  return Boolean(sel && sel.kind === "toolBarEntry" && sel.toolBarId === toolBarId && sel.entryIndex === entryIndex);
}

function isStatusBarFieldSelection(sel: DesignerSelection, statusBarId: string, fieldIndex: number): boolean {
  return Boolean(sel && sel.kind === "statusBarField" && sel.statusBarId === statusBarId && sel.fieldIndex === fieldIndex);
}

function collectImageUsages(imageId: string): ImageUsage[] {
  const usages: ImageUsage[] = [];

  for (const g of model.gadgets ?? []) {
    if (g.imageId === imageId) {
      usages.push({
        label: `Gadget ${g.id} (${g.kind})`,
        select: { kind: "gadget", id: g.id }
      });
    }

    (g.items ?? []).forEach((it, idx) => {
      if (it.imageId === imageId) {
        const itemName = it.text ?? it.textRaw ?? `item ${idx}`;
        usages.push({
          label: `Gadget ${g.id} (${g.kind}) :: Item ${idx} ${itemName}`,
          select: { kind: "gadget", id: g.id }
        });
      }
    });
  }

  for (const m of model.menus ?? []) {
    (m.entries ?? []).forEach((e, idx) => {
      if (e.iconId === imageId) {
        const entryName = e.idRaw ?? e.text ?? e.textRaw ?? `entry ${idx}`;
        usages.push({
          label: `Menu ${m.id} :: ${e.kind} ${entryName}`,
          select: { kind: "menuEntry", menuId: m.id, entryIndex: idx }
        });
      }
    });
  }

  for (const t of model.toolbars ?? []) {
    (t.entries ?? []).forEach((e, idx) => {
      if (e.iconId === imageId) {
        const entryName = e.idRaw ?? e.text ?? e.textRaw ?? `entry ${idx}`;
        usages.push({
          label: `ToolBar ${t.id} :: ${e.kind} ${entryName}`,
          select: { kind: "toolBarEntry", toolBarId: t.id, entryIndex: idx }
        });
      }
    });
  }

  for (const sb of model.statusbars ?? []) {
    (sb.fields ?? []).forEach((f, idx) => {
      if (f.imageId === imageId) {
        usages.push({
          label: `StatusBar ${sb.id} :: Field ${idx}`,
          select: { kind: "statusBarField", statusBarId: sb.id, fieldIndex: idx }
        });
      }
    });
  }

  return usages;
}

function countImageUsages(imageId: string): number {
  return collectImageUsages(imageId).length;
}

function findImageEntryById(imageId?: string): ImageEntry | undefined {
  if (!imageId) return undefined;
  return (model.images ?? []).find(entry => entry.id === imageId);
}

function selectImageById(imageId: string): void {
  setSelectionAndRefresh({ kind: "image", id: imageId });
}

const IMAGE_CAPABLE_GADGET_KINDS = new Set(["ImageGadget", "ButtonImageGadget"]);

function isPbStringLiteral(raw?: string): boolean {
  return /^"(?:[^"]|"")*"$/.test(raw?.trim() ?? "");
}

function canRelativizeImageEntry(entry?: ImageEntry): boolean {
  return Boolean(entry && !entry.inline && isPbStringLiteral(entry.imageRaw));
}

function canChooseFileImageEntry(entry?: ImageEntry): boolean {
  return Boolean(entry && !entry.inline);
}

function canToggleImagePbAny(entry?: ImageEntry): boolean {
  if (!entry) return false;
  if (entry.pbAny) {
    return Boolean((entry.variable ?? entry.id ?? "").trim().length);
  }
  return Boolean(entry.firstParam.trim().length);
}

function normalizeImageReference(raw?: string): { imageRaw?: string; imageId?: string } {
  const imageRaw = raw?.trim();
  if (!imageRaw) return {};
  const m = /^ImageID\((.+)\)$/i.exec(imageRaw);
  const imageId = (m?.[1]?.trim() || imageRaw).trim();
  return {
    imageRaw,
    imageId: imageId.length ? imageId : undefined
  };
}

function getImageReferenceHint(imageId?: string, label: "gadget" | "menu" | "toolbar" | "statusbar" = "gadget"): string {
  if (!imageId) {
    switch (label) {
      case "menu":
      case "toolbar":
        return "This entry has no parsed image reference.";
      case "statusbar":
        return "This field has no parsed image reference.";
      default:
        return "This gadget has no parsed image reference.";
    }
  }

  if (!findImageEntryById(imageId)) {
    return `Referenced image '${imageId}' is not loaded in this form.`;
  }

  return "";
}

function getDefaultImageReferenceSelection(currentImageId?: string): string {
  const images = model.images ?? [];
  if (!images.length) return "";
  return currentImageId && findImageEntryById(currentImageId)
    ? currentImageId
    : (images[0]?.id ?? "");
}

function buildCreatedImageReference(idRaw: string, assignedVar?: string): { imageId: string; imageRaw: string } | undefined {
  const trimmedId = idRaw.trim();
  if (!trimmedId.length) return undefined;

  if (trimmedId.toLowerCase() === "#pb_any") {
    const variableName = assignedVar?.trim();
    if (!variableName) return undefined;
    return {
      imageId: variableName,
      imageRaw: `ImageID(${variableName})`
    };
  }

  return {
    imageId: trimmedId,
    imageRaw: `ImageID(${trimmedId})`
  };
}

function toPbString(v: string): string {
  const esc = (v ?? "").replace(/"/g, '""');
  return `"${esc}"`;
}

function getMenuInsertLevel(menu: MenuModel, parentSourceLine?: number): number {
  if (typeof parentSourceLine !== "number") return 0;
  const parentEntry = (menu.entries ?? []).find(entry => entry.source?.line === parentSourceLine);
  if (!parentEntry) return 0;
  return Math.max(0, getMenuEntryLevel(parentEntry) + 1);
}

function postInsertMenuEntry(menu: MenuModel, args: { kind: string; idRaw?: string; textRaw?: string }, parentSourceLine?: number): void {
  const preferredIndex = Math.max(0, menu.entries?.length ?? 0);
  pendingMenuEntrySelection = {
    menuId: menu.id,
    preferredIndex,
    kind: args.kind,
    level: getMenuInsertLevel(menu, parentSourceLine),
    idRaw: args.idRaw,
    textRaw: args.textRaw,
  };
  vscode.postMessage({
    type: "insertMenuEntry",
    menuId: menu.id,
    kind: args.kind,
    idRaw: args.idRaw,
    textRaw: args.textRaw,
    parentSourceLine
  });
}

function postInsertToolBarEntry(toolBar: ToolbarModel, args: { kind: string; idRaw?: string; iconRaw?: string; textRaw?: string; toggle?: boolean }): void {
  const preferredIndex = Math.max(0, toolBar.entries?.length ?? 0);
  pendingToolBarEntrySelection = {
    toolBarId: toolBar.id,
    preferredIndex,
    kind: args.kind,
    idRaw: args.idRaw,
    iconRaw: args.iconRaw,
    textRaw: args.textRaw,
    toggle: args.toggle,
  };
  vscode.postMessage({
    type: "insertToolBarEntry",
    toolBarId: toolBar.id,
    kind: args.kind,
    idRaw: args.idRaw,
    iconRaw: args.iconRaw,
    textRaw: args.textRaw,
  });
}

function postInsertStatusBarField(statusBar: StatusbarModel, args: { widthRaw: string; textRaw?: string; imageRaw?: string; flagsRaw?: string; progressBar?: boolean; progressRaw?: string }): void {
  const preferredIndex = Math.max(0, statusBar.fields?.length ?? 0);
  pendingStatusBarFieldSelection = {
    statusBarId: statusBar.id,
    preferredIndex,
    widthRaw: args.widthRaw,
    textRaw: args.textRaw,
    imageRaw: args.imageRaw,
    flagsRaw: args.flagsRaw,
    progressBar: args.progressBar,
    progressRaw: args.progressRaw,
  };
  vscode.postMessage({
    type: "insertStatusBarField",
    statusBarId: statusBar.id,
    widthRaw: args.widthRaw,
    textRaw: args.textRaw,
    imageRaw: args.imageRaw,
    flagsRaw: args.flagsRaw,
    progressBar: args.progressBar,
    progressRaw: args.progressRaw,
  });
}

type Handle = ResizeHandle;

const HANDLE_SIZE = 6;
const HANDLE_HIT = 10;

const MIN_GADGET_W = 8;
const MIN_GADGET_H = 8;

// Keep this permissive; PB allows small windows, but avoid 0/negative sizes.
const MIN_WIN_W = 40;
const MIN_WIN_H = 40;

const CONTAINER_KINDS = new Set(PBFD_SYMBOLS.containerGadgetKinds);

type RectLike = { x: number; y: number; w: number; h: number };

function renderListAndParentSelector() {
  renderList();
  renderParentSelector();
}

function renderSelectionUiWithParentSelector() {
  render();
  renderList();
  renderParentSelector();
  renderProps();
}

function renderSelectionUiWithoutParentSelector() {
  render();
  renderList();
  renderProps();
}

function renderAfterInit() {
  render();
  renderParentSelector();
  renderList();
  renderProps();
}

function menuEntryMatchesPendingSelection(entry: MenuEntry | undefined, pending: PendingMenuEntrySelection): boolean {
  if (!entry) return false;
  return entry.kind === pending.kind
    && getMenuEntryLevel(entry) === pending.level
    && (entry.idRaw ?? "") === (pending.idRaw ?? "")
    && (entry.textRaw ?? "") === (pending.textRaw ?? "")
    && (entry.shortcut ?? "") === (pending.shortcut ?? "")
    && (entry.iconRaw ?? "") === (pending.iconRaw ?? "");
}

function resolvePendingMenuEntrySelection() {
  const pending = pendingMenuEntrySelection;
  if (!pending) return;

  const menu = (model.menus ?? []).find(entry => entry.id === pending.menuId);
  pendingMenuEntrySelection = null;
  if (!menu) return;

  const preferredEntry = menu.entries?.[pending.preferredIndex];
  if (menuEntryMatchesPendingSelection(preferredEntry, pending)) {
    selection = { kind: "menuEntry", menuId: pending.menuId, entryIndex: pending.preferredIndex };
    return;
  }

  const matchIndex = (menu.entries ?? []).findIndex(entry => menuEntryMatchesPendingSelection(entry, pending));
  if (matchIndex >= 0) {
    selection = { kind: "menuEntry", menuId: pending.menuId, entryIndex: matchIndex };
  }
}

function toolBarEntryMatchesPendingSelection(entry: MenuEntry | undefined, pending: PendingToolBarEntrySelection): boolean {
  if (!entry) return false;
  return entry.kind === pending.kind
    && (entry.idRaw ?? "") === (pending.idRaw ?? "")
    && (entry.iconRaw ?? "") === (pending.iconRaw ?? "")
    && (entry.textRaw ?? "") === (pending.textRaw ?? "")
    && Boolean(entry.toggle) === Boolean(pending.toggle);
}

function resolvePendingToolBarEntrySelection() {
  const pending = pendingToolBarEntrySelection;
  if (!pending) return;

  const toolBar = (model.toolbars ?? []).find(entry => entry.id === pending.toolBarId);
  pendingToolBarEntrySelection = null;
  if (!toolBar) return;

  const preferredEntry = toolBar.entries?.[pending.preferredIndex];
  if (toolBarEntryMatchesPendingSelection(preferredEntry, pending)) {
    selection = { kind: "toolBarEntry", toolBarId: pending.toolBarId, entryIndex: pending.preferredIndex };
    return;
  }

  const matchIndex = (toolBar.entries ?? []).findIndex(entry => toolBarEntryMatchesPendingSelection(entry, pending));
  if (matchIndex >= 0) {
    selection = { kind: "toolBarEntry", toolBarId: pending.toolBarId, entryIndex: matchIndex };
  }
}

function statusBarFieldMatchesPendingSelection(field: StatusbarField | undefined, pending: PendingStatusBarFieldSelection): boolean {
  if (!field) return false;
  return (field.widthRaw ?? "") === (pending.widthRaw ?? "")
    && (field.textRaw ?? "") === (pending.textRaw ?? "")
    && (field.imageRaw ?? "") === (pending.imageRaw ?? "")
    && (field.flagsRaw ?? "") === (pending.flagsRaw ?? "")
    && Boolean(field.progressBar) === Boolean(pending.progressBar)
    && (field.progressRaw ?? "") === (pending.progressRaw ?? "");
}

function resolvePendingStatusBarFieldSelection() {
  const pending = pendingStatusBarFieldSelection;
  if (!pending) return;

  const statusBar = (model.statusbars ?? []).find(entry => entry.id === pending.statusBarId);
  pendingStatusBarFieldSelection = null;
  if (!statusBar) return;

  const preferredField = statusBar.fields?.[pending.preferredIndex];
  if (statusBarFieldMatchesPendingSelection(preferredField, pending)) {
    selection = { kind: "statusBarField", statusBarId: pending.statusBarId, fieldIndex: pending.preferredIndex };
    return;
  }

  const matchIndex = (statusBar.fields ?? []).findIndex(field => statusBarFieldMatchesPendingSelection(field, pending));
  if (matchIndex >= 0) {
    selection = { kind: "statusBarField", statusBarId: pending.statusBarId, fieldIndex: matchIndex };
  }
}

function sanitizeSelectionAfterModelUpdate() {
  const retainedPanelItems = retainPanelActiveItems(panelActiveItems, model.gadgets);
  panelActiveItems.clear();
  retainedPanelItems.forEach((item, panelId) => panelActiveItems.set(panelId, item));

  const sel = selection;
  if (sel && sel.kind === "gadget") {
    const selId = sel.id;
    if (!model.gadgets.some(g => g.id === selId)) {
      selection = null;
    }
    return;
  }

  if (sel && sel.kind === "window") {
    if (!model.window) selection = null;
    return;
  }

  if (sel && sel.kind === "menu") {
    const menus = model.menus ?? [];
    if (!menus.some(m => m.id === sel.id)) selection = null;
    return;
  }

  if (sel && sel.kind === "menuEntry") {
    const menu = (model.menus ?? []).find(m => m.id === sel.menuId);
    if (!menu || sel.entryIndex < 0 || sel.entryIndex >= (menu.entries?.length ?? 0)) selection = null;
    return;
  }

  if (sel && sel.kind === "toolbar") {
    const toolbars = model.toolbars ?? [];
    if (!toolbars.some(t => t.id === sel.id)) selection = null;
    return;
  }

  if (sel && sel.kind === "toolBarEntry") {
    const toolBar = (model.toolbars ?? []).find(t => t.id === sel.toolBarId);
    if (!toolBar || sel.entryIndex < 0 || sel.entryIndex >= (toolBar.entries?.length ?? 0)) selection = null;
    return;
  }

  if (sel && sel.kind === "statusbar") {
    const statusbars = model.statusbars ?? [];
    if (!statusbars.some(sb => sb.id === sel.id)) selection = null;
    return;
  }

  if (sel && sel.kind === "statusBarField") {
    const statusBar = (model.statusbars ?? []).find(sb => sb.id === sel.statusBarId);
    if (!statusBar || sel.fieldIndex < 0 || sel.fieldIndex >= (statusBar.fields?.length ?? 0)) selection = null;
    return;
  }

  if (sel && sel.kind === "images") {
    if (!model.window) selection = null;
    return;
  }
}

function normalizeRectInPlace(r: RectLike, minW: number, minH: number) {
  const c = clampRect(r, minW, minH);
  r.x = c.x;
  r.y = c.y;
  r.w = c.w;
  r.h = c.h;
}

function shouldSnapLive(): boolean {
  return settings.snapToGrid && settings.snapMode === "live";
}

function shouldSnapDrop(): boolean {
  return settings.snapToGrid && settings.snapMode === "drop";
}

function applyLiveSnapPoint(x: number, y: number): { x: number; y: number } {
  if (!shouldSnapLive()) return { x, y };
  const gs = settings.gridSize;
  return { x: snapValue(x, gs), y: snapValue(y, gs) };
}

function applyLiveSnapRect(
  x: number,
  y: number,
  w: number,
  h: number,
  minW: number,
  minH: number
): { x: number; y: number; w: number; h: number } {
  if (!shouldSnapLive()) return { x, y, w, h };
  const gs = settings.gridSize;
  const nx = snapValue(x, gs);
  const ny = snapValue(y, gs);
  const nw = snapValue(w, gs);
  const nh = snapValue(h, gs);
  return clampRect({ x: nx, y: ny, w: nw, h: nh }, minW, minH);
}

function applyDropSnapRectInPlace(r: RectLike, minW: number, minH: number) {
  if (!shouldSnapDrop()) return;

  const gs = settings.gridSize;
  r.x = snapValue(r.x, gs);
  r.y = snapValue(r.y, gs);
  r.w = snapValue(r.w, gs);
  r.h = snapValue(r.h, gs);

  const c = clampRect(r, minW, minH);
  r.x = c.x;
  r.y = c.y;
  r.w = c.w;
  r.h = c.h;
}

type DragState =
  | { target: "gadget"; mode: "move"; id: string; startMx: number; startMy: number; startX: number; startY: number; startW: number; startH: number }
  | {
      target: "menuEntry";
      menuId: string;
      entryIndex: number;
      sourceLine: number;
      kind: string;
      startMx: number;
      startMy: number;
      moved: boolean;
      moveTarget: MenuEntryMoveTargetLike | null;
    }
  | {
      target: "scrollArea";
      axis: "x" | "y";
      id: string;
      startMx: number;
      startMy: number;
      startOffset: number;
      maxOffset: number;
      trackLength: number;
    }
  | {
      target: "gadget";
      mode: "resize";
      id: string;
      handle: Handle;
      startMx: number;
      startMy: number;
      startX: number;
      startY: number;
      startW: number;
      startH: number;
    }
  | { target: "window"; mode: "move"; startMx: number; startMy: number; startX: number; startY: number; startW: number; startH: number }
  | {
      target: "window";
      mode: "resize";
      handle: Handle;
      startMx: number;
      startMy: number;
      startX: number;
      startY: number;
      startW: number;
      startH: number;
    };

let drag: DragState | null = null;

function applySettings(s: DesignerSettings) {
  settings = s;

  const bg = (settings.canvasBackground ?? "").trim();
  const bgReadonly = (settings.canvasReadonlyBackground ?? "").trim();
  document.documentElement.style.setProperty(
    "--pbfd-canvas-bg",
    bg.length ? bg : "var(--vscode-editor-background)"
  );

  document.documentElement.style.setProperty(
    "--pbfd-readonly-bg",
    bgReadonly.length ? bgReadonly : "var(--vscode-readonly-input-background)"
  );

  render();
  renderProps();
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("message", (ev: MessageEvent<ExtensionToWebviewMessage>) => {
  const msg = ev.data;

  if (msg.type === "init") {
    errEl.textContent = "";
    model = msg.model;
    const retainedPanelItems = retainPanelActiveItems(panelActiveItems, model.gadgets);
    panelActiveItems.clear();
    retainedPanelItems.forEach((item, panelId) => panelActiveItems.set(panelId, item));
    scrollAreaOffsets.clear();

    if (msg.settings) {
      applySettings(msg.settings);
    }
    resolvePendingMenuEntrySelection();
    resolvePendingToolBarEntrySelection();
    // Validate selection after model refresh
    sanitizeSelectionAfterModelUpdate();

    renderAfterInit();
    return;
  }

  if (msg.type === "settings") {
    applySettings(msg.settings);
    return;
  }

  if (msg.type === "error") {
    errEl.textContent = msg.message;
    renderInfoPanel();
  }
});

function renderDiagnostics() {
  const issues = model.meta?.issues ?? [];
  const header = model.meta?.header;

  if ((!issues || issues.length === 0) && !header?.version) {
    diagEl.style.display = "none";
    diagEl.innerHTML = "";
    return;
  }

  const rows: string[] = [];
  if (header?.version) {
    rows.push(
      `<div class="row"><div class="sev info">ℹ</div><div class="msg">PureBasic header version: <b>${escapeHtml(
        header.version
      )}</b></div></div>`
    );
  }

  for (const it of issues) {
    const sev = it.severity;
    const icon = sev === "error" ? "⛔" : sev === "warning" ? "⚠" : "ℹ";
    const line = typeof it.line === "number" ? ` (line ${it.line + 1})` : "";
    rows.push(
      `<div class="row"><div class="sev ${sev === "warning" ? "warn" : sev === "error" ? "err" : "info"}">${icon}</div><div class="msg">${escapeHtml(
        it.message
      )}${escapeHtml(line)}</div></div>`
    );
  }

  diagEl.innerHTML = rows.join("\n");
  diagEl.style.display = "block";
}

function getSelectionSummary(): string {
  const sel = selection;
  if (!sel) return "No selection";

  if (sel.kind === "window") {
    return `Window ${model.window?.id ?? ""}`.trim();
  }

  if (sel.kind === "gadget") {
    const gadget = model.gadgets.find(it => it.id === sel.id);
    return gadget ? `${gadget.kind} ${gadget.id}` : "No selection";
  }

  if (sel.kind === "menu") {
    return `Menu ${sel.id}`;
  }

  if (sel.kind === "menuEntry") {
    const menu = (model.menus ?? []).find(it => it.id === sel.menuId);
    const entry = menu?.entries?.[sel.entryIndex];
    if (!entry) return "No selection";
    const label = entry.idRaw || entry.textRaw || entry.kind;
    return `${entry.kind} ${label}`.trim();
  }

  if (sel.kind === "toolbar") {
    return `ToolBar ${sel.id}`;
  }

  if (sel.kind === "toolBarEntry") {
    const toolBar = (model.toolbars ?? []).find(it => it.id === sel.toolBarId);
    const entry = toolBar?.entries?.[sel.entryIndex];
    if (!entry) return "No selection";
    const label = entry.idRaw || entry.textRaw || entry.kind;
    return `${entry.kind} ${label}`.trim();
  }

  if (sel.kind === "statusbar") {
    return `StatusBar ${sel.id}`;
  }

  if (sel.kind === "statusBarField") {
    const statusBar = (model.statusbars ?? []).find(it => it.id === sel.statusBarId);
    const field = statusBar?.fields?.[sel.fieldIndex];
    if (!field) return "No selection";
    const label = field.textRaw || field.widthRaw || `Field ${sel.fieldIndex + 1}`;
    return `StatusBarField ${label}`.trim();
  }

  if (sel.kind === "images") {
    return "Images";
  }

  if (sel.kind === "image") {
    return `Image ${sel.id}`;
  }

  return "No selection";
}

function getContextualInfoHint(): string {
  const sel = selection;
  if (!sel) {
    return "Select a window, gadget or top-level entry to inspect and edit its properties.";
  }

  switch (sel.kind) {
    case "window":
      return "Window properties, layout values, SelectProc suggestions and PureBasic window flags can be edited here.";
    case "gadget":
      return "Drag or resize gadgets in the canvas. AddGadgetItem/AddGadgetColumn patching remains available for supported gadget kinds.";
    case "menu":
    case "menuEntry":
      return "Menu entries can be inserted, edited or deleted from the current selection.";
    case "toolbar":
    case "toolBarEntry":
      return "Toolbar entries can be inserted, edited or deleted from the current selection.";
    case "statusbar":
    case "statusBarField":
      return "StatusBar fields can be inserted, edited or deleted from the current selection.";
    case "images":
    case "image":
      return "Image references can be added, updated or reassigned from the current selection.";
    default:
      return "Review the current selection and update its available properties.";
  }
}

function renderInfoPanel() {
  renderDiagnostics();
  infoHintEl.textContent = getContextualInfoHint();
  infoSelectionEl.textContent = getSelectionSummary();
  const message = (errEl.textContent ?? "").trim();
  errEl.style.display = message ? "block" : "none";
}

function escapeHtml(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getWinRect(): { x: number; y: number; w: number; h: number; title: string; id: string; tbH: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (!model.window) return null;

  const x = asInt(model.window.x ?? 0);
  const y = asInt(model.window.y ?? 0);
  const w = clampPos(model.window.w ?? rect.width);
  const h = clampPos(model.window.h ?? rect.height);

  return {
    x,
    y,
    w,
    h,
    title: model.window.title ?? "",
    id: model.window.id,
    tbH: Math.max(0, asInt(settings.titleBarHeight))
  };
}


function getPrimaryMenu(): MenuModel | undefined {
  return model.menus?.[0];
}

function getPrimaryToolbar(): ToolbarModel | undefined {
  return model.toolbars?.[0];
}

function getPrimaryStatusbar(): StatusbarModel | undefined {
  return model.statusbars?.[0];
}

function hasParsedMenuChrome(): boolean {
  return !!getPrimaryMenu();
}

function hasParsedToolbarChrome(): boolean {
  return !!getPrimaryToolbar();
}

function hasParsedStatusbarChrome(): boolean {
  return !!getPrimaryStatusbar();
}

function getWindowLocalRect(): PreviewRect {
  return {
    x: 0,
    y: 0,
    w: Math.max(0, model.window?.w ?? 0),
    h: Math.max(0, model.window?.h ?? 0)
  };
}

function getWindowContentPreviewRect(metrics: PreviewChromeMetrics): PreviewRect {
  return getWindowLocalChromeLayout(metrics).contentRect;
}

function getWindowLocalChromeLayout(metrics: PreviewChromeMetrics): WindowChromeLayout {
  return getWindowChromeLayout(
    getWindowLocalRect(),
    Math.max(0, asInt(settings.titleBarHeight)),
    hasParsedMenuChrome(),
    hasParsedToolbarChrome(),
    hasParsedStatusbarChrome(),
    metrics
  );
}

function getWindowGlobalChromeLayout(metrics: PreviewChromeMetrics): WindowChromeLayout | null {
  const wr = getWinRect();
  if (!wr) return null;
  return getWindowChromeLayout(
    { x: wr.x, y: wr.y, w: wr.w, h: wr.h },
    wr.tbH,
    hasParsedMenuChrome(),
    hasParsedToolbarChrome(),
    hasParsedStatusbarChrome(),
    metrics
  );
}

function hitWindow(mx: number, my: number): boolean {
  const wr = getWinRect();
  if (!wr) return false;
  return isPointInWindowRect({ x: wr.x, y: wr.y, w: wr.w, h: wr.h }, mx, my);
}

function toLocal(mx: number, my: number): { lx: number; ly: number } {
  const wr = getWinRect();
  if (!wr) return { lx: mx, ly: my };
  const local = toWindowLocalPoint({ x: wr.x, y: wr.y, w: wr.w, h: wr.h }, mx, my);
  return { lx: local.x, ly: local.y };
}

function toGlobal(lx: number, ly: number): { gx: number; gy: number } {
  const wr = getWinRect();
  if (!wr) return { gx: lx, gy: ly };
  const global = toWindowGlobalPoint({ x: wr.x, y: wr.y, w: wr.w, h: wr.h }, lx, ly);
  return { gx: global.x, gy: global.y };
}

function hitTestGadget(mx: number, my: number): Gadget | null {
  if (!hitWindow(mx, my)) return null;

  const { lx, ly } = toLocal(mx, my);
  const metrics = previewChromeMetrics;
  const cache = new Map<string, GadgetPreviewLayout>();

  for (let i = model.gadgets.length - 1; i >= 0; i--) {
    const g = model.gadgets[i];
    const layout = getGadgetPreviewLayout(g, metrics, cache);
    if (!layout.visible) continue;
    if (!rectContainsPoint(layout.rect, lx, ly)) continue;
    if (!rectContainsPoint(layout.clip, lx, ly)) continue;
    if (g.kind === "SplitterGadget") {
      const splitterBarRect = intersectRect(getSplitterBarRect(layout.rect, hasPbFlag(g.flagsExpr, "#PB_Splitter_Vertical"), metrics.splitterWidth, g.state), layout.clip);
      if (!isPointOnRectBorder(layout.rect, lx, ly) && !rectContainsPoint(splitterBarRect, lx, ly)) {
        continue;
      }
    }
    return g;
  }
  return null;
}


function hitHandleGadget(g: Gadget, mx: number, my: number): Handle | null {
  const metrics = previewChromeMetrics;
  const layout = getGadgetPreviewLayout(g, metrics);
  if (!layout.visible) return null;
  const { gx, gy } = toGlobal(layout.rect.x, layout.rect.y);
  const pts = getRectHandlePoints({ x: gx, y: gy, w: layout.rect.w, h: layout.rect.h });
  return hitHandlePoints(pts, mx, my, HANDLE_HIT);
}

function hitHandleWindow(mx: number, my: number): Handle | null {
  const wr = getWinRect();
  if (!wr) return null;

  // Handles are around the outer window rect
  const pts = getRectHandlePoints({ x: wr.x, y: wr.y, w: wr.w, h: wr.h });
  return hitHandlePoints(pts, mx, my, HANDLE_HIT);
}

function isInTitleBar(mx: number, my: number): boolean {
  const wr = getWinRect();
  if (!wr) return false;
  return isPointInWindowTitleBarRect({ x: wr.x, y: wr.y, w: wr.w, h: wr.h }, wr.tbH, mx, my);
}

function getHandleCursor(h: Handle): string {
  switch (h) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "n":
    case "s":
      return "ns-resize";
    case "w":
    case "e":
      return "ew-resize";
  }
}

function snapValue(v: number, gridSize: number): number {
  if (gridSize <= 1) return Math.trunc(v);
  return Math.round(v / gridSize) * gridSize;
}

function postGadgetRect(g: Gadget) {
  normalizeRectInPlace(g, MIN_GADGET_W, MIN_GADGET_H);
  vscode.postMessage({ type: "setGadgetRect", id: g.id, x: g.x, y: g.y, w: g.w, h: g.h });
}

function postWindowRect() {
  if (!model.window) return;

  normalizeRectInPlace(model.window, MIN_WIN_W, MIN_WIN_H);
  vscode.postMessage({
    type: "setWindowRect",
    id: model.window.id,
    x: model.window.x,
    y: model.window.y,
    w: model.window.w,
    h: model.window.h
  });
}

function postGadgetOpenArgs(id: string, args: { textRaw?: string; minRaw?: string; maxRaw?: string }): void {
  post({ type: "setGadgetOpenArgs", id, ...args });
}

function postCustomGadgetCode(id: string, args: { customInitRaw?: string; customCreateRaw?: string }): void {
  post({ type: "setCustomGadgetCode", id, ...args });
}

function postGadgetProperties(
  id: string,
  args: {
    hiddenRaw?: string;
    disabledRaw?: string;
    tooltipRaw?: string;
    frontColorRaw?: string;
    backColorRaw?: string;
    gadgetFontRaw?: string;
  }
): void {
  post({ type: "setGadgetProperties", id, ...args });
}
function postGadgetResizeRaw(
  id: string,
  args: {
    xRaw?: string;
    yRaw?: string;
    wRaw?: string;
    hRaw?: string;
    deleteResize?: boolean;
  }
): void {
  post({ type: "setGadgetResizeRaw", id, ...args });
}


function applyLocalGadgetTextUpdate(g: Gadget, value: string, isVariable: boolean): void {
  if (isVariable && !ensureValidPbVariableReference(value.trim())) {
    renderProps();
    return;
  }

  const textRaw = buildGadgetTextRaw(value, isVariable);
  g.textRaw = textRaw;
  g.textVariable = isVariable;
  g.text = isVariable ? value.trim() : value;
  postGadgetOpenArgs(g.id, { textRaw });
  render();
  renderProps();
}

function applyLocalGadgetTooltipUpdate(g: Gadget, value: string, isVariable: boolean): void {
  if (isVariable && !ensureValidPbVariableReference(value.trim())) {
    renderProps();
    return;
  }

  const tooltipRaw = buildGadgetTooltipRaw(value, isVariable);
  g.tooltipRaw = tooltipRaw;
  g.tooltipVariable = isVariable && Boolean(tooltipRaw);
  g.tooltip = tooltipRaw ? (isVariable ? value.trim() : value) : undefined;
  postGadgetProperties(g.id, { tooltipRaw });
  renderProps();
}

function resolvePbFormSkinPlatform(): "windows" | "linux" | "macos" | undefined {
  const nav = globalThis.navigator;
  const ua = `${nav?.userAgent ?? ""} ${nav?.platform ?? ""}`.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return undefined;
}

function getWindowResizeLockContext() {
  if (!model.window) return undefined;
  return {
    w: model.window.w,
    h: model.window.h,
    menuCount: model.menus?.length ?? 0,
    toolbarCount: model.toolbars?.length ?? 0,
    statusBarCount: model.statusbars?.length ?? 0,
    platformSkin: resolvePbFormSkinPlatform()
  };
}

function applyLocalGadgetHorizontalLockUpdate(g: Gadget, nextLockLeft: boolean, nextLockRight: boolean): void {
  const resizeCtx = getWindowResizeLockContext();
  if (!resizeCtx) return;
  const update = buildGadgetHorizontalLockResizeUpdate(g, resizeCtx, nextLockLeft, nextLockRight);
  if (!update) return;

  g.lockLeft = nextLockLeft;
  g.lockRight = nextLockRight;

  if (update.deleteResize) {
    g.resizeXRaw = undefined;
    g.resizeYRaw = undefined;
    g.resizeWRaw = undefined;
    g.resizeHRaw = undefined;
    g.resizeSource = undefined;
    postGadgetResizeRaw(g.id, { deleteResize: true });
  } else {
    g.resizeXRaw = update.xRaw;
    g.resizeYRaw = update.yRaw;
    g.resizeWRaw = update.wRaw;
    g.resizeHRaw = update.hRaw;
    postGadgetResizeRaw(g.id, update);
  }

  render();
  renderProps();
}

function applyLocalGadgetVerticalLockUpdate(g: Gadget, nextLockTop: boolean, nextLockBottom: boolean): void {
  const update = buildGadgetVerticalLockResizeUpdate(g, getWindowResizeLockContext(), nextLockTop, nextLockBottom);
  if (!update) return;

  g.lockTop = nextLockTop;
  g.lockBottom = nextLockBottom;

  if (update.deleteResize) {
    g.resizeXRaw = undefined;
    g.resizeYRaw = undefined;
    g.resizeWRaw = undefined;
    g.resizeHRaw = undefined;
    g.resizeSource = undefined;
    postGadgetResizeRaw(g.id, { deleteResize: true });
  } else {
    g.resizeXRaw = update.xRaw;
    g.resizeYRaw = update.yRaw;
    g.resizeWRaw = update.wRaw;
    g.resizeHRaw = update.hRaw;
    postGadgetResizeRaw(g.id, update);
  }

  render();
  renderProps();
}

function parseOptionalIntegerLiteral(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!/^[-+]?\d+$/.test(trimmed)) return undefined;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function applyLocalGadgetCtorRangeUpdate(g: Gadget, field: "min" | "max", value: string): void {
  const trimmed = value.trim();
  const labels = getGadgetCtorRangeFieldLabels(g.kind);
  const fieldLabel = field === "min" ? labels?.minLabel ?? "Value" : labels?.maxLabel ?? "Value";
  if (!trimmed.length) {
    alert(`${fieldLabel} may not be empty.`);
    renderProps();
    return;
  }
  const parsed = parseOptionalIntegerLiteral(trimmed);
  if (field === "min") {
    g.minRaw = trimmed;
    g.min = parsed;
    postGadgetOpenArgs(g.id, { minRaw: trimmed });
  } else {
    g.maxRaw = trimmed;
    g.max = parsed;
    postGadgetOpenArgs(g.id, { maxRaw: trimmed });
  }
  render();
  renderProps();
}

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const panelTabHit = hitTestPanelTab(mx, my, previewChromeMetrics);
  if (panelTabHit) {
    panelActiveItems.set(panelTabHit.panel.id, panelTabHit.index);
    selection = { kind: "gadget", id: panelTabHit.panel.id };
    drag = null;
    canvas.style.cursor = "default";
    renderSelectionUiWithoutParentSelector();
    return;
  }

  const menuAddHit = resolvePreviewRectHit(menuAddPreviewRect, mx, my);
  if (menuAddHit) {
    const menu = (model.menus ?? []).find(entry => entry.id === menuAddHit.menuId);
    if (menu) {
      postInsertMenuEntry(menu, { kind: "MenuTitle", textRaw: toPbString("MenuTitle") });
      selection = { kind: "menu", id: menu.id };
      drag = null;
      canvas.style.cursor = "default";
      renderSelectionUiWithoutParentSelector();
      return;
    }
  }

  const toolBarAddHit = resolvePreviewRectHit(toolBarAddPreviewRect, mx, my);
  if (toolBarAddHit) {
    const toolBar = (model.toolbars ?? []).find(entry => entry.id === toolBarAddHit.toolBarId);
    if (toolBar) {
      postInsertToolBarEntry(toolBar, getToolBarPreviewInsertArgs(toolBar, "button"));
      selection = { kind: "toolbar", id: toolBar.id };
      drag = null;
      canvas.style.cursor = "default";
      renderSelectionUiWithoutParentSelector();
      return;
    }
  }

  const statusBarAddHit = resolvePreviewRectHit(statusBarAddPreviewRect, mx, my);
  if (statusBarAddHit) {
    const statusBar = (model.statusbars ?? []).find(entry => entry.id === statusBarAddHit.statusBarId);
    if (statusBar) {
      postInsertStatusBarField(statusBar, getStatusBarPreviewInsertArgs("image"));
      selection = { kind: "statusbar", id: statusBar.id };
      drag = null;
      canvas.style.cursor = "default";
      renderSelectionUiWithoutParentSelector();
      return;
    }
  }

  const footerChromeLayout = getWindowGlobalChromeLayout(previewChromeMetrics);
  const footerHit = resolveMenuFooterHit({
    x: mx,
    y: my,
    windowHit: hitWindow(mx, my),
    menuRect: footerChromeLayout?.menuBarRect ?? null,
    footerRects: menuFooterPreviewRects
  });
  if (footerHit) {
    const menu = (model.menus ?? []).find(entry => entry.id === footerHit.menuId);
    const parentEntry = menu?.entries?.[footerHit.parentIndex];
    const parentSourceLine = parentEntry?.source?.line;
    if (menu && typeof parentSourceLine === "number") {
      const nextArgs = getDefaultMenuItemInsertArgs(menu);
      postInsertMenuEntry(menu, {
        kind: "MenuItem",
        idRaw: nextArgs.idRaw,
        textRaw: nextArgs.textRaw,
      }, parentSourceLine);
      selection = { kind: "menuEntry", menuId: menu.id, entryIndex: footerHit.parentIndex };
      drag = null;
      canvas.style.cursor = "default";
      renderSelectionUiWithoutParentSelector();
      return;
    }
  }

  const chromeLayout = getWindowGlobalChromeLayout(previewChromeMetrics);
  const topLevelChromeHit = resolveTopLevelChromeHit({
    x: mx,
    y: my,
    windowHit: hitWindow(mx, my),
    menuId: getPrimaryMenu()?.id,
    menuRect: chromeLayout?.menuBarRect ?? null,
    menuEntryRects: menuEntryPreviewRects,
    toolBarId: getPrimaryToolbar()?.id,
    toolBarRect: chromeLayout?.toolBarRect ?? null,
    toolBarEntryRects: toolBarEntryPreviewRects,
    statusBarId: getPrimaryStatusbar()?.id,
    statusBarRect: chromeLayout?.statusBarRect ?? null,
    statusBarFieldRects: statusBarFieldPreviewRects
  });
  if (topLevelChromeHit) {
    selection = topLevelChromeHit.selection;
    if (topLevelChromeHit.selection.kind === "menuEntry") {
      const menuSel = topLevelChromeHit.selection;
      const menu = (model.menus ?? []).find(entry => entry.id === menuSel.menuId);
      const entry = menu?.entries?.[menuSel.entryIndex];
      const sourceLine = entry?.source?.line;
      if (menu && entry && typeof sourceLine === "number") {
        drag = {
          target: "menuEntry",
          menuId: menu.id,
          entryIndex: menuSel.entryIndex,
          sourceLine,
          kind: entry.kind,
          startMx: mx,
          startMy: my,
          moved: false,
          moveTarget: null
        };
        canvas.style.cursor = "move";
        renderSelectionUiWithoutParentSelector();
        return;
      }
    }

    drag = null;
    canvas.style.cursor = "default";
    renderSelectionUiWithoutParentSelector();
    return;
  }

  const chromeHit = hitTestPreviewChrome(mx, my, previewChromeMetrics);
  if (chromeHit) {
    const g = chromeHit.gadget;
    selection = { kind: "gadget", id: g.id };

    const h = hitHandleGadget(g, mx, my);
    if (h) {
      drag = {
        target: "gadget",
        mode: "resize",
        id: g.id,
        handle: h,
        startMx: mx,
        startMy: my,
        startX: g.x,
        startY: g.y,
        startW: g.w,
        startH: g.h
      };
      canvas.style.cursor = getHandleCursor(h);
    } else if (chromeHit.zone === "containerBorder" || chromeHit.zone === "panelHeader") {
      drag = {
        target: "gadget",
        mode: "move",
        id: g.id,
        startMx: mx,
        startMy: my,
        startX: g.x,
        startY: g.y,
        startW: g.w,
        startH: g.h
      };
      canvas.style.cursor = "move";
    } else if (chromeHit.zone === "scrollAreaVBar" || chromeHit.zone === "scrollAreaHBar") {
      const metrics = previewChromeMetrics;
      const layout = getGadgetPreviewLayout(g, metrics);
      const axis = chromeHit.zone === "scrollAreaHBar" ? "x" : "y";
      drag = {
        target: "scrollArea",
        axis,
        id: g.id,
        startMx: mx,
        startMy: my,
        startOffset: axis === "x" ? getScrollAreaOffsetX(g, layout.rect, metrics) : getScrollAreaOffsetY(g, layout.rect, metrics),
        maxOffset: axis === "x" ? getScrollAreaMaxOffsetX(layout.rect, metrics, g.min) : getScrollAreaMaxOffsetY(layout.rect, metrics, g.max),
        trackLength: axis === "x"
          ? Math.max(1, getScrollAreaHorizontalBarRect(layout.rect, metrics).w)
          : Math.max(1, getScrollAreaVerticalBarRect(layout.rect, metrics).h)
      };
      canvas.style.cursor = "default";
    } else if (chromeHit.zone === "splitterBar") {
      drag = {
        target: "gadget",
        mode: "move",
        id: g.id,
        startMx: mx,
        startMy: my,
        startX: g.x,
        startY: g.y,
        startW: g.w,
        startH: g.h
      };
      canvas.style.cursor = "move";
    } else {
      drag = null;
      canvas.style.cursor = "default";
    }

    renderSelectionUiWithoutParentSelector();
    return;
  }

  const g = hitTestGadget(mx, my);
  if (g) {
    selection = { kind: "gadget", id: g.id };

    const h = hitHandleGadget(g, mx, my);
    if (h) {
      drag = {
        target: "gadget",
        mode: "resize",
        id: g.id,
        handle: h,
        startMx: mx,
        startMy: my,
        startX: g.x,
        startY: g.y,
        startW: g.w,
        startH: g.h
      };
      canvas.style.cursor = getHandleCursor(h);
    } else {
      drag = {
        target: "gadget",
        mode: "move",
        id: g.id,
        startMx: mx,
        startMy: my,
        startX: g.x,
        startY: g.y,
        startW: g.w,
        startH: g.h
      };
      canvas.style.cursor = "move";
    }

    renderSelectionUiWithoutParentSelector();
    return;
  }

  // Window interaction (no gadget hit)
  const wr = getWinRect();
  if (wr && hitWindow(mx, my)) {
    selection = { kind: "window" };

    const wh = hitHandleWindow(mx, my);
    if (wh) {
      drag = {
        target: "window",
        mode: "resize",
        handle: wh,
        startMx: mx,
        startMy: my,
        startX: wr.x,
        startY: wr.y,
        startW: wr.w,
        startH: wr.h
      };
      canvas.style.cursor = getHandleCursor(wh);
    } else if (isInTitleBar(mx, my)) {
      drag = {
        target: "window",
        mode: "move",
        startMx: mx,
        startMy: my,
        startX: wr.x,
        startY: wr.y,
        startW: wr.w,
        startH: wr.h
      };
      canvas.style.cursor = "move";
    } else {
      drag = null;
      canvas.style.cursor = "default";
    }

    renderSelectionUiWithoutParentSelector();
    return;
  }

  selection = null;
  drag = null;
  canvas.style.cursor = "default";

  renderSelectionUiWithoutParentSelector();
});

window.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (!drag) {
    // Window handles have priority
    const wh = hitHandleWindow(mx, my);
    if (wh) {
      canvas.style.cursor = getHandleCursor(wh);
      return;
    }

    if (isInTitleBar(mx, my)) {
      canvas.style.cursor = "move";
      return;
    }

    // Gadget handle only when selected (like typical designers)
    {
      const sel = selection;
      if (sel && sel.kind === "gadget") {
        const selId = sel.id;
        const gSel = model.gadgets.find(it => it.id === selId);
        if (gSel) {
          const gh = hitHandleGadget(gSel, mx, my);
          if (gh) {
            canvas.style.cursor = getHandleCursor(gh);
            return;
          }
        }
      }
    }

    const chromeLayout = getWindowGlobalChromeLayout(previewChromeMetrics);
  const topLevelChromeHit = resolveTopLevelChromeHit({
    x: mx,
    y: my,
    windowHit: hitWindow(mx, my),
    menuId: getPrimaryMenu()?.id,
    menuRect: chromeLayout?.menuBarRect ?? null,
    menuEntryRects: menuEntryPreviewRects,
    toolBarId: getPrimaryToolbar()?.id,
    toolBarRect: chromeLayout?.toolBarRect ?? null,
    toolBarEntryRects: toolBarEntryPreviewRects,
    statusBarId: getPrimaryStatusbar()?.id,
    statusBarRect: chromeLayout?.statusBarRect ?? null,
    statusBarFieldRects: statusBarFieldPreviewRects
  });
    if (topLevelChromeHit) {
      canvas.style.cursor = "default";
      return;
    }

    const chromeHit = hitTestPreviewChrome(mx, my, previewChromeMetrics);
    if (chromeHit) {
      if (chromeHit.zone === "containerBorder" || chromeHit.zone === "panelHeader" || chromeHit.zone === "splitterBar") {
        canvas.style.cursor = "move";
      } else {
        canvas.style.cursor = "default";
      }
      return;
    }

    const g = hitTestGadget(mx, my);
    canvas.style.cursor = g ? "move" : "default";
    return;
  }

  const d = drag;
  const dx = mx - d.startMx;
  const dy = my - d.startMy;

  if (d.target === "scrollArea") {
    const g = model.gadgets.find(it => it.id === d.id);
    if (!g) return;
    const delta = d.axis === "x" ? dx : dy;
    const nextOffset = clamp(d.startOffset + Math.round((delta / d.trackLength) * d.maxOffset), 0, d.maxOffset);
    const metrics = previewChromeMetrics;
    const layout = getGadgetPreviewLayout(g, metrics);
    const current = getScrollAreaPreviewOffset(g.id);
    if (d.axis === "x") {
      setScrollAreaPreviewOffset(g, layout.rect, metrics, nextOffset, current.y);
    } else {
      setScrollAreaPreviewOffset(g, layout.rect, metrics, current.x, nextOffset);
    }
    canvas.style.cursor = "default";
    render();
    renderProps();
    return;
  }

  if (d.target === "menuEntry") {
    const moved = Math.abs(dx) > 3 || Math.abs(dy) > 3;
    d.moved = moved;
    if (moved) {
      const menu = (model.menus ?? []).find(entry => entry.id === d.menuId);
      const chromeLayout = getWindowGlobalChromeLayout(previewChromeMetrics);
      const menuBarRect = chromeLayout?.menuBarRect ?? null;
      const menuBarBottom = menuBarRect ? menuBarRect.y + menuBarRect.h : 0;
      d.moveTarget = menu ? getMenuEntryMoveTarget({
        menu,
        sourceEntryIndex: d.entryIndex,
        x: mx,
        y: my,
        menuBarBottom,
        visibleEntries: getMenuVisibleEntries(menu, menuEntryPreviewRects),
        footerRects: menuFooterPreviewRects,
        selectedEntryIndex: selection && selection.kind === "menuEntry" && selection.menuId === menu.id ? selection.entryIndex : undefined
      }) : null;
    } else {
      d.moveTarget = null;
    }
    canvas.style.cursor = moved ? "move" : "default";
    render();
    renderProps();
    return;
  }

  if (d.target === "gadget") {
    const g = model.gadgets.find(it => it.id === d.id);
    if (!g) return;

    if (d.mode === "move") {
      let nx = asInt(d.startX + dx);
      let ny = asInt(d.startY + dy);

      const p = applyLiveSnapPoint(nx, ny);
      nx = p.x;
      ny = p.y;

      g.x = nx;
      g.y = ny;
      canvas.style.cursor = "move";
    } else {
      const r0 = applyResize({ x: d.startX, y: d.startY, w: d.startW, h: d.startH }, { dx, dy }, d.handle, MIN_GADGET_W, MIN_GADGET_H);

      let nx = r0.x;
      let ny = r0.y;
      let nw = r0.w;
      let nh = r0.h;
      const r1 = applyLiveSnapRect(nx, ny, nw, nh, MIN_GADGET_W, MIN_GADGET_H);
      nx = r1.x;
      ny = r1.y;
      nw = r1.w;
      nh = r1.h;

      g.x = nx;
      g.y = ny;
      g.w = nw;
      g.h = nh;

      canvas.style.cursor = getHandleCursor(d.handle);
    }

    render();
    renderProps();
    return;
  }

  // Window dragging
  if (!model.window) return;

  if (d.mode === "move") {
    let nx = asInt(d.startX + dx);
    let ny = asInt(d.startY + dy);

    const p = applyLiveSnapPoint(nx, ny);
    nx = p.x;
    ny = p.y;

    model.window.x = nx;
    model.window.y = ny;

    canvas.style.cursor = "move";
  } else {
    const r0 = applyResize({ x: d.startX, y: d.startY, w: d.startW, h: d.startH }, { dx, dy }, d.handle, MIN_WIN_W, MIN_WIN_H);

    let nx = r0.x;
    let ny = r0.y;
    let nw = r0.w;
    let nh = r0.h;
    const r1 = applyLiveSnapRect(nx, ny, nw, nh, MIN_WIN_W, MIN_WIN_H);
    nx = r1.x;
    ny = r1.y;
    nw = r1.w;
    nh = r1.h;

    model.window.x = nx;
    model.window.y = ny;
    model.window.w = nw;
    model.window.h = nh;

    canvas.style.cursor = getHandleCursor(d.handle);
  }

  render();
  renderProps();
});

window.addEventListener("mouseup", () => {
  const d = drag;
  if (!d) return;

  if (d.target === "scrollArea") {
    drag = null;
    return;
  }

  if (d.target === "menuEntry") {
    if (d.moved && d.moveTarget) {
      const menu = (model.menus ?? []).find(entry => entry.id === d.menuId);
      pendingMenuEntrySelection = menu
        ? buildPendingMenuEntrySelection(menu, d.entryIndex, d.moveTarget.targetSourceLine, d.moveTarget.placement)
        : null;
      post({
        type: "moveMenuEntry",
        menuId: d.menuId,
        sourceLine: d.sourceLine,
        kind: d.kind,
        targetSourceLine: d.moveTarget.targetSourceLine,
        placement: d.moveTarget.placement
      });
    }
    drag = null;
    canvas.style.cursor = "default";
    renderSelectionUiWithoutParentSelector();
    return;
  }

  if (d.target === "gadget") {
    const g = model.gadgets.find(it => it.id === d.id);
    if (g) {
      const startRect = { x: d.startX, y: d.startY, w: d.startW, h: d.startH };
      if (hasRectChanged(g, startRect)) {
        applyDropSnapRectInPlace(g, MIN_GADGET_W, MIN_GADGET_H);
        if (hasRectChanged(g, startRect)) {
          postGadgetRect(g);
        }
      }
    }
  } else if (model.window) {
    const startRect = { x: d.startX, y: d.startY, w: d.startW, h: d.startH };
    if (hasRectChanged(model.window, startRect)) {
      applyDropSnapRectInPlace(model.window, MIN_WIN_W, MIN_WIN_H);
      if (hasRectChanged(model.window, startRect)) {
        postWindowRect();
      }
    }
  }

  drag = null;
});

type GadgetPreviewLayout = {
  rect: PreviewRect;
  clip: PreviewRect;
  visible: boolean;
};

type PanelTabRect = PanelTabLayout;

type PreviewChromeHitZone = "containerBorder" | "panelHeader" | "scrollAreaVBar" | "scrollAreaHBar" | "splitterBar";

type PreviewChromeHit = {
  gadget: Gadget;
  zone: PreviewChromeHitZone;
};

function getGadgetById(id: string | undefined): Gadget | undefined {
  if (!id) return undefined;
  return model.gadgets.find((g) => g.id === id);
}

function rectIntersects(a: PreviewRect, b: PreviewRect): boolean {
  const i = intersectRect(a, b);
  return i.w > 0 && i.h > 0;
}

function getPanelActiveItem(panel: Gadget): number {
  return resolvePanelActiveItem(panelActiveItems.get(panel.id), panel.items?.length ?? 0);
}

function getScrollAreaPreviewOffset(gadgetId: string): { x: number; y: number } {
  const stored = scrollAreaOffsets.get(gadgetId);
  if (stored) return stored;
  return { x: 0, y: 0 };
}

function getClampedScrollAreaPreviewOffset(g: Gadget, rect: PreviewRect, metrics: PreviewChromeMetrics): { x: number; y: number } {
  return clampScrollAreaOffset(getScrollAreaPreviewOffset(g.id), rect, metrics, g.min, g.max);
}

function getScrollAreaOffsetX(g: Gadget, rect: PreviewRect, metrics: PreviewChromeMetrics): number {
  return getClampedScrollAreaPreviewOffset(g, rect, metrics).x;
}

function getScrollAreaOffsetY(g: Gadget, rect: PreviewRect, metrics: PreviewChromeMetrics): number {
  return getClampedScrollAreaPreviewOffset(g, rect, metrics).y;
}

function setScrollAreaPreviewOffset(g: Gadget, rect: PreviewRect, metrics: PreviewChromeMetrics, nextX: number, nextY: number) {
  const next = clampScrollAreaOffset({ x: nextX, y: nextY }, rect, metrics, g.min, g.max);
  if (next.x === 0 && next.y === 0) {
    scrollAreaOffsets.delete(g.id);
    return;
  }
  scrollAreaOffsets.set(g.id, next);
}

function getPanelTabRects(
  ctx: CanvasRenderingContext2D,
  g: Gadget,
  rect: PreviewRect,
  metrics: PreviewChromeMetrics
): PanelTabRect[] {
  const labels = (g.items ?? []).map((item, index) => (item.text ?? unquotePbString(item.textRaw)) || `Tab ${index}`);
  return getPanelTabLayouts(labels, rect, metrics, getPanelActiveItem(g), (label) => ctx.measureText(label).width);
}

function getGadgetPreviewLayout(
  g: Gadget,
  metrics: PreviewChromeMetrics,
  cache = new Map<string, GadgetPreviewLayout>(),
  visiting = new Set<string>()
): GadgetPreviewLayout {
  const cached = cache.get(g.id);
  if (cached) return cached;

  if (visiting.has(g.id)) {
    const cycle: GadgetPreviewLayout = { rect: { x: g.x, y: g.y, w: g.w, h: g.h }, clip: { x: 0, y: 0, w: 0, h: 0 }, visible: false };
    cache.set(g.id, cycle);
    return cycle;
  }

  visiting.add(g.id);
  const windowRect = getWindowLocalRect();
  const windowContentRect = getWindowContentPreviewRect(metrics);

  let rect: PreviewRect = { x: g.x, y: g.y, w: g.w, h: g.h };
  let clip = windowRect;
  let visible = rect.w > 0 && rect.h > 0;

  if (g.splitterId) {
    const splitter = getGadgetById(g.splitterId);
    if (splitter) {
      const splitterLayout = getGadgetPreviewLayout(splitter, metrics, cache, visiting);
      const paneRect = g.id === splitter.gadget1Id
        ? getSplitterPaneRect(splitterLayout.rect, hasPbFlag(splitter.flagsExpr, "#PB_Splitter_Vertical"), metrics.splitterWidth, splitter.state, "first")
        : g.id === splitter.gadget2Id
          ? getSplitterPaneRect(splitterLayout.rect, hasPbFlag(splitter.flagsExpr, "#PB_Splitter_Vertical"), metrics.splitterWidth, splitter.state, "second")
          : splitterLayout.rect;
      rect = paneRect;
      clip = intersectRect(splitterLayout.clip, paneRect);
      visible = splitterLayout.visible && clip.w > 0 && clip.h > 0;
    }
  } else if (g.parentId) {
    const parent = getGadgetById(g.parentId);
    if (parent) {
      const parentLayout = getGadgetPreviewLayout(parent, metrics, cache, visiting);
      const parentContentRect = getGadgetContentRect(parent.kind, parentLayout.rect, metrics);
      clip = intersectRect(parentLayout.clip, parentContentRect);
      let localX = g.x;
      let localY = g.y;
      if (parent.kind === "ScrollAreaGadget") {
        localX -= getScrollAreaOffsetX(parent, parentLayout.rect, metrics);
        localY -= getScrollAreaOffsetY(parent, parentLayout.rect, metrics);
      }
      rect = { x: parentContentRect.x + localX, y: parentContentRect.y + localY, w: g.w, h: g.h };
      visible = parentLayout.visible && clip.w > 0 && clip.h > 0 && rectIntersects(rect, clip);

      if (parent.kind === "PanelGadget" && typeof g.parentItem === "number") {
        visible = visible && g.parentItem === getPanelActiveItem(parent);
      }
    }
  } else {
    rect = { x: windowContentRect.x + g.x, y: windowContentRect.y + g.y, w: g.w, h: g.h };
    clip = intersectRect(windowContentRect, rect);
    visible = clip.w > 0 && clip.h > 0;
  }

  const layout: GadgetPreviewLayout = { rect, clip, visible };
  visiting.delete(g.id);
  cache.set(g.id, layout);
  return layout;
}

function hitTestPreviewChrome(mx: number, my: number, metrics: PreviewChromeMetrics): PreviewChromeHit | null {
  if (!hitWindow(mx, my)) return null;

  const { lx, ly } = toLocal(mx, my);
  const cache = new Map<string, GadgetPreviewLayout>();

  for (let i = model.gadgets.length - 1; i >= 0; i--) {
    const g = model.gadgets[i];
    const layout = getGadgetPreviewLayout(g, metrics, cache);
    if (!layout.visible) continue;
    if (!rectContainsPoint(layout.rect, lx, ly)) continue;
    if (!rectContainsPoint(layout.clip, lx, ly)) continue;

    if (g.kind === "SplitterGadget") {
      if (isPointOnRectBorder(layout.rect, lx, ly)) {
        return { gadget: g, zone: "containerBorder" };
      }
      const barRect = intersectRect(getSplitterBarRect(layout.rect, hasPbFlag(g.flagsExpr, "#PB_Splitter_Vertical"), metrics.splitterWidth, g.state), layout.clip);
      if (rectContainsPoint(barRect, lx, ly)) {
        return { gadget: g, zone: "splitterBar" };
      }
      continue;
    }

    if (g.kind === "PanelGadget") {
      const panelHeight = Math.min(metrics.panelHeight, Math.max(18, layout.rect.h));
      const headerRect = intersectRect({ x: layout.rect.x, y: layout.rect.y, w: layout.rect.w, h: panelHeight }, layout.clip);
      if (rectContainsPoint(headerRect, lx, ly)) {
        return { gadget: g, zone: "panelHeader" };
      }
    }

    if (g.kind === "ContainerGadget" || g.kind === "PanelGadget" || g.kind === "ScrollAreaGadget" || g.kind === "FrameGadget") {
      if (isPointOnRectBorder(layout.rect, lx, ly)) {
        return { gadget: g, zone: "containerBorder" };
      }
    }

    if (g.kind === "ScrollAreaGadget") {
      const verticalBar = intersectRect(getScrollAreaVerticalBarRect(layout.rect, metrics), layout.clip);
      if (rectContainsPoint(verticalBar, lx, ly)) {
        return { gadget: g, zone: "scrollAreaVBar" };
      }
      const horizontalBar = intersectRect(getScrollAreaHorizontalBarRect(layout.rect, metrics), layout.clip);
      if (rectContainsPoint(horizontalBar, lx, ly)) {
        return { gadget: g, zone: "scrollAreaHBar" };
      }
    }
  }

  return null;
}

function hitTestPanelTab(mx: number, my: number, metrics: PreviewChromeMetrics): { panel: Gadget; index: number } | null {
  if (!hitWindow(mx, my)) return null;

  const { lx, ly } = toLocal(mx, my);
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";

  try {
    const cache = new Map<string, GadgetPreviewLayout>();
    for (let i = model.gadgets.length - 1; i >= 0; i--) {
      const g = model.gadgets[i];
      if (g.kind !== "PanelGadget") continue;
      const layout = getGadgetPreviewLayout(g, metrics, cache);
      if (!layout.visible) continue;
      const tabs = getPanelTabRects(ctx, g, layout.rect, metrics);
      for (const tab of tabs) {
        if (rectContainsPoint(intersectRect(tab.rect, layout.clip), lx, ly)) {
          return { panel: g, index: tab.index };
        }
      }
    }
  } finally {
    ctx.restore();
  }

  return null;
}

function drawContainerChrome(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fg: string
) {
  const bg = getCssVar("--vscode-editor-background") || "transparent";

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = bg;
  ctx.fillRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = fg;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.restore();
}

function drawPanelChrome(
  ctx: CanvasRenderingContext2D,
  g: Gadget,
  x: number,
  y: number,
  w: number,
  h: number,
  fg: string,
  metrics: PreviewChromeMetrics
) {
  const panelHeight = Math.min(metrics.panelHeight, Math.max(18, h));
  const bg = getCssVar("--vscode-editor-background") || "transparent";
  const inactiveBg = getCssVar("--vscode-sideBar-background") || bg;
  const activeBg = getCssVar("--vscode-input-background") || bg;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = bg;
  ctx.fillRect(x + 1, y + panelHeight, Math.max(0, w - 2), Math.max(0, h - panelHeight - 1));
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = fg;
  ctx.strokeRect(x + 0.5, y + panelHeight + 0.5, w, Math.max(0, h - panelHeight));
  ctx.restore();

  for (const tab of getPanelTabRects(ctx, g, { x, y, w, h }, metrics)) {
    ctx.save();
    ctx.fillStyle = tab.active ? activeBg : inactiveBg;
    ctx.globalAlpha = tab.active ? 1 : 0.92;
    ctx.fillRect(tab.rect.x + 1, tab.rect.y + 1, Math.max(0, tab.rect.w - 2), Math.max(0, tab.rect.h - 1));
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = fg;
    ctx.strokeRect(tab.rect.x + 0.5, tab.rect.y + 0.5, tab.rect.w, tab.rect.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = fg;
    ctx.fillText(tab.label, tab.rect.x + 7, y + Math.min(panelHeight - 7, 15));
    ctx.restore();
  }
}

function drawScrollAreaChrome(
  ctx: CanvasRenderingContext2D,
  g: Gadget,
  x: number,
  y: number,
  w: number,
  h: number,
  fg: string,
  metrics: PreviewChromeMetrics
) {
  const rect = { x, y, w, h };
  const bar = getScrollAreaBarSize(rect, metrics);
  const bg = getCssVar("--vscode-editor-background") || "transparent";
  const trackBg = getCssVar("--vscode-sideBar-background") || bg;
  const thumbBg = getCssVar("--vscode-scrollbarSlider-background") || fg;
  const viewportRect = getScrollAreaViewportRect(rect, metrics);
  const viewportW = viewportRect.w;
  const viewportH = viewportRect.h;
  const innerW = typeof g.min === "number" && g.min > 0 ? g.min : viewportW;
  const innerH = typeof g.max === "number" && g.max > 0 ? g.max : viewportH;
  const offsetX = getScrollAreaOffsetX(g, rect, metrics);
  const offsetY = getScrollAreaOffsetY(g, rect, metrics);
  const verticalTrack = getScrollAreaVerticalBarRect(rect, metrics);
  const horizontalTrack = getScrollAreaHorizontalBarRect(rect, metrics);
  const verticalThumb = getScrollAreaVerticalThumbRect(rect, metrics, innerH, offsetY);
  const horizontalThumb = getScrollAreaHorizontalThumbRect(rect, metrics, innerW, offsetX);

  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = fg;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = trackBg;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(verticalTrack.x + 1, verticalTrack.y + 1, Math.max(0, verticalTrack.w - 1), Math.max(0, verticalTrack.h - 1));
  ctx.fillRect(horizontalTrack.x + 1, horizontalTrack.y + 1, Math.max(0, horizontalTrack.w - 1), Math.max(0, horizontalTrack.h - 1));
  ctx.restore();

  if (innerH > viewportH && viewportH > 0) {
    ctx.save();
    ctx.fillStyle = thumbBg;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(verticalThumb.x + 3, verticalThumb.y + 3, Math.max(3, verticalThumb.w - 6), Math.max(10, verticalThumb.h - 6));
    ctx.restore();
  }

  if (innerW > viewportW && viewportW > 0) {
    ctx.save();
    ctx.fillStyle = thumbBg;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(horizontalThumb.x + 3, horizontalThumb.y + 3, Math.max(10, horizontalThumb.w - 6), Math.max(3, horizontalThumb.h - 6));
    ctx.restore();
  }
}

function drawSplitterChrome(
  ctx: CanvasRenderingContext2D,
  g: Gadget,
  x: number,
  y: number,
  w: number,
  h: number,
  fg: string,
  metrics: PreviewChromeMetrics
) {
  const vertical = hasPbFlag(g.flagsExpr, "#PB_Splitter_Vertical");
  const separator = hasPbFlag(g.flagsExpr, "#PB_Splitter_Separator");
  const bar = metrics.splitterWidth;
  const range = Math.max(0, (vertical ? w : h) - bar);
  const rawPos = typeof g.state === "number" ? Math.trunc(g.state) : Math.trunc(range / 2);
  const pos = clamp(rawPos, 0, range);
  const bg = getCssVar("--vscode-editor-background") || "transparent";

  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = fg;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = getCssVar("--vscode-sideBar-background") || bg;
  ctx.globalAlpha = 0.95;
  if (vertical) {
    ctx.fillRect(x + pos, y + 1, bar, Math.max(0, h - 2));
  } else {
    ctx.fillRect(x + 1, y + pos, Math.max(0, w - 2), bar);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = fg;
  if (separator) {
    if (vertical) {
      ctx.beginPath();
      ctx.moveTo(x + pos + Math.trunc(bar / 2) + 0.5, y + 2);
      ctx.lineTo(x + pos + Math.trunc(bar / 2) + 0.5, y + h - 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + pos + Math.trunc(bar / 2) + 0.5);
      ctx.lineTo(x + w - 2, y + pos + Math.trunc(bar / 2) + 0.5);
      ctx.stroke();
    }
  } else {
    const dots = 3;
    for (let i = 0; i < dots; i++) {
      if (vertical) {
        const cy = y + Math.trunc(h / 2) - 8 + i * 8;
        ctx.strokeRect(x + pos + Math.trunc((bar - 4) / 2) + 0.5, cy + 0.5, 3, 3);
      } else {
        const cx = x + Math.trunc(w / 2) - 8 + i * 8;
        ctx.strokeRect(cx + 0.5, y + pos + Math.trunc((bar - 4) / 2) + 0.5, 3, 3);
      }
    }
  }
  ctx.restore();
}

function openGadgetItemEditor(gadget: Gadget, item?: GadgetItem) {
  pendingGadgetItemEditor = {
    gadgetId: gadget.id,
    sourceLine: item?.source?.line,
    posRaw: item?.posRaw ?? "-1",
    text: item?.text ?? "",
    imageRaw: item?.imageRaw ?? "",
    flagsRaw: item?.flagsRaw ?? ""
  };
}

function closeGadgetItemEditor(gadgetId?: string, sourceLine?: number) {
  if (!pendingGadgetItemEditor) return;
  if (gadgetId && pendingGadgetItemEditor.gadgetId !== gadgetId) return;
  if (typeof sourceLine === "number" && pendingGadgetItemEditor.sourceLine !== sourceLine) return;
  pendingGadgetItemEditor = null;
}

function isGadgetItemEditorOpen(gadget: Gadget, item?: GadgetItem): boolean {
  if (!pendingGadgetItemEditor || pendingGadgetItemEditor.gadgetId !== gadget.id) return false;
  if (!item) return true;
  return typeof item.source?.line === "number" && pendingGadgetItemEditor.sourceLine === item.source.line;
}

function getGadgetItemDraft(gadget: Gadget): PendingGadgetItemEditor | null {
  if (!pendingGadgetItemEditor || pendingGadgetItemEditor.gadgetId !== gadget.id) return null;
  return pendingGadgetItemEditor;
}

function updateGadgetItemEditorDraft(patch: Partial<PendingGadgetItemEditor>) {
  if (!pendingGadgetItemEditor) return;
  pendingGadgetItemEditor = { ...pendingGadgetItemEditor, ...patch };
  renderProps();
}

function saveGadgetItemEditor(gadget: Gadget) {
  const draft = getGadgetItemDraft(gadget);
  if (!draft) return;

  const payload = {
    id: gadget.id,
    posRaw: draft.posRaw.trim() || "-1",
    textRaw: toPbString(draft.text),
    imageRaw: draft.imageRaw.trim().length ? draft.imageRaw.trim() : undefined,
    flagsRaw: draft.flagsRaw.trim().length ? draft.flagsRaw.trim() : undefined,
  };

  const sourceLine = draft.sourceLine;
  closeGadgetItemEditor(gadget.id, sourceLine);
  if (typeof sourceLine === "number") {
    post({
      type: "updateGadgetItem",
      sourceLine,
      ...payload,
    });
    return;
  }

  post({
    type: "insertGadgetItem",
    ...payload,
  });
}

function openGadgetColumnEditor(gadget: Gadget, column?: GadgetColumn, index?: number) {
  pendingGadgetColumnEditor = {
    gadgetId: gadget.id,
    sourceLine: column?.source?.line,
    colRaw: column?.colRaw ?? String(index ?? gadget.columns?.length ?? 0),
    title: column?.title ?? "",
    widthRaw: column?.widthRaw ?? "80"
  };
}

function closeGadgetColumnEditor(gadgetId?: string, sourceLine?: number) {
  if (!pendingGadgetColumnEditor) return;
  if (gadgetId && pendingGadgetColumnEditor.gadgetId !== gadgetId) return;
  if (typeof sourceLine === "number" && pendingGadgetColumnEditor.sourceLine !== sourceLine) return;
  pendingGadgetColumnEditor = null;
}

function isGadgetColumnEditorOpen(gadget: Gadget, column?: GadgetColumn): boolean {
  if (!pendingGadgetColumnEditor || pendingGadgetColumnEditor.gadgetId !== gadget.id) return false;
  if (!column) return true;
  return typeof column.source?.line === "number" && pendingGadgetColumnEditor.sourceLine === column.source.line;
}

function getGadgetColumnDraft(gadget: Gadget): PendingGadgetColumnEditor | null {
  if (!pendingGadgetColumnEditor || pendingGadgetColumnEditor.gadgetId !== gadget.id) return null;
  return pendingGadgetColumnEditor;
}

function updateGadgetColumnEditorDraft(patch: Partial<PendingGadgetColumnEditor>) {
  if (!pendingGadgetColumnEditor) return;
  pendingGadgetColumnEditor = { ...pendingGadgetColumnEditor, ...patch };
  renderProps();
}

function saveGadgetColumnEditor(gadget: Gadget) {
  const draft = getGadgetColumnDraft(gadget);
  if (!draft) return;

  const payload = {
    id: gadget.id,
    colRaw: draft.colRaw.trim() || String(gadget.columns?.length ?? 0),
    titleRaw: toPbString(draft.title),
    widthRaw: draft.widthRaw.trim() || "80",
  };

  const sourceLine = draft.sourceLine;
  closeGadgetColumnEditor(gadget.id, sourceLine);
  if (typeof sourceLine === "number") {
    post({
      type: "updateGadgetColumn",
      sourceLine,
      ...payload,
    });
    return;
  }

  post({
    type: "insertGadgetColumn",
    ...payload,
  });
}

function openImageEditor(entry: ImageEntry) {
  if (typeof entry.source?.line !== "number") return;
  pendingImageEditor = {
    sourceLine: entry.source.line,
    inline: entry.inline,
    idRaw: entry.firstParam,
    imageRaw: entry.imageRaw,
    assignedVar: entry.variable ?? entry.id ?? "imgNew"
  };
}

function closeImageEditor(sourceLine?: number) {
  if (!pendingImageEditor) return;
  if (typeof sourceLine === "number" && pendingImageEditor.sourceLine !== sourceLine) return;
  pendingImageEditor = null;
}

function isImageEditorOpen(entry: ImageEntry): boolean {
  return typeof entry.source?.line === "number"
    && pendingImageEditor?.sourceLine === entry.source.line;
}

function getImageEditorDraft(entry: ImageEntry): PendingImageEditor {
  if (isImageEditorOpen(entry) && pendingImageEditor) {
    return pendingImageEditor;
  }

  return {
    sourceLine: entry.source?.line ?? -1,
    inline: entry.inline,
    idRaw: entry.firstParam,
    imageRaw: entry.imageRaw,
    assignedVar: entry.variable ?? entry.id ?? "imgNew"
  };
}

function updateImageEditorDraft(patch: Partial<PendingImageEditor>) {
  if (!pendingImageEditor) return;
  pendingImageEditor = { ...pendingImageEditor, ...patch };
  renderProps();
}

function saveImageEditor(entry: ImageEntry) {
  if (typeof entry.source?.line !== "number") return;
  const draft = getImageEditorDraft(entry);
  const idRaw = draft.idRaw.trim();
  const imageRaw = draft.imageRaw.trim();
  if (!idRaw.length || !imageRaw.length) return;

  let assignedVar: string | undefined;
  if (idRaw.toLowerCase() === "#pb_any") {
    const trimmedAssigned = draft.assignedVar.trim();
    if (!trimmedAssigned.length) {
      alert("#PB_Any requires an assigned variable name.");
      return;
    }
    assignedVar = trimmedAssigned;
  }

  closeImageEditor(entry.source.line);
  post({
    type: "updateImage",
    sourceLine: entry.source.line,
    inline: draft.inline,
    idRaw,
    imageRaw,
    assignedVar
  });
  renderProps();
}

function isSameImageTarget(target: ImageAssignmentTarget, other: ImageAssignmentTarget): boolean {
  if (target.kind !== other.kind) return false;
  switch (target.kind) {
    case "menuEntry":
      return target.menuId === (other as Extract<ImageAssignmentTarget, { kind: "menuEntry" }>).menuId
        && target.entryIndex === (other as Extract<ImageAssignmentTarget, { kind: "menuEntry" }>).entryIndex;
    case "toolBarEntry":
      return target.toolBarId === (other as Extract<ImageAssignmentTarget, { kind: "toolBarEntry" }>).toolBarId
        && target.entryIndex === (other as Extract<ImageAssignmentTarget, { kind: "toolBarEntry" }>).entryIndex;
    case "statusBarField":
      return target.statusBarId === (other as Extract<ImageAssignmentTarget, { kind: "statusBarField" }>).statusBarId
        && target.fieldIndex === (other as Extract<ImageAssignmentTarget, { kind: "statusBarField" }>).fieldIndex;
    case "gadget":
      return target.gadgetId === (other as Extract<ImageAssignmentTarget, { kind: "gadget" }>).gadgetId;
  }
}

function getDefaultPendingImageInsertDraft(): PendingImageInsertDraft {
  return {
    inline: false,
    idRaw: "#ImgNew",
    imageRaw: '"image.png"',
    assignedVar: "imgNew"
  };
}

function openImageInsertDraft() {
  pendingImageInsertDraft = getDefaultPendingImageInsertDraft();
  renderProps();
}

function closeImageInsertDraft() {
  pendingImageInsertDraft = null;
  renderProps();
}

function updateImageInsertDraft(patch: Partial<PendingImageInsertDraft>) {
  if (!pendingImageInsertDraft) return;
  pendingImageInsertDraft = { ...pendingImageInsertDraft, ...patch };
  renderProps();
}

function saveImageInsertDraft() {
  if (!pendingImageInsertDraft) return;
  const inline = pendingImageInsertDraft.inline;
  const idRaw = pendingImageInsertDraft.idRaw.trim();
  const imageRaw = pendingImageInsertDraft.imageRaw.trim();
  if (!idRaw.length || !imageRaw.length) return;

  let assignedVar: string | undefined;
  if (idRaw.toLowerCase() === "#pb_any") {
    const trimmedAssigned = pendingImageInsertDraft.assignedVar.trim();
    if (!trimmedAssigned.length) {
      alert("#PB_Any requires an assigned variable name.");
      return;
    }
    assignedVar = trimmedAssigned;
  }

  pendingImageInsertDraft = null;
  post({
    type: "insertImage",
    inline,
    idRaw,
    imageRaw,
    assignedVar
  });
  renderProps();
}

function openImageReferencePicker(target: ImageAssignmentTarget, currentImageId?: string) {
  if (!(model.images?.length)) {
    alert("No image entries are defined in this form.");
    return;
  }
  pendingImageReferencePicker = {
    target,
    selectedImageId: getDefaultImageReferenceSelection(currentImageId)
  };
  renderProps();
}

function closeImageReferencePicker() {
  pendingImageReferencePicker = null;
  renderProps();
}

function updateImageReferencePicker(patch: Partial<PendingImageReferencePicker>) {
  if (!pendingImageReferencePicker) return;
  pendingImageReferencePicker = { ...pendingImageReferencePicker, ...patch };
  renderProps();
}

function isImageReferencePickerOpenFor(target: ImageAssignmentTarget): boolean {
  return Boolean(pendingImageReferencePicker && isSameImageTarget(pendingImageReferencePicker.target, target));
}

function getDefaultPendingImageAssignmentDraft(target: ImageAssignmentTarget, mode: "create" | "chooseFile"): PendingImageAssignmentDraft {
  return {
    target,
    mode,
    inline: false,
    idRaw: "#ImgNew",
    imageRaw: '"image.png"',
    assignedVar: "imgNew",
    resizeToImage: false,
  };
}

function openImageAssignmentDraft(target: ImageAssignmentTarget, mode: "create" | "chooseFile") {
  pendingImageAssignmentDraft = getDefaultPendingImageAssignmentDraft(target, mode);
  renderProps();
}

function closeImageAssignmentDraft() {
  pendingImageAssignmentDraft = null;
  renderProps();
}

function updateImageAssignmentDraft(patch: Partial<PendingImageAssignmentDraft>) {
  if (!pendingImageAssignmentDraft) return;
  pendingImageAssignmentDraft = { ...pendingImageAssignmentDraft, ...patch };
  renderProps();
}

function isImageAssignmentDraftOpenFor(target: ImageAssignmentTarget): boolean {
  return Boolean(pendingImageAssignmentDraft && isSameImageTarget(pendingImageAssignmentDraft.target, target));
}

function saveImageReferencePicker() {
  if (!pendingImageReferencePicker) return;
  const selected = findImageEntryById(pendingImageReferencePicker.selectedImageId);
  if (!selected) return;
  const imageRaw = `ImageID(${selected.id})`;
  const { target } = pendingImageReferencePicker;
  pendingImageReferencePicker = null;

  switch (target.kind) {
    case "menuEntry": {
      const menu = model.menus?.find(candidate => candidate.id === target.menuId);
      const entry = menu?.entries?.[target.entryIndex];
      if (!menu || !entry || typeof entry.source?.line !== "number" || entry.kind !== "MenuItem") return;
      post({
        type: "updateMenuEntry",
        menuId: menu.id,
        sourceLine: entry.source.line,
        kind: entry.kind,
        idRaw: entry.idRaw,
        textRaw: entry.textRaw ?? (entry.text !== undefined ? toPbString(entry.text) : undefined),
        shortcut: entry.shortcut,
        iconRaw: imageRaw
      });
      break;
    }
    case "toolBarEntry": {
      const toolBar = model.toolbars?.find(candidate => candidate.id === target.toolBarId);
      const entry = toolBar?.entries?.[target.entryIndex];
      if (!toolBar || !entry || typeof entry.source?.line !== "number" || entry.kind !== "ToolBarImageButton") return;
      post({
        type: "updateToolBarEntry",
        toolBarId: toolBar.id,
        sourceLine: entry.source.line,
        kind: entry.kind,
        idRaw: entry.idRaw,
        iconRaw: imageRaw,
        toggle: entry.toggle
      });
      break;
    }
    case "statusBarField": {
      const statusBar = model.statusbars?.find(candidate => candidate.id === target.statusBarId);
      const field = statusBar?.fields?.[target.fieldIndex];
      if (!statusBar || !field || typeof field.source?.line !== "number") return;
      post({
        type: "updateStatusBarField",
        statusBarId: statusBar.id,
        sourceLine: field.source.line,
        widthRaw: field.widthRaw,
        imageRaw,
      });
      break;
    }
    case "gadget": {
      const gadget = model.gadgets.find(candidate => candidate.id === target.gadgetId);
      if (!gadget) return;
      gadget.imageRaw = imageRaw;
      gadget.imageId = selected.id;
      post({
        type: "setGadgetImageRaw",
        id: gadget.id,
        imageRaw
      });
      break;
    }
  }

  renderProps();
}

function saveImageAssignmentDraft() {
  if (!pendingImageAssignmentDraft) return;
  const draft = pendingImageAssignmentDraft;
  const idRaw = draft.idRaw.trim();
  if (!idRaw.length) return;

  let assignedVar: string | undefined;
  if (idRaw.toLowerCase() === "#pb_any") {
    const trimmedAssigned = draft.assignedVar.trim();
    if (!trimmedAssigned.length) {
      alert("#PB_Any requires an assigned variable name.");
      return;
    }
    assignedVar = trimmedAssigned;
  }

  const imageRaw = draft.imageRaw.trim();
  if (draft.mode === "create" && !imageRaw.length) return;

  const reference = buildCreatedImageReference(idRaw, assignedVar);
  if (!reference) {
    alert("#PB_Any requires an assigned variable name.");
    return;
  }

  pendingImageAssignmentDraft = null;

  const target = draft.target;

  switch (target.kind) {
    case "menuEntry": {
      const menu = model.menus?.find(candidate => candidate.id === target.menuId);
      const entry = menu?.entries?.[target.entryIndex];
      if (!menu || !entry || typeof entry.source?.line !== "number" || entry.kind !== "MenuItem") return;
      if (draft.mode === "create") {
        post({
          type: "createAndAssignMenuEntryImage",
          menuId: menu.id,
          sourceLine: entry.source.line,
          kind: entry.kind,
          idRaw: entry.idRaw,
          textRaw: entry.textRaw ?? (entry.text !== undefined ? toPbString(entry.text) : undefined),
          shortcut: entry.shortcut,
          newInline: draft.inline,
          newImageIdRaw: idRaw,
          newImageRaw: imageRaw,
          newAssignedVar: assignedVar,
        });
      }
      else {
        post({
          type: "chooseFileAndAssignMenuEntryImage",
          menuId: menu.id,
          sourceLine: entry.source.line,
          kind: entry.kind,
          idRaw: entry.idRaw,
          textRaw: entry.textRaw ?? (entry.text !== undefined ? toPbString(entry.text) : undefined),
          shortcut: entry.shortcut,
          newImageIdRaw: idRaw,
          newAssignedVar: assignedVar,
        });
      }
      break;
    }
    case "toolBarEntry": {
      const toolBar = model.toolbars?.find(candidate => candidate.id === target.toolBarId);
      const entry = toolBar?.entries?.[target.entryIndex];
      if (!toolBar || !entry || typeof entry.source?.line !== "number" || entry.kind !== "ToolBarImageButton") return;
      if (draft.mode === "create") {
        post({
          type: "createAndAssignToolBarEntryImage",
          toolBarId: toolBar.id,
          sourceLine: entry.source.line,
          kind: entry.kind,
          idRaw: entry.idRaw,
          toggle: entry.toggle,
          newInline: draft.inline,
          newImageIdRaw: idRaw,
          newImageRaw: imageRaw,
          newAssignedVar: assignedVar,
        });
      }
      else {
        post({
          type: "chooseFileAndAssignToolBarEntryImage",
          toolBarId: toolBar.id,
          sourceLine: entry.source.line,
          kind: entry.kind,
          idRaw: entry.idRaw,
          toggle: entry.toggle,
          newImageIdRaw: idRaw,
          newAssignedVar: assignedVar,
        });
      }
      break;
    }
    case "statusBarField": {
      const statusBar = model.statusbars?.find(candidate => candidate.id === target.statusBarId);
      const field = statusBar?.fields?.[target.fieldIndex];
      if (!statusBar || !field || typeof field.source?.line !== "number") return;
      if (draft.mode === "create") {
        post({
          type: "createAndAssignStatusBarFieldImage",
          statusBarId: statusBar.id,
          sourceLine: field.source.line,
          widthRaw: field.widthRaw,
          newInline: draft.inline,
          newImageIdRaw: idRaw,
          newImageRaw: imageRaw,
          newAssignedVar: assignedVar,
        });
      }
      else {
        post({
          type: "chooseFileAndAssignStatusBarFieldImage",
          statusBarId: statusBar.id,
          sourceLine: field.source.line,
          widthRaw: field.widthRaw,
          newImageIdRaw: idRaw,
          newAssignedVar: assignedVar,
        });
      }
      break;
    }
    case "gadget": {
      const gadget = model.gadgets.find(candidate => candidate.id === target.gadgetId);
      if (!gadget) return;
      gadget.imageRaw = reference.imageRaw;
      gadget.imageId = reference.imageId;
      if (draft.mode === "create") {
        post({
          type: "createAndAssignGadgetImage",
          id: gadget.id,
          newInline: draft.inline,
          newImageIdRaw: idRaw,
          newImageRaw: imageRaw,
          newAssignedVar: assignedVar,
        });
      }
      else {
        post({
          type: "chooseFileAndAssignGadgetImage",
          id: gadget.id,
          x: gadget.x,
          y: gadget.y,
          resizeToImage: draft.resizeToImage,
          newImageIdRaw: idRaw,
          newAssignedVar: assignedVar,
        });
      }
      break;
    }
  }

  renderProps();
}


function buildPendingMenuEntrySelection(
  menu: MenuModel,
  sourceEntryIndex: number,
  targetSourceLine: number,
  placement: MenuEntryMovePlacement
): PendingMenuEntrySelection | null {
  const sourceEntry = menu.entries?.[sourceEntryIndex];
  if (!sourceEntry) return null;

  const targetEntryIndex = (menu.entries ?? []).findIndex(entry => entry.source?.line === targetSourceLine);
  if (targetEntryIndex < 0) return null;

  const preferredIndex = getPredictedMenuEntryMoveIndex(menu, sourceEntryIndex, targetEntryIndex, placement);
  if (preferredIndex === null) return null;

  return {
    menuId: menu.id,
    preferredIndex,
    kind: sourceEntry.kind,
    level: getMenuEntryLevel(sourceEntry),
    idRaw: sourceEntry.idRaw,
    textRaw: sourceEntry.textRaw,
    shortcut: sourceEntry.shortcut,
    iconRaw: sourceEntry.iconRaw
  };
}

function drawMenuFlyoutPanelPreview(
  ctx: CanvasRenderingContext2D,
  menu: MenuModel,
  parentIndex: number,
  panelRect: PreviewRect,
  fg: string,
  border: string,
  itemHover: string
): void {
  const childIndices = getDirectMenuChildIndices(menu, parentIndex);
  if (panelRect.w <= 0 || panelRect.h <= 0) return;

  const bg = getCssVar("--vscode-menu-background")
    || getCssVar("--vscode-sideBar-background")
    || getCssVar("--vscode-editor-background")
    || "rgba(255,255,255,0.96)";

  ctx.save();
  ctx.fillStyle = bg;
  ctx.globalAlpha = 0.96;
  ctx.fillRect(panelRect.x, panelRect.y, panelRect.w, panelRect.h);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = border;
  ctx.strokeRect(panelRect.x + 0.5, panelRect.y + 0.5, panelRect.w - 1, panelRect.h - 1);
  ctx.restore();

  let posY = panelRect.y;
  for (const childIndex of childIndices) {
    const entry = menu.entries[childIndex];
    if (entry.kind === "MenuBar") {
      menuEntryPreviewRects.push({ ownerId: menu.id, index: childIndex, x: panelRect.x, y: posY, w: panelRect.w, h: 12 });
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = border;
      ctx.beginPath();
      ctx.moveTo(panelRect.x + 0.5, posY + 6.5);
      ctx.lineTo(panelRect.x + panelRect.w - 0.5, posY + 6.5);
      ctx.stroke();
      ctx.restore();
      posY += 12;
      continue;
    }

    const entryRect: PreviewEntryRect = { ownerId: menu.id, index: childIndex, x: panelRect.x, y: posY, w: panelRect.w, h: 20 };
    menuEntryPreviewRects.push(entryRect);

    ctx.save();
    ctx.fillStyle = itemHover;
    ctx.globalAlpha = 0.08;
    ctx.fillRect(entryRect.x + 1, entryRect.y + 1, Math.max(0, entryRect.w - 2), Math.max(0, entryRect.h - 2));
    ctx.restore();

    if (entry.iconId || entry.iconRaw) {
      ctx.save();
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(entryRect.x + 6, entryRect.y + 5, 10, 10);
      ctx.restore();
    }

    const label = getMenuPreviewLabel(entry);
    ctx.fillStyle = fg;
    ctx.fillText(label, entryRect.x + 24, entryRect.y + 14);

    if (entry.shortcut) {
      const shortcutWidth = Math.ceil(ctx.measureText(entry.shortcut).width);
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = fg;
      ctx.fillText(entry.shortcut, entryRect.x + entryRect.w - 10 - shortcutWidth, entryRect.y + 14);
      ctx.restore();
    }

    if (getDirectMenuChildIndices(menu, childIndex).length) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(entryRect.x + entryRect.w - 16, entryRect.y + 6);
      ctx.lineTo(entryRect.x + entryRect.w - 10, entryRect.y + 10);
      ctx.lineTo(entryRect.x + entryRect.w - 16, entryRect.y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    posY += 20;
  }

  const footerRect: PreviewMenuFooterRect = { menuId: menu.id, parentIndex, x: panelRect.x, y: posY, w: panelRect.w, h: 20 };
  menuFooterPreviewRects.push(footerRect);

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = fg;
  ctx.fillText("Add Item...", footerRect.x + 5, footerRect.y + 14);
  ctx.restore();
}

function drawMenuBarPreview(ctx: CanvasRenderingContext2D, rect: PreviewRect, fg: string) {
  const menu = getPrimaryMenu();
  menuEntryPreviewRects = [];
  menuFooterPreviewRects = [];
  menuAddPreviewRect = null;
  if (!menu || rect.h <= 0 || rect.w <= 0) return;

  const bg = getCssVar("--vscode-menubar-selectionBackground") || getCssVar("--vscode-titleBar-activeBackground") || getCssVar("--vscode-editor-background") || "transparent";
  const border = getCssVar("--vscode-panel-border") || fg;
  const itemHover = getCssVar("--vscode-toolbar-hoverBackground") || getCssVar("--vscode-list-hoverBackground") || "rgba(127,127,127,0.15)";

  ctx.save();
  ctx.fillStyle = bg;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = border;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  ctx.restore();

  let x = rect.x + 7;
  const baseline = rect.y + Math.min(rect.h - 6, 15);
  for (const [entryIndex, entry] of menu.entries.entries()) {
    if (getMenuEntryLevel(entry) !== 0) continue;
    if (entry.kind === "MenuBar") {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = border;
      ctx.beginPath();
      ctx.moveTo(x + 2.5, rect.y + 4);
      ctx.lineTo(x + 2.5, rect.y + rect.h - 4);
      ctx.stroke();
      ctx.restore();
      x += 9;
      continue;
    }

    const label = getMenuPreviewLabel(entry);
    if (!label.length) continue;
    const itemW = Math.max(24, Math.ceil(ctx.measureText(label).width) + 14);
    menuEntryPreviewRects.push({ ownerId: menu.id, index: entryIndex, x, y: rect.y + 2, w: itemW, h: Math.max(0, rect.h - 4) });

    ctx.save();
    ctx.fillStyle = itemHover;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(x, rect.y + 2, itemW, Math.max(0, rect.h - 4));
    ctx.restore();

    ctx.fillStyle = fg;
    ctx.fillText(label, x + 7, baseline);
    x += itemW + 3;
    if (x >= rect.x + rect.w - 20) break;
  }

  const addRectX = Math.min(Math.max(rect.x + 6, x), Math.max(rect.x + 6, rect.x + rect.w - 20));
  const addRect: PreviewMenuAddRect = {
    menuId: menu.id,
    x: addRectX,
    y: rect.y + Math.max(2, Math.trunc((rect.h - 16) / 2)),
    w: 16,
    h: 16
  };
  menuAddPreviewRect = addRect;

  ctx.save();
  ctx.strokeStyle = border;
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(addRect.x + 0.5, addRect.y + 0.5, addRect.w - 1, addRect.h - 1);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = fg;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(addRect.x + 4.5, addRect.y + 8.5);
  ctx.lineTo(addRect.x + 11.5, addRect.y + 8.5);
  ctx.moveTo(addRect.x + 8.5, addRect.y + 4.5);
  ctx.lineTo(addRect.x + 8.5, addRect.y + 11.5);
  ctx.stroke();
  ctx.restore();

  if (!selection || selection.kind !== "menuEntry" || selection.menuId !== menu.id) {
    return;
  }

  const chain = getMenuAncestorChain(menu, selection.entryIndex);
  if (!chain.length) return;

  let previousPanelRect: PreviewRect | null = null;
  for (const parentIndex of chain) {
    const parentRect = getMenuEntryRect(menuEntryPreviewRects, menu.id, parentIndex);
    if (!parentRect) continue;

    const anchorRect: PreviewRect = previousPanelRect
      ? { x: previousPanelRect.x + previousPanelRect.w, y: parentRect.y, w: 0, h: 0 }
      : { x: parentRect.x, y: rect.y + rect.h - 2, w: 0, h: 0 };

    const panelRect = getMenuFlyoutPanelRect(menu, parentIndex, anchorRect, (label) => ctx.measureText(label).width);
    if (!panelRect) continue;
    drawMenuFlyoutPanelPreview(ctx, menu, parentIndex, panelRect, fg, border, itemHover);
    previousPanelRect = panelRect;
  }
}

function drawToolBarPreview(ctx: CanvasRenderingContext2D, rect: PreviewRect, fg: string) {
  const toolbar = getPrimaryToolbar();
  toolBarEntryPreviewRects = [];
  toolBarAddPreviewRect = null;
  if (!toolbar || rect.h <= 0 || rect.w <= 0) return;

  const bg = getCssVar("--vscode-sideBar-background") || getCssVar("--vscode-editor-background") || "transparent";
  const border = getCssVar("--vscode-panel-border") || fg;
  const buttonBg = getCssVar("--vscode-button-secondaryBackground") || getCssVar("--vscode-toolbar-hoverBackground") || "rgba(127,127,127,0.15)";

  ctx.save();
  ctx.fillStyle = bg;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = border;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  ctx.restore();

  let x = rect.x + 6;
  const y = rect.y + Math.max(3, Math.trunc((rect.h - 16) / 2));
  for (const [entryIndex, entry] of toolbar.entries.entries()) {
    if (entry.kind === "ToolBarToolTip") continue;
    if (entry.kind === "ToolBarSeparator") {
      toolBarEntryPreviewRects.push({ ownerId: toolbar.id, index: entryIndex, x, y, w: 6, h: 16 });
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = border;
      ctx.beginPath();
      ctx.moveTo(x + 2.5, y);
      ctx.lineTo(x + 2.5, y + 16);
      ctx.stroke();
      ctx.restore();
      x += 10;
      continue;
    }

    toolBarEntryPreviewRects.push({ ownerId: toolbar.id, index: entryIndex, x, y, w: 16, h: 16 });

    ctx.save();
    ctx.fillStyle = buttonBg;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(x, y, 16, 16);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = border;
    ctx.strokeRect(x + 0.5, y + 0.5, 15, 15);
    ctx.restore();

    if (entry.iconId || entry.iconRaw) {
      ctx.save();
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x + 4, y + 4, 8, 8);
      ctx.restore();
    } else {
      const label = ((entry.text ?? entry.idRaw ?? entry.kind).replace(/^#/, "").trim().slice(0, 1) || "•").toUpperCase();
      ctx.fillStyle = fg;
      ctx.fillText(label, x + 4, y + 12);
    }

    x += 22;
    if (x >= rect.x + rect.w - 18) break;
  }

  const addRectX = Math.min(Math.max(rect.x + 6, x), Math.max(rect.x + 6, rect.x + rect.w - 20));
  const addRect: PreviewToolBarAddRect = {
    toolBarId: toolbar.id,
    x: addRectX,
    y,
    w: 16,
    h: 16
  };
  toolBarAddPreviewRect = addRect;

  ctx.save();
  ctx.strokeStyle = border;
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(addRect.x + 0.5, addRect.y + 0.5, addRect.w - 1, addRect.h - 1);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = fg;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(addRect.x + 4.5, addRect.y + 8.5);
  ctx.lineTo(addRect.x + 11.5, addRect.y + 8.5);
  ctx.moveTo(addRect.x + 8.5, addRect.y + 4.5);
  ctx.lineTo(addRect.x + 8.5, addRect.y + 11.5);
  ctx.stroke();
  ctx.restore();
}


function drawStatusBarPreview(ctx: CanvasRenderingContext2D, rect: PreviewRect, fg: string) {
  const statusbar = getPrimaryStatusbar();
  statusBarFieldPreviewRects = [];
  statusBarAddPreviewRect = null;
  if (!statusbar || rect.h <= 0 || rect.w <= 0) return;

  const bg = getCssVar("--vscode-statusBar-background") || getCssVar("--vscode-sideBar-background") || getCssVar("--vscode-editor-background") || "transparent";
  const border = getCssVar("--vscode-panel-border") || fg;
  const accent = getCssVar("--vscode-progressBar-background") || fg;

  ctx.save();
  ctx.fillStyle = bg;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = border;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  ctx.restore();

  const fieldWidths = getStatusBarFieldWidths(statusbar, rect.w);

  let x = rect.x;
  const imageY = rect.y + 4;
  for (let i = 0; i < statusbar.fields.length; i++) {
    const field = statusbar.fields[i];
    const fieldW = fieldWidths[i] ?? 18;
    statusBarFieldPreviewRects.push({ ownerId: statusbar.id, index: i, x, y: rect.y + 1, w: Math.max(0, fieldW), h: Math.max(0, rect.h - 2) });

    if (i > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = border;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, rect.y + 1);
      ctx.lineTo(x + 0.5, rect.y + rect.h - 2);
      ctx.stroke();
      ctx.restore();
    }

    const textLabel = (field.text ?? unquotePbString(field.textRaw)).trim();
    if (textLabel.length) {
      ctx.fillStyle = fg;
      const textWidth = Math.ceil(ctx.measureText(textLabel).width);
      const textX = getStatusBarAlignedX(x, fieldW, textWidth, hasPbFlag(field.flagsRaw, "#PB_StatusBar_Center"), hasPbFlag(field.flagsRaw, "#PB_StatusBar_Right"));
      ctx.fillText(textLabel, textX, rect.y + Math.min(rect.h - 6, 15));
    } else if (field.progressBar) {
      const progressMetrics = getStatusBarProgressPreviewMetrics(fieldW, rect.h, field.progressRaw ?? "0");
      const trackX = x + 2;
      const trackY = rect.y + Math.max(3, Math.trunc((rect.h - progressMetrics.trackHeight) / 2));
      ctx.save();
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.14;
      ctx.fillRect(trackX, trackY, progressMetrics.trackWidth, progressMetrics.trackHeight);
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.4;
      ctx.strokeRect(trackX + 0.5, trackY + 0.5, progressMetrics.trackWidth - 1, progressMetrics.trackHeight - 1);
      ctx.strokeStyle = border;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(trackX + 1, trackY + progressMetrics.trackHeight - 0.5);
      ctx.lineTo(trackX + progressMetrics.trackWidth - 1, trackY + progressMetrics.trackHeight - 0.5);
      ctx.stroke();
      if (progressMetrics.fillWidth > 0) {
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.78;
        ctx.fillRect(trackX + 1, trackY + 1, progressMetrics.fillWidth, Math.max(2, progressMetrics.trackHeight - 2));
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.55;
      const size = Math.max(10, Math.min(16, rect.h - 8));
      const imageX = getStatusBarAlignedX(x, fieldW, size, hasPbFlag(field.flagsRaw, "#PB_StatusBar_Center"), hasPbFlag(field.flagsRaw, "#PB_StatusBar_Right"));
      ctx.fillRect(imageX, imageY, size, size);
      ctx.restore();
    }

    x += fieldW;
    if (x >= rect.x + rect.w) break;
  }

  const addRect: PreviewStatusBarAddRect = {
    statusBarId: statusbar.id,
    x,
    y: rect.y + Math.max(0, Math.trunc((rect.h - 16) / 2)),
    w: 16,
    h: 16
  };
  statusBarAddPreviewRect = addRect;

  ctx.save();
  ctx.strokeStyle = border;
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(addRect.x + 0.5, addRect.y + 0.5, addRect.w - 1, addRect.h - 1);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = fg;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(addRect.x + 4.5, addRect.y + 8.5);
  ctx.lineTo(addRect.x + 11.5, addRect.y + 8.5);
  ctx.moveTo(addRect.x + 8.5, addRect.y + 4.5);
  ctx.lineTo(addRect.x + 8.5, addRect.y + 11.5);
  ctx.stroke();
  ctx.restore();
}

function render() {
  menuEntryPreviewRects = [];
  menuFooterPreviewRects = [];
  menuAddPreviewRect = null;
  toolBarAddPreviewRect = null;
  statusBarAddPreviewRect = null;
  toolBarEntryPreviewRects = [];
  statusBarFieldPreviewRects = [];

  const ctx = canvas.getContext("2d")!;
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const fg = getComputedStyle(document.body).color;
  const focus = getCssVar("--vscode-focusBorder") || fg;

  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.lineWidth = 1;

  const wr = getWinRect();
  if (!wr) return;

  const winX = wr.x;
  const winY = wr.y;
  const winW = wr.w;
  const winH = wr.h;
  const winTitle = wr.title;
  const tbH = wr.tbH;

  // Outside dim (PB-like)
  if (settings.outsideDimOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(settings.outsideDimOpacity, 0, 1);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();
  }

  // Window fill (so the window area is visually separated)
  if (settings.windowFillOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(settings.windowFillOpacity, 0, 1);
    ctx.fillStyle = fg;
    ctx.fillRect(winX, winY, winW, winH);
    ctx.restore();
  } else {
    // Ensure window area is not dimmed by outside fill
    ctx.clearRect(winX, winY, winW, winH);
  }

  const chromeMetrics = previewChromeMetrics;
  const localChromeLayout = getWindowLocalChromeLayout(chromeMetrics);
  const globalChromeLayout = getWindowGlobalChromeLayout(chromeMetrics);
  const windowContentRect = localChromeLayout.contentRect;
  const menuBarRect = globalChromeLayout?.menuBarRect ?? null;
  const toolBarRect = globalChromeLayout?.toolBarRect ?? null;
  const statusBarRect = globalChromeLayout?.statusBarRect ?? null;

  // Grid only inside the client/content area.
  if (settings.showGrid) {
    drawGrid(
      ctx,
      winX + windowContentRect.x,
      winY + windowContentRect.y,
      windowContentRect.w,
      windowContentRect.h,
      settings.gridSize,
      settings.gridOpacity,
      settings.gridMode,
      fg
    );
  }

  // Optional title bar
  if (tbH > 0) {
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = focus;
    ctx.fillRect(winX, winY, winW, tbH);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = focus;
    ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, tbH - 1);
    ctx.restore();

    ctx.fillStyle = fg;
    ctx.fillText(winTitle, winX + 8, winY + Math.min(tbH - 8, 18));
  }

  if (menuBarRect) {
    drawMenuBarPreview(ctx, menuBarRect, fg);
    if (selection?.kind === "menu" && selection.id === getPrimaryMenu()?.id) {
      ctx.save();
      ctx.strokeStyle = focus;
      ctx.lineWidth = 2;
      ctx.strokeRect(menuBarRect.x + 0.5, menuBarRect.y + 0.5, menuBarRect.w - 1, menuBarRect.h - 1);
      ctx.restore();
    }
    if (selection?.kind === "menuEntry") {
      const sel = selection;
      const entryRect = menuEntryPreviewRects.find(entry => entry.ownerId === sel.menuId && entry.index === sel.entryIndex);
      if (entryRect) {
        ctx.save();
        ctx.strokeStyle = focus;
        ctx.lineWidth = 2;
        ctx.strokeRect(entryRect.x + 0.5, entryRect.y + 0.5, entryRect.w - 1, entryRect.h - 1);
        ctx.restore();
      }
    }

    if (drag?.target === "menuEntry" && drag.moved && drag.moveTarget) {
      const indicatorColor = getCssVar("--vscode-editorInfo-foreground") || "#0000ff";
      const indicator = drag.moveTarget.indicatorRect;
      ctx.save();
      ctx.strokeStyle = indicatorColor;
      ctx.lineWidth = 2;
      if (drag.moveTarget.indicatorOrientation === "vertical") {
        const x = indicator.x + Math.max(0, Math.trunc(indicator.w / 2));
        ctx.beginPath();
        ctx.moveTo(x + 0.5, indicator.y);
        ctx.lineTo(x + 0.5, indicator.y + indicator.h);
        ctx.stroke();
      } else {
        const y = indicator.y + Math.max(0, Math.trunc(indicator.h / 2));
        ctx.beginPath();
        ctx.moveTo(indicator.x, y + 0.5);
        ctx.lineTo(indicator.x + indicator.w, y + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  if (toolBarRect) {
    drawToolBarPreview(ctx, toolBarRect, fg);
    if (selection?.kind === "toolbar" && selection.id === getPrimaryToolbar()?.id) {
      ctx.save();
      ctx.strokeStyle = focus;
      ctx.lineWidth = 2;
      ctx.strokeRect(toolBarRect.x + 0.5, toolBarRect.y + 0.5, toolBarRect.w - 1, toolBarRect.h - 1);
      ctx.restore();
    }
    if (selection?.kind === "toolBarEntry") {
      const sel = selection;
      const entryRect = toolBarEntryPreviewRects.find(entry => entry.ownerId === sel.toolBarId && entry.index === sel.entryIndex);
      if (entryRect) {
        ctx.save();
        ctx.strokeStyle = focus;
        ctx.lineWidth = 2;
        ctx.strokeRect(entryRect.x + 0.5, entryRect.y + 0.5, entryRect.w - 1, entryRect.h - 1);
        ctx.restore();
      }
    }
  }

  if (statusBarRect) {
    drawStatusBarPreview(ctx, statusBarRect, fg);
    if (selection?.kind === "statusbar" && selection.id === getPrimaryStatusbar()?.id) {
      ctx.save();
      ctx.strokeStyle = focus;
      ctx.lineWidth = 2;
      ctx.strokeRect(statusBarRect.x + 0.5, statusBarRect.y + 0.5, statusBarRect.w - 1, statusBarRect.h - 1);
      ctx.restore();
    }
    if (selection?.kind === "statusBarField") {
      const sel = selection;
      const fieldRect = statusBarFieldPreviewRects.find(entry => entry.ownerId === sel.statusBarId && entry.index === sel.fieldIndex);
      if (fieldRect) {
        ctx.save();
        ctx.strokeStyle = focus;
        ctx.lineWidth = 2;
        ctx.strokeRect(fieldRect.x + 0.5, fieldRect.y + 0.5, fieldRect.w - 1, fieldRect.h - 1);
        ctx.restore();
      }
    }
  }

  // Window border
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = focus;
  ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);
  ctx.restore();

  // Window selection overlay
  if (selection?.kind === "window") {
    ctx.save();
    ctx.strokeStyle = focus;
    ctx.lineWidth = 2;
    ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);
    ctx.restore();

    drawHandles(ctx, winX, winY, winW, winH, focus);
  }

  const layoutCache = new Map<string, GadgetPreviewLayout>();

  // Gadgets (offset by window origin)
  for (const g of model.gadgets) {
    const layout = getGadgetPreviewLayout(g, chromeMetrics, layoutCache);
    if (!layout.visible) continue;

    const gx = winX + layout.rect.x;
    const gy = winY + layout.rect.y;
    const gw = layout.rect.w;
    const gh = layout.rect.h;
    const clipX = winX + layout.clip.x;
    const clipY = winY + layout.clip.y;

    ctx.strokeStyle = fg;
    ctx.fillStyle = fg;
    ctx.lineWidth = 1;

    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, clipY, layout.clip.w, layout.clip.h);
    ctx.clip();

    let labelY = gy + 14;

    switch (g.kind) {
      case "ContainerGadget":
        drawContainerChrome(ctx, gx, gy, gw, gh, fg);
        break;

      case "PanelGadget":
        drawPanelChrome(ctx, g, gx, gy, gw, gh, fg, chromeMetrics);
        labelY = gy + Math.min(gh - 8, chromeMetrics.panelHeight + 14);
        break;

      case "ScrollAreaGadget":
        drawScrollAreaChrome(ctx, g, gx, gy, gw, gh, fg, chromeMetrics);
        break;

      case "SplitterGadget":
        drawSplitterChrome(ctx, g, gx, gy, gw, gh, fg, chromeMetrics);
        break;

      default:
        ctx.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
        break;
    }

    ctx.fillText(`${g.kind} ${g.id}`, gx + 4, labelY);
    ctx.restore();

    const sel = selection;
    if (sel && sel.kind === "gadget" && g.id === sel.id) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, clipY, layout.clip.w, layout.clip.h);
      ctx.clip();
      ctx.strokeStyle = focus;
      ctx.lineWidth = 2;
      ctx.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, clipY, layout.clip.w, layout.clip.h);
      ctx.clip();
      drawHandles(ctx, gx, gy, gw, gh, focus);
      ctx.restore();
    }
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  size: number,
  opacity: number,
  mode: GridMode,
  color: string
) {
  if (size < 2) return;

  ctx.save();
  ctx.globalAlpha = clamp(opacity, 0, 1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;

  if (mode === "lines") {
    ctx.beginPath();
    for (let x = 0; x <= w; x += size) {
      ctx.moveTo(ox + x + 0.5, oy);
      ctx.lineTo(ox + x + 0.5, oy + h);
    }
    for (let y = 0; y <= h; y += size) {
      ctx.moveTo(ox, oy + y + 0.5);
      ctx.lineTo(ox + w, oy + y + 0.5);
    }
    ctx.stroke();
  } else {
    const r = 1;
    const maxDots = 350_000;
    let dots = 0;

    for (let y = 0; y <= h; y += size) {
      for (let x = 0; x <= w; x += size) {
        ctx.fillRect(ox + x - r, oy + y - r, r * 2, r * 2);
        dots++;
        if (dots >= maxDots) break;
      }
      if (dots >= maxDots) break;
    }
  }

  ctx.restore();
}

function drawHandles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string) {
  const s = HANDLE_SIZE;
  const hs = s / 2;

  const pts: Array<[number, number]> = [
    [x, y],
    [x + w / 2, y],
    [x + w, y],
    [x, y + h / 2],
    [x + w, y + h / 2],
    [x, y + h],
    [x + w / 2, y + h],
    [x + w, y + h],
  ];

  const fill = getCssVar("--vscode-editor-background") || "transparent";

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;

  for (const [px, py] of pts) {
    const rx = Math.round(px - hs) + 0.5;
    const ry = Math.round(py - hs) + 0.5;
    ctx.fillRect(rx, ry, s, s);
    ctx.strokeRect(rx, ry, s, s);
  }

  ctx.restore();
}

function renderList() {
  listEl.innerHTML = "";

  type Node = {
    kind: "window" | "gadget" | "menu" | "menuEntry" | "toolbar" | "toolBarEntry" | "statusbar" | "statusBarField" | "images" | "image";
    id: string;
    label: string;
    selectable: boolean;
    children: Node[];
  };

  const keyOf = (n: Node) => `${n.kind}:${n.id}`;

  const isSel = (n: Node): boolean => {
    const sel = selection;
    if (!sel) return false;
    if (n.kind === "window") return sel.kind === "window";
    if (n.kind === "gadget") return sel.kind === "gadget" && sel.id === n.id;
    if (n.kind === "menu") return sel.kind === "menu" && sel.id === n.id;
    if (n.kind === "menuEntry") return sel.kind === "menuEntry" && `${sel.menuId}:${sel.entryIndex}` === n.id;
    if (n.kind === "toolbar") return sel.kind === "toolbar" && sel.id === n.id;
    if (n.kind === "toolBarEntry") return sel.kind === "toolBarEntry" && `${sel.toolBarId}:${sel.entryIndex}` === n.id;
    if (n.kind === "statusbar") return sel.kind === "statusbar" && sel.id === n.id;
    if (n.kind === "statusBarField") return sel.kind === "statusBarField" && `${sel.statusBarId}:${sel.fieldIndex}` === n.id;
    if (n.kind === "images") return sel.kind === "images";
    if (n.kind === "image") return sel.kind === "image" && sel.id === n.id;
    return false;
  };

  const gadgetMap = new Map<string, Gadget>();
  const childrenMap = new Map<string, string[]>();
  for (const g of model.gadgets) {
    gadgetMap.set(g.id, g);
    const p = g.parentId ?? "__root__";
    if (!childrenMap.has(p)) childrenMap.set(p, []);
    childrenMap.get(p)!.push(g.id);
  }

  const gadgetNode = (id: string): Node => {
    const g = gadgetMap.get(id)!;
    const kids = childrenMap.get(id) ?? [];

    const itemsCnt = g.items?.length ?? 0;
    const colsCnt = g.columns?.length ?? 0;
    const tab = typeof g.parentItem === "number" ? `  tab:${g.parentItem}` : "";
    const extra = `${itemsCnt ? `  items:${itemsCnt}` : ""}${colsCnt ? `  cols:${colsCnt}` : ""}${tab}`;

    return {
      kind: "gadget",
      id,
      label: `${g.kind}  ${g.id}${extra}`,
      selectable: true,
      children: kids.map(gadgetNode)
    };
  };

  const menuNodes: Node[] = (model.menus ?? []).map(m => {
    const entries = (m.entries ?? []).map((e, idx) => {
      const prefix = " ".repeat(Math.max(0, (e.level ?? 0)) * 2);
      const text = e.text ?? e.textRaw ?? "";
      const idPart = e.idRaw ? ` ${e.idRaw}` : "";
      return {
        kind: "menuEntry" as const,
        id: `${m.id}:${idx}`,
        label: `${prefix}${e.kind}${idPart}${text ? `  ${text}` : ""}`,
        selectable: true,
        children: []
      };
    });

    return {
      kind: "menu" as const,
      id: m.id,
      label: `Menu  ${m.id}  entries:${m.entries?.length ?? 0}`,
      selectable: true,
      children: entries
    };
  });

  const toolbarNodes: Node[] = (model.toolbars ?? []).map(t => {
    const entries = (t.entries ?? []).flatMap((e, idx) => {
      if (!shouldShowToolBarStructureEntry(t, idx)) return [];
      const text = e.text ?? e.textRaw ?? "";
      const idPart = e.idRaw ? ` ${e.idRaw}` : "";
      return [{
        kind: "toolBarEntry" as const,
        id: `${t.id}:${idx}`,
        label: `${e.kind}${idPart}${text ? `  ${text}` : ""}${e.iconRaw ? `  ${e.iconRaw}` : ""}`,
        selectable: true,
        children: []
      }];
    });

    return {
      kind: "toolbar" as const,
      id: t.id,
      label: `ToolBar  ${t.id}  entries:${getVisibleToolBarEntryCount(t)}`,
      selectable: true,
      children: entries
    };
  });

  const statusbarNodes: Node[] = (model.statusbars ?? []).map(sb => {
    const fields = (sb.fields ?? []).map((f, idx) => ({
      kind: "statusBarField" as const,
      id: `${sb.id}:${idx}`,
      label: `Field  ${idx}  width:${f.widthRaw}`,
      selectable: true,
      children: []
    }));

    return {
      kind: "statusbar" as const,
      id: sb.id,
      label: `StatusBar  ${sb.id}  fields:${sb.fields?.length ?? 0}`,
      selectable: true,
      children: fields
    };
  });

  const imageNodes: Node[] = [{
    kind: "images" as const,
    id: "images",
    label: `Images  entries:${model.images?.length ?? 0}`,
    selectable: true,
    children: (model.images ?? []).map((img) => ({
      kind: "image" as const,
      id: img.id,
      label: `${img.pbAny && img.variable ? `${img.variable} = ` : ""}${img.inline ? "CatchImage" : "LoadImage"}  ${img.firstParam}  ${img.imageRaw}  refs:${countImageUsages(img.id)}`,
      selectable: true,
      children: []
    }))
  }];

  const roots: Node[] = [];
  if (model.window) {
    roots.push({ kind: "window", id: model.window.id, label: `Window  ${model.window.id}`, selectable: true, children: [] });
  }

  const gadgetRoots = (childrenMap.get("__root__") ?? []).map(gadgetNode);
  roots.push(...gadgetRoots);

  // Attach non-visual structures under the window node (if present)
  if (roots.length > 0 && roots[0].kind === "window") {
    const win = roots[0];
    win.children = [...imageNodes, ...menuNodes, ...toolbarNodes, ...statusbarNodes];
  } else {
    roots.push(...imageNodes, ...menuNodes, ...toolbarNodes, ...statusbarNodes);
  }

  const ensureExpanded = (n: Node) => {
    const k = keyOf(n);
    if (!expanded.has(k)) {
      // Expand container gadgets and the window by default.
      const defaultExpanded = n.kind === "window"
        || n.kind === "menu"
        || n.kind === "toolbar"
        || n.kind === "statusbar"
        || (n.kind === "gadget" && CONTAINER_KINDS.has(gadgetMap.get(n.id)?.kind ?? ""));
      expanded.set(k, defaultExpanded);
    }
    return expanded.get(k)!;
  };

  const renderNode = (n: Node, depth: number) => {
    const div = document.createElement("div");
    div.className = "treeItem" + (isSel(n) ? " sel" : "");
    div.style.paddingLeft = `${8 + depth * 14}px`;

    const twisty = document.createElement("div");
    twisty.className = "twisty";

    const hasKids = n.children.length > 0;
    const isOpen = hasKids ? ensureExpanded(n) : false;
    twisty.textContent = hasKids ? (isOpen ? "▾" : "▸") : "";

    twisty.onclick = (ev) => {
      ev.stopPropagation();
      if (!hasKids) return;
      expanded.set(keyOf(n), !isOpen);
      renderListAndParentSelector();
    };

    const label = document.createElement("div");
    label.textContent = n.label;

    div.appendChild(twisty);
    div.appendChild(label);

    div.onclick = () => {
      if (!n.selectable) return;
      if (n.kind === "window") selection = { kind: "window" };
      else if (n.kind === "gadget") {
        selection = { kind: "gadget", id: n.id };
        const syncedPanelItems = syncPanelActiveItemsForSelection(panelActiveItems, model.gadgets, n.id);
        panelActiveItems.clear();
        syncedPanelItems.forEach((item, panelId) => panelActiveItems.set(panelId, item));
      }
      else if (n.kind === "menu") selection = { kind: "menu", id: n.id };
      else if (n.kind === "menuEntry") {
        const [menuId, entryIndexRaw] = n.id.split(":");
        selection = { kind: "menuEntry", menuId, entryIndex: Number(entryIndexRaw) };
      }
      else if (n.kind === "toolbar") selection = { kind: "toolbar", id: n.id };
      else if (n.kind === "toolBarEntry") {
        const [toolBarId, entryIndexRaw] = n.id.split(":");
        selection = { kind: "toolBarEntry", toolBarId, entryIndex: Number(entryIndexRaw) };
      }
      else if (n.kind === "statusbar") selection = { kind: "statusbar", id: n.id };
      else if (n.kind === "statusBarField") {
        const [statusBarId, fieldIndexRaw] = n.id.split(":");
        selection = { kind: "statusBarField", statusBarId, fieldIndex: Number(fieldIndexRaw) };
      }
      else if (n.kind === "images") selection = { kind: "images" };
      else if (n.kind === "image") selection = { kind: "image", id: n.id };
      render();
      renderListAndParentSelector();
      renderProps();
    };

    listEl.appendChild(div);

    if (hasKids && isOpen) {
      for (const c of n.children) {
        renderNode(c, depth + 1);
      }
    }
  };

  for (const n of roots) {
    renderNode(n, 0);
  }
}

function renderParentSelector() {
  if (!parentSelEl) return;

  const parentMap = new Map<string, string | undefined>();
  for (const g of model.gadgets) parentMap.set(g.id, g.parentId);

  const depthOf = (id: string): number => {
    let depth = 0;
    let cur = parentMap.get(id);
    const seen = new Set<string>();
    while (cur && !seen.has(cur) && depth < 40) {
      seen.add(cur);
      depth++;
      cur = parentMap.get(cur);
    }
    return depth;
  };

  const opts: Array<{ value: string; label: string }> = [];
  if (model.window) {
    opts.push({ value: "window", label: `Window  ${model.window.id}` });
  }

  const containers = model.gadgets
    .filter(g => CONTAINER_KINDS.has(g.kind))
    .sort((a, b) => depthOf(a.id) - depthOf(b.id));

  for (const g of containers) {
    const depth = depthOf(g.id);
    const pad = " ".repeat(depth * 2);
    opts.push({ value: `gadget:${g.id}`, label: `${pad}${g.kind}  ${g.id}` });
  }

  const computeCurrent = (): string => {
    const sel = selection;
    if (!sel) return opts[0]?.value ?? "window";
    if (sel.kind === "window") return "window";
    if (sel.kind === "gadget") {
      const g = model.gadgets.find(x => x.id === sel.id);
      if (g?.parentId) return `gadget:${g.parentId}`;
      return "window";
    }
    return "window";
  };

  const current = computeCurrent();

  parentSelEl.onchange = () => {
    const v = parentSelEl.value;
    if (v === "window") {
      selection = { kind: "window" };
    } else if (v.startsWith("gadget:")) {
      const id = v.slice("gadget:".length);
      selection = { kind: "gadget", id };
    }
    renderSelectionUiWithParentSelector();
  };

  parentSelEl.innerHTML = "";
  for (const o of opts) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    parentSelEl.appendChild(opt);
  }

  if (opts.some(o => o.value === current)) {
    parentSelEl.value = current;
  } else if (opts.length) {
    parentSelEl.value = opts[0].value;
  }
}

function getEditableSplitterState(g: Gadget): number {
  if (typeof g.state === "number" && Number.isFinite(g.state)) {
    return Math.trunc(g.state);
  }

  const metrics = previewChromeMetrics;
  const vertical = hasPbFlag(g.flagsExpr, "#PB_Splitter_Vertical");
  const range = Math.max(0, (vertical ? g.w : g.h) - metrics.splitterWidth);
  return Math.trunc(range / 2);
}

function renderProps() {
  propsEl.innerHTML = "";
  renderInfoPanel();

  const section = (title: string) => {
    const h = document.createElement("div");
    h.className = "subHeader";
    h.textContent = title;
    return h;
  };

  const sel = selection;
  if (!sel) {
    return;
  }

  const toPbString = (v: string): string => {
    const esc = (v ?? "").replace(/"/g, '""');
    return `"${esc}"`;
  };

  const miniList = () => {
    const d = document.createElement("div");
    d.className = "miniList";
    return d;
  };

  const miniRow = (
    label: string,
    onEdit?: () => void,
    onDelete?: () => void,
    ...extras: { label: string; onClick?: () => void; disabled?: boolean; title?: string }[]
  ) => {
    const r = document.createElement("div");
    r.className = "miniRow";

    const l = document.createElement("div");
    l.textContent = label;
    r.appendChild(l);

    const actions: ({ label: string; onClick?: () => void; disabled?: boolean; title?: string } | undefined)[] = [
      { label: "Edit", onClick: onEdit, disabled: !onEdit },
      { label: "Del", onClick: onDelete, disabled: !onDelete },
      ...extras,
    ];

    for (const action of actions) {
      const button = document.createElement("button");
      button.textContent = action?.label ?? "";
      button.disabled = !action || Boolean(action.disabled) || !action.onClick;
      button.hidden = !action;
      button.title = action?.title ?? "";
      button.onclick = () => action?.onClick?.();
      r.appendChild(button);
    }

    return r;
  };

  const createPendingDestructiveActionEl = () => {
    if (!pendingDestructiveAction) return null;

    const wrap = document.createElement("div");
    wrap.appendChild(section("Confirm Action"));
    wrap.appendChild(mutedNote(pendingDestructiveAction.message));

    const actions = document.createElement("div");
    actions.className = "miniActions";

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = pendingDestructiveAction.confirmLabel;
    confirmBtn.onclick = () => confirmDestructiveAction();

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => closeDestructiveAction();

    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    wrap.appendChild(actions);
    return wrap;
  };

  if (sel.kind === "window") {
    if (!model.window) {
      propsEl.innerHTML = "<div class='muted'>No window</div>";
      return;
    }

    const win = model.window;
    const variableName = (win.variable ?? win.firstParam.replace(/^#/, "")).trim() || "Window_0";
    const enumSymbol = variableName ? `#${variableName.trim()}` : "#Window_0";
    const knownFlags = new Set(win.knownFlags ?? []);
    const customFlagsValue = (win.customFlags ?? []).join(" | ");

    propsEl.appendChild(section("Properties"));
    propsEl.appendChild(row("#PB_Any", checkboxInput(win.pbAny, v => {
      vscode.postMessage({
        type: "toggleWindowPbAny",
        windowKey: win.id,
        toPbAny: v,
        variableName,
        enumSymbol,
        enumValueRaw: win.enumValueRaw
      });
    })));

    propsEl.appendChild(row("Variable", textInput(variableName, v => {
      const parsed = parseWindowVariableNameInspectorInput(v, variableName);
      if (!parsed.ok) {
        clearInfoError();
        renderProps();
        return;
      }
      vscode.postMessage({
        type: "setWindowVariableName",
        variableName: parsed.value
      });
    })));

    propsEl.appendChild(row(
      "Caption is a variable?",
      checkboxInput(Boolean(win.captionVariable), checked => {
        if (!model.window) return;
        if (checked && !ensureValidPbVariableReference((win.title ?? "").trim())) {
          renderProps();
          return;
        }
        clearInfoError();
        win.captionVariable = checked;
        const nextCaptionRaw = buildWindowCaptionRaw(win.title ?? "", checked);
        win.captionRaw = nextCaptionRaw;
        postWindowOpenArgs(win, { captionRaw: nextCaptionRaw });
        renderProps();
      })
    ));

    propsEl.appendChild(row(
      "Caption",
      textInput(win.title ?? "", v => {
        if (!model.window) return;
        if (Boolean(win.captionVariable) && !ensureValidPbVariableReference(v.trim())) {
          renderProps();
          return;
        }
        clearInfoError();
        win.title = v;
        const nextCaptionRaw = buildWindowCaptionRaw(v, Boolean(win.captionVariable));
        win.captionRaw = nextCaptionRaw;
        postWindowOpenArgs(win, { captionRaw: nextCaptionRaw });
      })
    ));

    if (!win.pbAny) {
      propsEl.appendChild(row("Enum Value", textInput(win.enumValueRaw ?? "", v => {
        vscode.postMessage({
          type: "setWindowEnumValue",
          enumSymbol,
          enumValueRaw: v.trim().length ? v.trim() : undefined
        });
      })));
    }

    propsEl.appendChild(section("Layout"));
    propsEl.appendChild(row("X", textInput(getWindowPositionInspectorValue(win.xRaw, win.x), v => {
      if (!model.window) return;
      postWindowPositionRaw(win, "x", v);
    }, { title: `Use integers or ${WINDOW_POSITION_IGNORE_LITERAL} like the original PureBasic Property Grid.` })));
    propsEl.appendChild(row("Y", textInput(getWindowPositionInspectorValue(win.yRaw, win.y), v => {
      if (!model.window) return;
      postWindowPositionRaw(win, "y", v);
    }, { title: `Use integers or ${WINDOW_POSITION_IGNORE_LITERAL} like the original PureBasic Property Grid.` })));
    propsEl.appendChild(row("Width", numberInput(win.w, v => { if (!model.window) return; win.w = asInt(v); postWindowRect(); render(); renderProps(); })));
    propsEl.appendChild(row("Height", numberInput(win.h, v => { if (!model.window) return; win.h = asInt(v); postWindowRect(); render(); renderProps(); })));
    propsEl.appendChild(row("Hidden", checkboxInput(Boolean(win.hiddenRaw), checked => {
      if (!model.window) return;
      win.hiddenRaw = checked ? (win.hiddenRaw?.trim() || "1") : "";
      postWindowProperties(win, { hiddenRaw: checked ? (win.hiddenRaw?.trim() || "1") : "" });
      renderProps();
    })));
    propsEl.appendChild(row("Disabled", checkboxInput(Boolean(win.disabledRaw), checked => {
      if (!model.window) return;
      win.disabledRaw = checked ? (win.disabledRaw?.trim() || "1") : "";
      postWindowProperties(win, { disabledRaw: checked ? (win.disabledRaw?.trim() || "1") : "" });
      renderProps();
    })));
    propsEl.appendChild(row("Parent", textInput(win.parentRaw ?? win.parent ?? "", v => {
      if (!model.window) return;
      const trimmed = v.trim();
      win.parentRaw = trimmed || undefined;
      postWindowOpenArgs(win, { parentRaw: trimmed || "" });
    })));
    const windowColorInput = textInput(win.colorRaw ?? "", v => {
      if (!model.window) return;
      const parsed = parseWindowColorInspectorInput(v);
      if (!parsed.ok) {
        setInfoError(WINDOW_COLOR_LITERAL_ERROR_MESSAGE);
        return;
      }
      clearInfoError();
      win.colorRaw = parsed.raw;
      win.color = parsed.previewColor;
      postWindowProperties(win, { colorRaw: parsed.raw ?? "" });
      renderProps();
    }, { title: "Matches the original window Color cell. Typed edits accept only RGB(r,g,b) or $hex literals." });
    const windowColorPicker = document.createElement("input");
    windowColorPicker.type = "color";
    windowColorPicker.value = pbColorNumberToCssHex(win.color) ?? "#000000";
    windowColorPicker.title = "Matches the original ColorRequester-backed window Color cell and writes an RGB(...) literal.";
    windowColorPicker.onchange = () => {
      if (!model.window) return;
      const nextColorRaw = cssHexToPbRgbRaw(windowColorPicker.value);
      if (!nextColorRaw) return;
      const parsedColor = parseWindowColorInspectorInput(nextColorRaw);
      clearInfoError();
      win.colorRaw = nextColorRaw;
      if (parsedColor.ok) {
        win.color = parsedColor.previewColor;
      }
      postWindowProperties(win, { colorRaw: nextColorRaw });
      renderProps();
    };
    const clearWindowColorBtn = document.createElement("button");
    clearWindowColorBtn.textContent = "Remove";
    clearWindowColorBtn.disabled = !(win.colorRaw?.trim() || typeof win.color === "number");
    clearWindowColorBtn.title = clearWindowColorBtn.disabled
      ? "No SetWindowColor value is currently set."
      : "Matches the original #Menu_RemoveColor action and removes the SetWindowColor line.";
    clearWindowColorBtn.onclick = () => {
      if (!model.window) return;
      clearInfoError();
      win.colorRaw = undefined;
      win.color = undefined;
      postWindowProperties(win, { colorRaw: "" });
      renderProps();
    };
    propsEl.appendChild(row("Color", inputWithActions(windowColorInput, windowColorPicker, clearWindowColorBtn)));
    propsEl.appendChild(mutedNote("The original window Color row uses a color picker and a separate remove action; typed edits are limited to RGB(...) or $hex literals, the picker writes RGB(...), and Remove clears the SetWindowColor line."));
    const hasEventGadgetBlock = Boolean(win.hasEventGadgetBlock);
    const windowEventProcHint = hasEventGadgetBlock ? "" : EVENT_UI_HINT.eventGadgetMissing;
    const hasEventMenuBlockForLoop = Boolean(win.hasEventMenuBlock);
    const hasEventGadgetCasesForLoop = Boolean(win.hasEventGadgetCaseBranches);
    const canDisableGenerateEventLoop = !hasEventMenuBlockForLoop && !hasEventGadgetCasesForLoop;
    const generateEventLoopDisableHint = getGenerateEventLoopDisableHint(win);
    propsEl.appendChild(row(
      "Generate events procedure?",
      checkboxInput(
        Boolean(win.generateEventLoop),
        v => {
          if (!model.window) return;
          if (!v && Boolean(win.generateEventLoop) && !canDisableGenerateEventLoop) return;
          win.generateEventLoop = v;
          if (!v) {
            if (!win.hasEventMenuBlock) win.hasEventGadgetBlock = false;
            if (!win.hasEventMenuBlock) win.hasEventGadgetCaseBranches = false;
          } else {
            win.hasEventGadgetBlock = true;
          }
          post({ type: "setWindowGenerateEventLoop", windowKey: win.id, enabled: v });
          renderProps();
        },
        {
          disabled: Boolean(win.generateEventLoop) && !canDisableGenerateEventLoop,
          title: Boolean(win.generateEventLoop) && !canDisableGenerateEventLoop ? generateEventLoopDisableHint : ""
        }
      )
    ));
    propsEl.appendChild(row(
      "SelectProc",
      editableComboInput(
        win.eventProc ?? "",
        getProcedureSuggestions(),
        v => {
          if (!model.window || !hasEventGadgetBlock) return;
          const trimmed = v.trim();
          win.eventProc = trimmed || undefined;
          post({ type: "setWindowEventProc", windowKey: win.id, eventProc: trimmed.length ? trimmed : undefined });
          renderProps();
        },
        {
          disabled: !hasEventGadgetBlock,
          title: windowEventProcHint || "Matches the original editable SelectProc combo box; suggestions come from readable Procedure definitions.",
          placeholder: "Type or pick a procedure"
        }
      )
    ));
    if (!hasEventGadgetBlock) {
      propsEl.appendChild(mutedNote(windowEventProcHint));
    }
    if (Boolean(win.generateEventLoop) && !canDisableGenerateEventLoop) {
      propsEl.appendChild(mutedNote(generateEventLoopDisableHint));
    }

    propsEl.appendChild(createSubSection("Event File"));
    const eventFileInput = textInput(
      win.eventFile ?? "",
      v => {
        if (!model.window) return;
        const trimmed = v.trim();
        win.eventFile = trimmed || undefined;
        post({ type: "setWindowEventFile", windowKey: win.id, eventFile: trimmed.length ? toPbString(trimmed) : undefined });
        renderProps();
      },
      {
        title: "Auxiliary XIncludeFile patch path. The original PureBasic Property Grid does not expose Event File as a normal row.",
        placeholder: "events/form-events.pbi"
      }
    );
    const removeEventFileBtn = document.createElement("button");
    removeEventFileBtn.textContent = "Remove";
    removeEventFileBtn.disabled = !Boolean(win.eventFile?.trim());
    removeEventFileBtn.title = removeEventFileBtn.disabled
      ? "No auxiliary XIncludeFile is currently set."
      : "Matches the original #Menu_RemoveEventFile popup action and removes the auxiliary XIncludeFile line.";
    removeEventFileBtn.onclick = () => {
      if (!model.window || !win.eventFile?.trim()) return;
      win.eventFile = undefined;
      post({ type: "setWindowEventFile", windowKey: win.id, eventFile: undefined });
      renderProps();
    };
    propsEl.appendChild(row("XIncludeFile", inputWithActions(eventFileInput, removeEventFileBtn)));
    propsEl.appendChild(mutedNote("Event File stays available as an auxiliary XIncludeFile path, but it is intentionally separated from the original SelectProc property row. The explicit Remove action mirrors the original #Menu_RemoveEventFile popup path."));

    propsEl.appendChild(section("Constants"));
    for (const flag of PBFD_SYMBOLS.windowKnownFlags ?? []) {
      propsEl.appendChild(row(
        flag,
        checkboxInput(knownFlags.has(flag), checked => {
          if (!model.window) return;
          const nextKnown = new Set(model.window.knownFlags ?? []);
          if (checked) nextKnown.add(flag);
          else nextKnown.delete(flag);
          model.window.knownFlags = (PBFD_SYMBOLS.windowKnownFlags ?? []).filter(entry => nextKnown.has(entry));
          const nextExpr = buildWindowFlagsExpr(model.window.knownFlags, (model.window.customFlags ?? []).join(" | "));
          model.window.flagsExpr = nextExpr;
          postWindowOpenArgs(model.window, { flagsExpr: nextExpr ?? "" });
          renderProps();
        })
      ));
    }
    propsEl.appendChild(row(
      "Custom Flags",
      textInput(customFlagsValue, v => {
        if (!model.window) return;
        model.window.customFlags = parseWindowCustomFlagsInput(v);
        const nextExpr = buildWindowFlagsExpr(model.window.knownFlags ?? [], v);
        model.window.flagsExpr = nextExpr;
        postWindowOpenArgs(model.window, { flagsExpr: nextExpr ?? "" });
      }, { placeholder: "#PB_Window_CustomFlagA | #PB_Window_CustomFlagB" })
    ));
    return;
  }

  if (sel.kind === "menu" || sel.kind === "menuEntry") {
    const menuId = sel.kind === "menu" ? sel.id : sel.menuId;
    const selectedEntryIndex = sel.kind === "menuEntry" ? sel.entryIndex : undefined;
    const m = (model.menus ?? []).find(x => x.id === menuId);
    if (!m) {
      propsEl.innerHTML = "<div class='muted'>Menu not found</div>";
      return;
    }

    const showMenuRootInspector = sel.kind === "menu";
    const hasEventMenuBlock = Boolean(model.window?.hasEventMenuBlock);
    const hasEntriesWithoutEventIds = (m.entries ?? []).some(e => !e.idRaw);
    if (showMenuRootInspector) {
      propsEl.appendChild(row("Id", readonlyInput(m.id)));
      propsEl.appendChild(row("Entries", readonlyInput(String(m.entries?.length ?? 0))));
      if (!hasEventMenuBlock) {
        propsEl.appendChild(mutedNote(EVENT_UI_HINT.eventMenuMissing));
      }
      if (hasEntriesWithoutEventIds) {
        propsEl.appendChild(mutedNote(EVENT_UI_HINT.menuIdRequired));
      }
    }

    const selectedEntry = sel.kind === "menuEntry" && typeof selectedEntryIndex === "number"
      ? m.entries?.[selectedEntryIndex]
      : undefined;
    if (selectedEntry) {
      const selectedCanPatch = typeof selectedEntry.source?.line === "number";
      const selectedCanEditId = selectedCanPatch && selectedEntry.kind === "MenuItem";
      const selectedCanEditName = selectedCanPatch && (selectedEntry.kind === "MenuItem" || selectedEntry.kind === "MenuTitle" || selectedEntry.kind === "OpenSubMenu");
      const selectedCanEditShortcut = selectedCanPatch && selectedEntry.kind === "MenuItem";
      const selectedCanEditImage = selectedCanPatch && selectedEntry.kind === "MenuItem";
      const selectedCanEditEvent = Boolean(selectedEntry.idRaw) && hasEventMenuBlock;
      const selectedImage = findImageEntryById(selectedEntry.iconId);
      const selectedImageTitle = getImageReferenceHint(selectedEntry.iconId, "menu");
      const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);
      const postSelectedMenuUpdate = (updates: { idRaw?: string; textRaw?: string; shortcut?: string; iconRaw?: string }) => {
        if (!selectedCanPatch || typeof selectedEntry.source?.line !== "number") return;
        if (selectedEntry.kind === "MenuItem") {
          const nextIdRaw = hasOwn(updates, "idRaw") ? updates.idRaw : (selectedEntry.idRaw ?? "");
          const nextTextRaw = hasOwn(updates, "textRaw") ? updates.textRaw : (selectedEntry.textRaw ?? (selectedEntry.text !== undefined ? toPbString(selectedEntry.text) : '""'));
          const nextShortcut = hasOwn(updates, "shortcut") ? updates.shortcut : selectedEntry.shortcut;
          const nextIconRaw = hasOwn(updates, "iconRaw") ? updates.iconRaw : selectedEntry.iconRaw;
          post({
            type: "updateMenuEntry",
            menuId: m.id,
            sourceLine: selectedEntry.source.line,
            kind: selectedEntry.kind,
            idRaw: nextIdRaw,
            textRaw: nextTextRaw,
            shortcut: nextShortcut,
            iconRaw: nextIconRaw,
          });
          return;
        }

        if (selectedEntry.kind === "MenuTitle" || selectedEntry.kind === "OpenSubMenu") {
          const nextTextRaw = hasOwn(updates, "textRaw") ? updates.textRaw : (selectedEntry.textRaw ?? (selectedEntry.text !== undefined ? toPbString(selectedEntry.text) : '""'));
          post({
            type: "updateMenuEntry",
            menuId: m.id,
            sourceLine: selectedEntry.source.line,
            kind: selectedEntry.kind,
            textRaw: nextTextRaw,
          });
        }
      };
      const selectedImageActions = document.createElement("div");
      selectedImageActions.className = "row-actions";
      const selectedUseExistingBtn = document.createElement("button");
      selectedUseExistingBtn.textContent = "Use Existing";
      selectedUseExistingBtn.disabled = !selectedCanEditImage;
      selectedUseExistingBtn.title = selectedCanEditImage
        ? "Select an image from the form image list and assign it to this menu entry."
        : "Only MenuItem supports a parsed image argument.";
      selectedUseExistingBtn.onclick = () => {
        if (!selectedCanEditImage) return;
        openImageReferencePicker({ kind: "menuEntry", menuId: m.id, entryIndex: selectedEntryIndex! }, selectedEntry.iconId);
      };
      selectedImageActions.appendChild(selectedUseExistingBtn);
      const selectedChooseFileBtn = document.createElement("button");
      selectedChooseFileBtn.textContent = "Choose File";
      selectedChooseFileBtn.disabled = !selectedCanEditImage;
      selectedChooseFileBtn.title = selectedCanEditImage
        ? "Select a file, create a new LoadImage entry and assign it to this menu entry."
        : "Only MenuItem supports a parsed image argument.";
      selectedChooseFileBtn.onclick = () => {
        if (!selectedCanEditImage || typeof selectedEntry.source?.line !== "number") return;
        openImageAssignmentDraft({ kind: "menuEntry", menuId: m.id, entryIndex: selectedEntryIndex! }, "chooseFile");
      };
      selectedImageActions.appendChild(selectedChooseFileBtn);
      const selectedCreateNewBtn = document.createElement("button");
      selectedCreateNewBtn.textContent = "Create New";
      selectedCreateNewBtn.disabled = !selectedCanEditImage;
      selectedCreateNewBtn.title = selectedCanEditImage
        ? "Create a new form image entry and assign it to this menu entry."
        : "Only MenuItem supports a parsed image argument.";
      selectedCreateNewBtn.onclick = () => {
        if (!selectedCanEditImage || typeof selectedEntry.source?.line !== "number") return;
        openImageAssignmentDraft({ kind: "menuEntry", menuId: m.id, entryIndex: selectedEntryIndex! }, "create");
      };
      selectedImageActions.appendChild(selectedCreateNewBtn);
      const selectedClearBtn = document.createElement("button");
      selectedClearBtn.textContent = "Clear";
      selectedClearBtn.disabled = !selectedCanEditImage;
      selectedClearBtn.title = selectedCanEditImage
        ? "Remove the parsed image reference from this menu entry."
        : "Only MenuItem supports a parsed image argument.";
      selectedClearBtn.onclick = () => {
        if (!selectedCanEditImage) return;
        postSelectedMenuUpdate({ iconRaw: "" });
      };
      selectedImageActions.appendChild(selectedClearBtn);
      if (selectedImage) {
        const selectedJumpImageBtn = document.createElement("button");
        selectedJumpImageBtn.textContent = "Image";
        selectedJumpImageBtn.title = selectedImageTitle;
        selectedJumpImageBtn.onclick = () => selectImageById(selectedImage.id);
        selectedImageActions.appendChild(selectedJumpImageBtn);
      }

      propsEl.appendChild(section("Selected Entry"));
      propsEl.appendChild(row(
        "Constant",
        textInput(
          selectedEntry.idRaw ?? "",
          v => {
            if (!selectedCanEditId) return;
            postSelectedMenuUpdate({ idRaw: v.trim() });
          },
          {
            disabled: !selectedCanEditId,
            title: selectedEntry.kind === "MenuItem"
              ? "Patch the raw MenuItem id token for the selected entry."
              : "Only MenuItem exposes an editable constant in the current parsed model."
          }
        )
      ));
      propsEl.appendChild(row(
        "Name",
        textInput(
          selectedEntry.text ?? "",
          v => {
            if (!selectedCanEditName) return;
            postSelectedMenuUpdate({ textRaw: toPbString(v) });
          },
          {
            disabled: !selectedCanEditName,
            title: selectedCanEditName
              ? "Patch the menu caption/title for the selected entry."
              : "MenuBar and CloseSubMenu are structural entries without an editable name field."
          }
        )
      ));
      propsEl.appendChild(row(
        "Shortcut",
        textInput(
          selectedEntry.shortcut ?? "",
          v => {
            if (!selectedCanEditShortcut) return;
            postSelectedMenuUpdate({ shortcut: v.trim() || undefined });
          },
          {
            disabled: !selectedCanEditShortcut,
            title: selectedEntry.kind === "MenuItem"
              ? "Patch the optional MenuItem shortcut suffix."
              : "Only MenuItem supports the parsed shortcut field."
          }
        )
      ));
      propsEl.appendChild(row(
        "Separator",
        checkboxInput(
          selectedEntry.kind === "MenuBar",
          () => {},
          { disabled: true, title: "Menu separators are represented structurally as MenuBar entries in the parsed model." }
        )
      ));
      propsEl.appendChild(row(
        "CurrentImage",
        readonlyInput(selectedImage?.image ?? selectedImage?.imageRaw ?? selectedEntry.iconRaw ?? "")
      ));
      propsEl.appendChild(row("ChangeImage", selectedImageActions));
      if (isImageReferencePickerOpenFor({ kind: "menuEntry", menuId: m.id, entryIndex: selectedEntryIndex! })) {
        const pendingEl = createPendingImageReferencePickerEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
      if (isImageAssignmentDraftOpenFor({ kind: "menuEntry", menuId: m.id, entryIndex: selectedEntryIndex! })) {
        const pendingEl = createPendingImageAssignmentDraftEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
      propsEl.appendChild(row(
        "SelectProc",
        editableComboInput(
          selectedEntry.event ?? "",
          getProcedureSuggestions(),
          v => {
            if (!selectedEntry.idRaw) return;
            post({
              type: "setMenuEntryEvent",
              entryIdRaw: selectedEntry.idRaw,
              eventProc: v.trim().length ? v.trim() : undefined
            });
          },
          {
            disabled: !selectedCanEditEvent,
            title: getEventMenuEntryHint(hasEventMenuBlock, selectedEntry.idRaw, "menu")
          }
        )
      ));

      const selectedDeleteMenuEntryBtn = document.createElement("button");
      selectedDeleteMenuEntryBtn.textContent = "Delete Entry";
      selectedDeleteMenuEntryBtn.disabled = typeof selectedEntry.source?.line !== "number";
      selectedDeleteMenuEntryBtn.title = selectedDeleteMenuEntryBtn.disabled
        ? "Only parsed menu entries with a source line can be deleted."
        : "Delete the currently selected menu entry.";
      selectedDeleteMenuEntryBtn.onclick = () => {
        if (typeof selectedEntry.source?.line !== "number") return;
        openDestructiveAction(
          {
            kind: "deleteMenuEntry",
            menuId: m.id,
            entryIndex: selectedEntryIndex!,
            sourceLine: selectedEntry.source.line,
            entryKind: selectedEntry.kind,
            message: `Delete the selected ${selectedEntry.kind} entry from menu '${m.id}'?`,
            confirmLabel: "Delete Entry"
          },
          { kind: "menuEntry", menuId: m.id, entryIndex: selectedEntryIndex! }
        );
      };
      propsEl.appendChild(row("Delete", selectedDeleteMenuEntryBtn));
    }

    const box = miniList();
    for (const [entryIndex, e] of (m.entries ?? []).entries()) {
      const prefix = " ".repeat(Math.max(0, (e.level ?? 0)) * 2);
      const text = e.text ?? e.textRaw ?? "";
      const idPart = e.idRaw ? ` ${e.idRaw}` : "";
      const eventPart = e.event ? `  -> ${e.event}` : "";
      const line = `${prefix}${e.kind}${idPart}${text ? `  ${text}` : ""}${eventPart}`;

      const canPatch = typeof e.source?.line === "number";
      const editFn = canPatch
        ? () => {
            setSelectionAndRefresh({ kind: "menuEntry", menuId: m.id, entryIndex });
          }
        : undefined;

      const delFn = canPatch
        ? () => {
            openDestructiveAction(
              {
                kind: "deleteMenuEntry",
                menuId: m.id,
                entryIndex,
                sourceLine: e.source!.line,
                entryKind: e.kind,
                message: `Delete the selected ${e.kind} entry from menu '${m.id}'?`,
                confirmLabel: "Delete Entry"
              },
              { kind: "menuEntry", menuId: m.id, entryIndex }
            );
          }
        : undefined;

      const eventFn = e.idRaw && hasEventMenuBlock && e.kind !== "ToolBarToolTip"
        ? () => {
            setSelectionAndRefresh({ kind: "menuEntry", menuId: m.id, entryIndex });
          }
        : undefined;
      const menuEventTitle = getEventMenuEntryHint(hasEventMenuBlock, e.idRaw, "menu");
      const menuImage = findImageEntryById(e.iconId);
      const menuImageTitle = getImageReferenceHint(e.iconId, "menu");

      const menuSetImageFn = e.kind === "MenuItem" && canPatch
        ? () => {
            setSelectionAndRefresh({ kind: "menuEntry", menuId: m.id, entryIndex });
          }
        : undefined;
      const menuPickImageFn = e.kind === "MenuItem" && canPatch
        ? () => {
            openImageReferencePicker({ kind: "menuEntry", menuId: m.id, entryIndex }, e.iconId);
          }
        : undefined;
      const menuChooseFileImageFn = e.kind === "MenuItem" && canPatch
        ? () => {
            openImageAssignmentDraft({ kind: "menuEntry", menuId: m.id, entryIndex }, "chooseFile");
          }
        : undefined;
      const menuCreateImageFn = e.kind === "MenuItem" && canPatch
        ? () => {
            openImageAssignmentDraft({ kind: "menuEntry", menuId: m.id, entryIndex }, "create");
          }
        : undefined;

      const rowEl = miniRow(
        line,
        editFn,
        delFn,
        { label: "Event", onClick: eventFn, disabled: !eventFn, title: menuEventTitle },
        { label: "Set Image", onClick: menuSetImageFn, disabled: !menuSetImageFn, title: e.kind === "MenuItem" ? "Patch the raw MenuItem image argument." : "Only MenuItem supports a parsed image argument." },
        { label: "Use Existing", onClick: menuPickImageFn, disabled: !menuPickImageFn, title: e.kind === "MenuItem" ? "Select an image from the form image list." : "Only MenuItem supports a parsed image argument." },
        { label: "Choose File", onClick: menuChooseFileImageFn, disabled: !menuChooseFileImageFn, title: e.kind === "MenuItem" ? "Select a file, create a new LoadImage entry and assign it to this menu item." : "Only MenuItem supports a parsed image argument." },
        { label: "Create New", onClick: menuCreateImageFn, disabled: !menuCreateImageFn, title: e.kind === "MenuItem" ? "Create a new form image entry and assign it to this menu item." : "Only MenuItem supports a parsed image argument." },
        { label: "Image", onClick: menuImage ? () => selectImageById(menuImage.id) : undefined, disabled: !menuImage, title: menuImageTitle }
      );
      if (selectedEntryIndex === entryIndex) rowEl.classList.add("selected");
      rowEl.onclick = (ev) => {
        if (ev.target instanceof HTMLButtonElement) return;
        setSelectionAndRefresh({ kind: "menuEntry", menuId: m.id, entryIndex });
      };
      box.appendChild(rowEl);
    }
    if (showMenuRootInspector) {
      propsEl.appendChild(section("Structure"));
      propsEl.appendChild(box);

      const addItemBtn = document.createElement("button");
      addItemBtn.textContent = "Add Item";
      addItemBtn.title = "Insert a new MenuItem with default id/text values and continue editing it in the inspector.";
      addItemBtn.onclick = () => {
        postInsertMenuEntry(m, { kind: "MenuItem", idRaw: "#MenuItemNew", textRaw: toPbString("Menu Item") });
      };

      const addTitleBtn = document.createElement("button");
      addTitleBtn.textContent = "Add Title";
      addTitleBtn.title = "Insert a new MenuTitle with a default caption and continue editing it in the inspector.";
      addTitleBtn.onclick = () => {
        postInsertMenuEntry(m, { kind: "MenuTitle", textRaw: toPbString("MenuTitle") });
      };

      const addSubMenuBtn = document.createElement("button");
      addSubMenuBtn.textContent = "Add SubMenu";
      addSubMenuBtn.title = "Insert a new OpenSubMenu entry with a default title and continue editing it in the inspector.";
      addSubMenuBtn.onclick = () => {
        postInsertMenuEntry(m, { kind: "OpenSubMenu", textRaw: toPbString("SubMenu") });
      };

      const addSeparatorBtn = document.createElement("button");
      addSeparatorBtn.textContent = "Add Separator";
      addSeparatorBtn.title = "Insert a new MenuBar separator entry.";
      addSeparatorBtn.onclick = () => {
        postInsertMenuEntry(m, { kind: "MenuBar" });
      };

      const closeBalance = getOpenSubMenuBalance(m);
      const canInsertRootClose = closeBalance > 0;

      const addCloseBtn = document.createElement("button");
      addCloseBtn.textContent = "Add Close";
      addCloseBtn.disabled = !canInsertRootClose;
      addCloseBtn.title = canInsertRootClose
        ? "Insert a new CloseSubMenu entry for the last still-open submenu."
        : "Disabled because the parsed menu currently has no unmatched OpenSubMenu entry.";
      addCloseBtn.onclick = () => {
        if (!canInsertRootClose) return;
        postInsertMenuEntry(m, { kind: "CloseSubMenu" });
      };

      const actions = document.createElement("div");
      actions.className = "miniActions";
      actions.appendChild(addItemBtn);
      actions.appendChild(addTitleBtn);
      actions.appendChild(addSubMenuBtn);
      actions.appendChild(addSeparatorBtn);
      actions.appendChild(addCloseBtn);
      if (sel.kind === "menu") {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete Menu";
        deleteBtn.onclick = () => {
          openDestructiveAction({
            kind: "deleteMenu",
            menuId: m.id,
            message: `Delete menu '${m.id}'?`,
            confirmLabel: "Delete Menu"
          });
        };
        actions.appendChild(deleteBtn);
      }
      propsEl.appendChild(actions);
      if (pendingDestructiveAction?.kind === "deleteMenu" && pendingDestructiveAction.menuId === m.id) {
        const pendingEl = createPendingDestructiveActionEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
    }
    if (selectedEntry
      && pendingDestructiveAction?.kind === "deleteMenuEntry"
      && pendingDestructiveAction.menuId === m.id
      && pendingDestructiveAction.entryIndex === selectedEntryIndex) {
      const pendingEl = createPendingDestructiveActionEl();
      if (pendingEl) propsEl.appendChild(pendingEl);
    }
    return;
  }

  if (sel.kind === "toolbar" || sel.kind === "toolBarEntry") {
    const toolBarId = sel.kind === "toolbar" ? sel.id : sel.toolBarId;
    const selectedEntryIndex = sel.kind === "toolBarEntry" ? sel.entryIndex : undefined;
    const t = (model.toolbars ?? []).find(x => x.id === toolBarId);
    if (!t) {
      propsEl.innerHTML = "<div class='muted'>ToolBar not found</div>";
      return;
    }

    const showToolBarRootInspector = sel.kind === "toolbar";
    const hasEventMenuBlock = Boolean(model.window?.hasEventMenuBlock);
    const hasEntriesWithoutEventIds = (t.entries ?? []).some(e => !e.idRaw);
    if (showToolBarRootInspector) {
      propsEl.appendChild(row("Id", readonlyInput(t.id)));
      propsEl.appendChild(row("Entries", readonlyInput(String(getVisibleToolBarEntryCount(t)))));
      if (!hasEventMenuBlock) {
        propsEl.appendChild(mutedNote(EVENT_UI_HINT.eventMenuMissing));
      }
      if (hasEntriesWithoutEventIds) {
        propsEl.appendChild(mutedNote(EVENT_UI_HINT.toolBarIdRequired));
      }
    }

    const selectedEntry = sel.kind === "toolBarEntry" && typeof selectedEntryIndex === "number"
      ? t.entries?.[selectedEntryIndex]
      : undefined;
    if (selectedEntry) {
      const selectedCanPatch = typeof selectedEntry.source?.line === "number";
      const selectedImage = findImageEntryById(selectedEntry.iconId);
      const canEditSelectedTooltip = selectedCanPatch && canEditToolBarTooltip(selectedEntry) && Boolean(selectedEntry.idRaw);
      const canEditSelectedToggle = selectedCanPatch && selectedEntry.kind === "ToolBarImageButton";
      const canEditSelectedEvent = Boolean(selectedEntry.idRaw) && hasEventMenuBlock && selectedEntry.kind !== "ToolBarToolTip";

      const canEditSelectedImage = selectedCanPatch && selectedEntry.kind === "ToolBarImageButton";
      const selectedImageTitle = getImageReferenceHint(selectedEntry.iconId, "toolbar");
      const selectedImageActions = document.createElement("div");
      selectedImageActions.className = "row-actions";
      const selectedUseExistingBtn = document.createElement("button");
      selectedUseExistingBtn.textContent = "Use Existing";
      selectedUseExistingBtn.disabled = !canEditSelectedImage;
      selectedUseExistingBtn.title = canEditSelectedImage
        ? "Select an image from the form image list and assign it to this toolbar button."
        : "Only ToolBarImageButton supports a parsed image reference.";
      selectedUseExistingBtn.onclick = () => {
        if (!canEditSelectedImage || typeof selectedEntry.source?.line !== "number") return;
        openImageReferencePicker({ kind: "toolBarEntry", toolBarId: t.id, entryIndex: selectedEntryIndex! }, selectedEntry.iconId);
      };
      selectedImageActions.appendChild(selectedUseExistingBtn);
      const selectedChooseFileBtn = document.createElement("button");
      selectedChooseFileBtn.textContent = "Choose File";
      selectedChooseFileBtn.disabled = !canEditSelectedImage;
      selectedChooseFileBtn.title = canEditSelectedImage
        ? "Select a file, create a new LoadImage entry and assign it to this toolbar button."
        : "Only ToolBarImageButton supports a parsed image reference.";
      selectedChooseFileBtn.onclick = () => {
        if (!canEditSelectedImage || typeof selectedEntry.source?.line !== "number") return;
        openImageAssignmentDraft({ kind: "toolBarEntry", toolBarId: t.id, entryIndex: selectedEntryIndex! }, "chooseFile");
      };
      selectedImageActions.appendChild(selectedChooseFileBtn);
      const selectedCreateNewBtn = document.createElement("button");
      selectedCreateNewBtn.textContent = "Create New";
      selectedCreateNewBtn.disabled = !canEditSelectedImage;
      selectedCreateNewBtn.title = canEditSelectedImage
        ? "Create a new form image entry and assign it to this toolbar button."
        : "Only ToolBarImageButton supports a parsed image reference.";
      selectedCreateNewBtn.onclick = () => {
        if (!canEditSelectedImage || typeof selectedEntry.source?.line !== "number") return;
        openImageAssignmentDraft({ kind: "toolBarEntry", toolBarId: t.id, entryIndex: selectedEntryIndex! }, "create");
      };
      selectedImageActions.appendChild(selectedCreateNewBtn);
      const selectedClearBtn = document.createElement("button");
      selectedClearBtn.textContent = "Clear";
      selectedClearBtn.disabled = !canEditSelectedImage;
      selectedClearBtn.title = canEditSelectedImage
        ? "Remove the parsed image reference from this toolbar button."
        : "Only ToolBarImageButton supports a parsed image reference.";
      selectedClearBtn.onclick = () => {
        if (!canEditSelectedImage || typeof selectedEntry.source?.line !== "number") return;
        post({
          type: "updateToolBarEntry",
          toolBarId: t.id,
          sourceLine: selectedEntry.source.line,
          kind: selectedEntry.kind,
          idRaw: selectedEntry.idRaw,
          iconRaw: "",
          toggle: selectedEntry.toggle,
        });
      };
      selectedImageActions.appendChild(selectedClearBtn);
      if (selectedImage) {
        const selectedJumpImageBtn = document.createElement("button");
        selectedJumpImageBtn.textContent = "Image";
        selectedJumpImageBtn.title = selectedImageTitle;
        selectedJumpImageBtn.onclick = () => selectImageById(selectedImage.id);
        selectedImageActions.appendChild(selectedJumpImageBtn);
      }

      const postSelectedToolBarEntryUpdate = (patch: {
        idRaw?: string;
        iconRaw?: string;
        textRaw?: string;
        toggle?: boolean;
      }) => {
        if (!selectedCanPatch || typeof selectedEntry.source?.line !== "number") return;
        post({
          type: "updateToolBarEntry",
          toolBarId: t.id,
          sourceLine: selectedEntry.source.line,
          kind: selectedEntry.kind,
          idRaw: patch.idRaw ?? selectedEntry.idRaw,
          iconRaw: patch.iconRaw ?? selectedEntry.iconRaw,
          textRaw: patch.textRaw ?? selectedEntry.textRaw,
          toggle: patch.toggle ?? selectedEntry.toggle,
        });
      };
      const canEditSelectedId = selectedCanPatch && selectedEntry.kind !== "ToolBarSeparator";
      const canEditSelectedText = selectedCanPatch && (selectedEntry.kind === "ToolBarButton" || selectedEntry.kind === "ToolBarToolTip");
      const canEditSelectedIconRaw = selectedCanPatch && (
        selectedEntry.kind === "ToolBarStandardButton"
        || selectedEntry.kind === "ToolBarButton"
        || selectedEntry.kind === "ToolBarImageButton"
      );

      propsEl.appendChild(section("Selected Entry"));
      propsEl.appendChild(row(
        "Variable",
        textInput(
          selectedEntry.idRaw ?? "",
          v => {
            if (!canEditSelectedId) return;
            postSelectedToolBarEntryUpdate({ idRaw: v.trim() });
          },
          {
            disabled: !canEditSelectedId,
            title: canEditSelectedId
              ? "Patch the raw toolbar button id without using a browser prompt."
              : "Toolbar separators do not expose an editable id field."
          }
        )
      ));
      propsEl.appendChild(row(
        "Text",
        textInput(
          selectedEntry.text ?? "",
          v => {
            if (!canEditSelectedText) return;
            postSelectedToolBarEntryUpdate({ textRaw: v.trim().length ? toPbString(v) : "" });
          },
          {
            disabled: !canEditSelectedText,
            title: canEditSelectedText
              ? "Patch the raw toolbar caption/tooltip text without using a browser prompt."
              : "Only ToolBarButton and ToolBarToolTip expose editable text in the original toolbar structure."
          }
        )
      ));
      propsEl.appendChild(row(
        "IconRaw",
        textInput(
          selectedEntry.iconRaw ?? "",
          v => {
            if (!canEditSelectedIconRaw) return;
            postSelectedToolBarEntryUpdate({ iconRaw: v.trim() });
          },
          {
            disabled: !canEditSelectedIconRaw,
            title: canEditSelectedIconRaw
              ? "Patch the raw toolbar icon argument without using a browser prompt."
              : "Only toolbar button kinds with an icon argument expose this field."
          }
        )
      ));
      propsEl.appendChild(row(
        "Tooltip",
        textInput(
          selectedEntry.tooltip ?? "",
          v => {
            if (!selectedEntry.idRaw || typeof selectedEntry.source?.line !== "number") return;
            post({
              type: "setToolBarEntryTooltip",
              toolBarId: t.id,
              sourceLine: selectedEntry.source.line,
              entryIdRaw: selectedEntry.idRaw,
              textRaw: v.trim().length ? toPbString(v) : ""
            });
          },
          {
            disabled: !canEditSelectedTooltip,
            title: canEditToolBarTooltip(selectedEntry)
              ? "Patch the tooltip linked to this toolbar entry."
              : "Separators and standalone ToolBarToolTip rows do not expose the original toolbar caption field."
          }
        )
      ));
      propsEl.appendChild(row("CurrentImage", readonlyInput(selectedImage?.image ?? selectedImage?.imageRaw ?? selectedEntry.iconRaw ?? "")));
      propsEl.appendChild(row("ChangeImage", selectedImageActions));
      if (isImageReferencePickerOpenFor({ kind: "toolBarEntry", toolBarId: t.id, entryIndex: selectedEntryIndex! })) {
        const pendingEl = createPendingImageReferencePickerEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
      if (isImageAssignmentDraftOpenFor({ kind: "toolBarEntry", toolBarId: t.id, entryIndex: selectedEntryIndex! })) {
        const pendingEl = createPendingImageAssignmentDraftEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
      propsEl.appendChild(row(
        "ToggleButton",
        checkboxInput(
          Boolean(selectedEntry.toggle),
          v => {
            if (selectedEntry.kind !== "ToolBarImageButton" || typeof selectedEntry.source?.line !== "number") return;
            post({
              type: "updateToolBarEntry",
              toolBarId: t.id,
              sourceLine: selectedEntry.source.line,
              kind: selectedEntry.kind,
              idRaw: selectedEntry.idRaw,
              iconRaw: selectedEntry.iconRaw,
              toggle: v,
            });
          },
          {
            disabled: !canEditSelectedToggle,
            title: selectedEntry.kind === "ToolBarImageButton"
              ? "Toggle the #PB_ToolBar_Toggle flag for this toolbar image button."
              : "Only ToolBarImageButton supports the toggle flag."
          }
        )
      ));
      propsEl.appendChild(row(
        "Separator",
        checkboxInput(
          selectedEntry.kind === "ToolBarSeparator",
          () => {},
          { disabled: true, title: "Toolbar separators are structural entries in the original designer." }
        )
      ));
      propsEl.appendChild(row(
        "SelectProc",
        editableComboInput(
          selectedEntry.event ?? "",
          getProcedureSuggestions(),
          v => {
            if (!selectedEntry.idRaw) return;
            post({
              type: "setToolBarEntryEvent",
              entryIdRaw: selectedEntry.idRaw,
              eventProc: v.trim().length ? v.trim() : undefined
            });
          },
          {
            disabled: !canEditSelectedEvent,
            title: getEventMenuEntryHint(hasEventMenuBlock, selectedEntry.idRaw, "toolbar")
          }
        )
      ));

      const selectedDeleteToolBarEntryBtn = document.createElement("button");
      selectedDeleteToolBarEntryBtn.textContent = "Delete Entry";
      selectedDeleteToolBarEntryBtn.disabled = typeof selectedEntry.source?.line !== "number";
      selectedDeleteToolBarEntryBtn.title = selectedDeleteToolBarEntryBtn.disabled
        ? "Only parsed toolbar entries with a source line can be deleted."
        : "Delete the currently selected toolbar entry.";
      selectedDeleteToolBarEntryBtn.onclick = () => {
        if (typeof selectedEntry.source?.line !== "number") return;
        openDestructiveAction(
          {
            kind: "deleteToolBarEntry",
            toolBarId: t.id,
            entryIndex: selectedEntryIndex!,
            sourceLine: selectedEntry.source.line,
            entryKind: selectedEntry.kind,
            message: `Delete the selected ${selectedEntry.kind} entry from toolbar '${t.id}'?`,
            confirmLabel: "Delete Entry"
          },
          { kind: "toolBarEntry", toolBarId: t.id, entryIndex: selectedEntryIndex! }
        );
      };
      propsEl.appendChild(row("Delete", selectedDeleteToolBarEntryBtn));
    }

    const box = miniList();
    for (const [entryIndex, e] of (t.entries ?? []).entries()) {
      if (!shouldShowToolBarStructureEntry(t, entryIndex)) continue;
      const text = e.text ?? e.textRaw ?? "";
      const idPart = e.idRaw ? ` ${e.idRaw}` : "";
      const extra = e.iconRaw ? `  ${e.iconRaw}` : "";
      const tooltipPart = e.kind !== "ToolBarToolTip" && e.tooltip ? `  tooltip:${e.tooltip}` : "";
      const eventPart = e.event ? `  -> ${e.event}` : "";
      const line = `${e.kind}${idPart}${text ? `  ${text}` : ""}${extra}${tooltipPart}${eventPart}`;

      const canPatch = typeof e.source?.line === "number";
      const editFn = canPatch
        ? () => {
            setSelectionAndRefresh({ kind: "toolBarEntry", toolBarId: t.id, entryIndex });
          }
        : undefined;

      const delFn = canPatch
        ? () => {
            openDestructiveAction(
              {
                kind: "deleteToolBarEntry",
                toolBarId: t.id,
                entryIndex,
                sourceLine: e.source!.line,
                entryKind: e.kind,
                message: `Delete the selected ${e.kind} entry from toolbar '${t.id}'?`,
                confirmLabel: "Delete Entry"
              },
              { kind: "toolBarEntry", toolBarId: t.id, entryIndex }
            );
          }
        : undefined;

      const eventFn = e.idRaw && hasEventMenuBlock && e.kind !== "ToolBarToolTip"
        ? () => {
            setSelectionAndRefresh({ kind: "toolBarEntry", toolBarId: t.id, entryIndex });
          }
        : undefined;
      const toolBarTooltipFn = canPatch && canEditToolBarTooltip(e)
        ? () => {
            setSelectionAndRefresh({ kind: "toolBarEntry", toolBarId: t.id, entryIndex });
          }
        : undefined;
      const toolBarEventTitle = getEventMenuEntryHint(hasEventMenuBlock, e.idRaw, "toolbar");
      const toolBarImage = findImageEntryById(e.iconId);
      const toolBarImageTitle = getImageReferenceHint(e.iconId, "toolbar");

      const toolBarSetImageFn = e.kind === "ToolBarImageButton" && canPatch
        ? () => {
            setSelectionAndRefresh({ kind: "toolBarEntry", toolBarId: t.id, entryIndex });
          }
        : undefined;
      const toolBarPickImageFn = e.kind === "ToolBarImageButton" && canPatch
        ? () => {
            openImageReferencePicker({ kind: "toolBarEntry", toolBarId: t.id, entryIndex }, e.iconId);
          }
        : undefined;
      const toolBarChooseFileImageFn = e.kind === "ToolBarImageButton" && canPatch
        ? () => {
            openImageAssignmentDraft({ kind: "toolBarEntry", toolBarId: t.id, entryIndex }, "chooseFile");
          }
        : undefined;
      const toolBarCreateImageFn = e.kind === "ToolBarImageButton" && canPatch
        ? () => {
            openImageAssignmentDraft({ kind: "toolBarEntry", toolBarId: t.id, entryIndex }, "create");
          }
        : undefined;

      const rowEl = miniRow(
        line,
        editFn,
        delFn,
        { label: "Event", onClick: eventFn, disabled: !eventFn, title: toolBarEventTitle },
        { label: "Tooltip", onClick: toolBarTooltipFn, disabled: !toolBarTooltipFn, title: canEditToolBarTooltip(e) ? "Patch the tooltip linked to this toolbar entry." : "Separators and standalone ToolBarToolTip rows do not expose the original toolbar caption field." },
        { label: "Set Image", onClick: toolBarSetImageFn, disabled: !toolBarSetImageFn, title: e.kind === "ToolBarImageButton" ? "Patch the raw ToolBarImageButton image argument." : "Only ToolBarImageButton supports a parsed image reference." },
        { label: "Use Existing", onClick: toolBarPickImageFn, disabled: !toolBarPickImageFn, title: e.kind === "ToolBarImageButton" ? "Select an image from the form image list." : "Only ToolBarImageButton supports a parsed image reference." },
        { label: "Choose File", onClick: toolBarChooseFileImageFn, disabled: !toolBarChooseFileImageFn, title: e.kind === "ToolBarImageButton" ? "Select a file, create a new LoadImage entry and assign it to this toolbar button." : "Only ToolBarImageButton supports a parsed image reference." },
        { label: "Create New", onClick: toolBarCreateImageFn, disabled: !toolBarCreateImageFn, title: e.kind === "ToolBarImageButton" ? "Create a new form image entry and assign it to this toolbar button." : "Only ToolBarImageButton supports a parsed image reference." },
        { label: "Image", onClick: toolBarImage ? () => selectImageById(toolBarImage.id) : undefined, disabled: !toolBarImage, title: toolBarImageTitle }
      );
      if (selectedEntryIndex === entryIndex) rowEl.classList.add("selected");
      rowEl.onclick = (ev) => {
        if (ev.target instanceof HTMLButtonElement) return;
        setSelectionAndRefresh({ kind: "toolBarEntry", toolBarId: t.id, entryIndex });
      };
      box.appendChild(rowEl);
    }
    if (showToolBarRootInspector) {
      propsEl.appendChild(section("Structure"));
      propsEl.appendChild(box);

      const addButtonBtn = document.createElement("button");
      addButtonBtn.textContent = "Add Button";
      addButtonBtn.title = "Insert a new ToolBarImageButton with the default image argument 0.";
      addButtonBtn.onclick = () => {
        postInsertToolBarEntry(t, getToolBarPreviewInsertArgs(t, "button"));
      };

      const addToggleBtn = document.createElement("button");
      addToggleBtn.textContent = "Add Toggle";
      addToggleBtn.title = "Insert a new ToolBarImageButton with #PB_ToolBar_Toggle enabled.";
      addToggleBtn.onclick = () => {
        postInsertToolBarEntry(t, getToolBarPreviewInsertArgs(t, "toggle"));
      };

      const addSeparatorBtn = document.createElement("button");
      addSeparatorBtn.textContent = "Add Separator";
      addSeparatorBtn.title = "Insert a new ToolBarSeparator entry.";
      addSeparatorBtn.onclick = () => {
        postInsertToolBarEntry(t, getToolBarPreviewInsertArgs(t, "separator"));
      };

      const actions = document.createElement("div");
      actions.className = "miniActions";
      actions.appendChild(addButtonBtn);
      actions.appendChild(addToggleBtn);
      actions.appendChild(addSeparatorBtn);
      if (sel.kind === "toolbar") {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete Toolbar";
        deleteBtn.onclick = () => {
          openDestructiveAction({
            kind: "deleteToolBar",
            toolBarId: t.id,
            message: `Delete toolbar '${t.id}'?`,
            confirmLabel: "Delete Toolbar"
          });
        };
        actions.appendChild(deleteBtn);
      }
      propsEl.appendChild(actions);
      if (pendingDestructiveAction?.kind === "deleteToolBar" && pendingDestructiveAction.toolBarId === t.id) {
        const pendingEl = createPendingDestructiveActionEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
    }
    if (selectedEntry
      && pendingDestructiveAction?.kind === "deleteToolBarEntry"
      && pendingDestructiveAction.toolBarId === t.id
      && pendingDestructiveAction.entryIndex === selectedEntryIndex) {
      const pendingEl = createPendingDestructiveActionEl();
      if (pendingEl) propsEl.appendChild(pendingEl);
    }
    return;
  }

  if (sel.kind === "statusbar" || sel.kind === "statusBarField") {
    const statusBarId = sel.kind === "statusbar" ? sel.id : sel.statusBarId;
    const selectedFieldIndex = sel.kind === "statusBarField" ? sel.fieldIndex : undefined;
    const sb = (model.statusbars ?? []).find(x => x.id === statusBarId);
    if (!sb) {
      propsEl.innerHTML = "<div class='muted'>StatusBar not found</div>";
      return;
    }

    const getStatusBarFieldUi = (field: StatusbarField) => {
      const fieldIndex = (sb.fields ?? []).findIndex(candidate => candidate === field);
      const canPatch = typeof field.source?.line === "number";
      const statusImage = findImageEntryById(field.imageId);
      const statusImageTitle = getImageReferenceHint(field.imageId, "statusbar");
      const postFieldUpdate = (patch: {
        widthRaw?: string;
        textRaw?: string;
        imageRaw?: string;
        flagsRaw?: string;
        progressBar?: boolean;
        progressRaw?: string;
      }) => {
        if (!canPatch) return;
        const nextProgressBar = patch.progressBar ?? Boolean(field.progressBar);
        post({
          type: "updateStatusBarField",
          statusBarId: sb.id,
          sourceLine: field.source!.line,
          widthRaw: patch.widthRaw ?? field.widthRaw,
          textRaw: patch.textRaw ?? field.textRaw ?? "",
          imageRaw: patch.imageRaw ?? field.imageRaw ?? "",
          flagsRaw: patch.flagsRaw ?? field.flagsRaw ?? "",
          progressBar: nextProgressBar,
          progressRaw: normalizeStatusBarProgressRaw(nextProgressBar, patch.progressRaw ?? field.progressRaw ?? "")
        });
      };

      const editFn = canPatch
        ? () => {
            if (fieldIndex < 0) return;
            setSelectionAndRefresh({ kind: "statusBarField", statusBarId: sb.id, fieldIndex });
          }
        : undefined;

      const delFn = canPatch
        ? () => {
            openDestructiveAction(
              {
                kind: "deleteStatusBarField",
                statusBarId: sb.id,
                fieldIndex,
                sourceLine: field.source!.line,
                message: `Delete field ${fieldIndex} from statusbar '${sb.id}'?`,
                confirmLabel: "Delete Field"
              },
              { kind: "statusBarField", statusBarId: sb.id, fieldIndex }
            );
          }
        : undefined;

      const statusSetImageFn = canPatch
        ? () => {
            if (fieldIndex < 0) return;
            setSelectionAndRefresh({ kind: "statusBarField", statusBarId: sb.id, fieldIndex });
          }
        : undefined;

      const statusPickImageFn = canPatch
        ? () => {
            openImageReferencePicker({ kind: "statusBarField", statusBarId: sb.id, fieldIndex }, field.imageId);
          }
        : undefined;

      const statusTextFn = canPatch
        ? () => {
            if (fieldIndex < 0) return;
            setSelectionAndRefresh({ kind: "statusBarField", statusBarId: sb.id, fieldIndex });
          }
        : undefined;

      const statusProgressFn = canPatch
        ? () => {
            if (fieldIndex < 0) return;
            setSelectionAndRefresh({ kind: "statusBarField", statusBarId: sb.id, fieldIndex });
          }
        : undefined;

      const statusClearFn = canPatch
        ? () => {
            openDestructiveAction(
              {
                kind: "clearStatusBarField",
                statusBarId: sb.id,
                fieldIndex,
                sourceLine: field.source!.line,
                message: `Clear text, image and progress decoration for field ${fieldIndex}?`,
                confirmLabel: "Clear Decoration"
              },
              { kind: "statusBarField", statusBarId: sb.id, fieldIndex }
            );
          }
        : undefined;

      const statusChooseFileImageFn = canPatch
        ? () => {
            openImageAssignmentDraft({ kind: "statusBarField", statusBarId: sb.id, fieldIndex }, "chooseFile");
          }
        : undefined;

      const statusCreateImageFn = canPatch
        ? () => {
            openImageAssignmentDraft({ kind: "statusBarField", statusBarId: sb.id, fieldIndex }, "create");
          }
        : undefined;

      return {
        canPatch,
        statusImage,
        statusImageTitle,
        editFn,
        delFn,
        statusSetImageFn,
        statusPickImageFn,
        statusTextFn,
        statusProgressFn,
        statusClearFn,
        statusChooseFileImageFn,
        statusCreateImageFn,
        postFieldUpdate,
      };
    };

    const showStatusBarRootInspector = sel.kind === "statusbar";
    if (showStatusBarRootInspector) {
      propsEl.appendChild(row("Id", readonlyInput(sb.id)));
      propsEl.appendChild(row("Fields", readonlyInput(String(sb.fields?.length ?? 0))));
    }

    const selectedField = sel.kind === "statusBarField" && typeof selectedFieldIndex === "number"
      ? sb.fields?.[selectedFieldIndex]
      : undefined;
    if (selectedField) {
      const selectedUi = getStatusBarFieldUi(selectedField);
      const selectedImagePath = selectedUi.statusImage?.image ?? selectedUi.statusImage?.imageRaw ?? selectedField.imageRaw ?? "";
      const selectedImageUsageCount = selectedField.imageId ? countImageUsages(selectedField.imageId) : 0;
      const selectedImageEditState = getStatusBarCurrentImageEditState(selectedUi.statusImage, selectedImageUsageCount);

      propsEl.appendChild(section("Selected Field"));
      propsEl.appendChild(row(
        "Width",
        textInput(
          selectedField.widthRaw ?? "",
          v => {
            if (!selectedUi.canPatch) return;
            selectedUi.postFieldUpdate({ widthRaw: v.trim() || selectedField.widthRaw });
          },
          {
            disabled: !selectedUi.canPatch,
            title: "Patch the raw AddStatusBarField width for the selected field."
          }
        )
      ));
      propsEl.appendChild(row(
        "Text",
        textInput(
          selectedField.text ?? "",
          v => {
            if (!selectedUi.canPatch) return;
            selectedUi.postFieldUpdate({
              textRaw: v.trim().length ? toPbString(v) : ""
            });
          },
          {
            disabled: !selectedUi.canPatch,
            title: "Match the original statusbar text field for the current selection."
          }
        )
      ));
      propsEl.appendChild(row(
        "ProgressValue",
        readonlyInput(getStatusBarProgressInspectorValue(selectedField.progressBar, selectedField.progressRaw))
      ));
      const currentImageControl = textInput(
        selectedImagePath,
        value => {
          if (selectedImageEditState.canDirectEdit && selectedUi.statusImage && typeof selectedUi.statusImage.source?.line === "number") {
            clearInfoError();
            post({
              type: "updateImage",
              sourceLine: selectedUi.statusImage.source.line,
              inline: false,
              idRaw: selectedUi.statusImage.firstParam,
              imageRaw: toPbString(value),
              assignedVar: selectedUi.statusImage.pbAny ? selectedUi.statusImage.variable : undefined
            });
            return;
          }

          const rebind = resolveStatusBarCurrentImageRebind(model.images ?? [], value, selectedField.imageId);
          if (rebind.matchedImage) {
            if (rebind.matchedImage.id === selectedField.imageId) {
              clearInfoError();
              renderProps();
              return;
            }

            clearInfoError();
            post({
              type: "rebindStatusBarFieldImage",
              statusBarId: sb.id,
              sourceLine: selectedField.source!.line,
              widthRaw: selectedField.widthRaw,
              imageRaw: `ImageID(${rebind.matchedImage.id})`,
              oldImageId: selectedField.imageId,
              oldImageSourceLine: shouldCleanupStatusBarReboundImage(
                selectedField.imageId,
                selectedImageUsageCount,
                selectedUi.statusImage?.source?.line,
                rebind.matchedImage.id
              ) ? selectedUi.statusImage?.source?.line : undefined
            });
            return;
          }

          const createResolution = resolveStatusBarCurrentImageCreate(
            model.images ?? [],
            value,
            model.window?.id,
            model.window?.variable
          );
          if (!createResolution.imageIdRaw || !createResolution.imageRaw) {
            setInfoError(createResolution.reason ?? rebind.reason ?? (selectedImageEditState.reason ?? "CurrentImage stays readonly for this image reference."));
            renderProps();
            return;
          }

          clearInfoError();
          post({
            type: "createAndAssignStatusBarFieldImage",
            statusBarId: sb.id,
            sourceLine: selectedField.source!.line,
            widthRaw: selectedField.widthRaw,
            newInline: false,
            newImageIdRaw: createResolution.imageIdRaw,
            newImageRaw: createResolution.imageRaw,
            oldImageId: selectedField.imageId,
            oldImageSourceLine: shouldCleanupStatusBarReboundImage(
              selectedField.imageId,
              selectedImageUsageCount,
              selectedUi.statusImage?.source?.line,
              createResolution.imageIdRaw
            ) ? selectedUi.statusImage?.source?.line : undefined
          });
        },
        {
          title: selectedImageEditState.canDirectEdit
            ? selectedImageEditState.reason
            : "Enter an existing parsed image path or data label to rebind this field, or a quoted/path-like file string to auto-create a new LoadImage entry. Use Create New for inline labels or custom image ids.",
          placeholder: selectedUi.statusImage?.inline ? "ImgInlineLabel" : "image.png"
        }
      );
      currentImageControl.title = selectedImageEditState.canDirectEdit
        ? (selectedImageEditState.reason ?? "")
        : "Enter an existing parsed image path or data label to rebind this field, or a quoted/path-like file string to auto-create a new LoadImage entry. Use Create New for inline labels or custom image ids.";
      propsEl.appendChild(row("CurrentImage", currentImageControl));
      if (!selectedImageEditState.canDirectEdit) {
        propsEl.appendChild(mutedNote("For shared or CatchImage references, CurrentImage can rebind to an existing parsed image entry here, or auto-create a new LoadImage entry for quoted/path-like file strings. Use Create New for inline labels or custom image ids."));
      }
      const selectedImageActions = document.createElement("div");
      selectedImageActions.className = "row-actions";
      const useExistingBtn = document.createElement("button");
      useExistingBtn.textContent = "Use Existing";
      useExistingBtn.disabled = !selectedUi.statusPickImageFn;
      useExistingBtn.title = "Select an image from the form image list and assign it to this statusbar field.";
      useExistingBtn.onclick = () => selectedUi.statusPickImageFn?.();
      selectedImageActions.appendChild(useExistingBtn);
      const chooseFileBtn = document.createElement("button");
      chooseFileBtn.textContent = "Choose File";
      chooseFileBtn.disabled = !selectedUi.statusChooseFileImageFn;
      chooseFileBtn.title = "Select a file, create a new LoadImage entry and assign it to this statusbar field.";
      chooseFileBtn.onclick = () => selectedUi.statusChooseFileImageFn?.();
      selectedImageActions.appendChild(chooseFileBtn);
      const createNewBtn = document.createElement("button");
      createNewBtn.textContent = "Create New";
      createNewBtn.disabled = !selectedUi.statusCreateImageFn;
      createNewBtn.title = "Create a new form image entry and assign it to this statusbar field.";
      createNewBtn.onclick = () => selectedUi.statusCreateImageFn?.();
      selectedImageActions.appendChild(createNewBtn);
      const clearImageBtn = document.createElement("button");
      clearImageBtn.textContent = "Clear";
      clearImageBtn.disabled = !selectedUi.statusClearFn;
      clearImageBtn.title = "Remove text/image/progress decoration from this field.";
      clearImageBtn.onclick = () => selectedUi.statusClearFn?.();
      selectedImageActions.appendChild(clearImageBtn);
      if (selectedUi.statusImage) {
        const jumpImageBtn = document.createElement("button");
        jumpImageBtn.textContent = "Image";
        jumpImageBtn.title = selectedUi.statusImageTitle;
        jumpImageBtn.onclick = () => selectImageById(selectedUi.statusImage!.id);
        selectedImageActions.appendChild(jumpImageBtn);
      }
      propsEl.appendChild(row("ChangeImage", selectedImageActions));
      if (isImageReferencePickerOpenFor({ kind: "statusBarField", statusBarId: sb.id, fieldIndex: selectedFieldIndex! })) {
        const pendingEl = createPendingImageReferencePickerEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
      if (isImageAssignmentDraftOpenFor({ kind: "statusBarField", statusBarId: sb.id, fieldIndex: selectedFieldIndex! })) {
        const pendingEl = createPendingImageAssignmentDraftEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
      propsEl.appendChild(row(
        "ProgressBar",
        checkboxInput(
          Boolean(selectedField.progressBar),
          checked => {
            if (!selectedUi.canPatch) return;
            selectedUi.postFieldUpdate({
              progressBar: checked,
              progressRaw: checked ? (selectedField.progressRaw?.trim() || "0") : ""
            });
          },
          {
            disabled: !selectedUi.canPatch,
            title: "Match the original ProgressBar checkbox for the selected statusbar field. The stored value remains 0."
          }
        )
      ));
      const statusBarFlagActions = document.createElement("div");
      statusBarFlagActions.className = "row-actions";
      for (const flag of STATUSBAR_KNOWN_FLAGS) {
        const wrap = document.createElement("label");
        wrap.className = "check";
        const boxInput = document.createElement("input");
        boxInput.type = "checkbox";
        boxInput.checked = hasPbFlag(selectedField.flagsRaw, flag);
        boxInput.disabled = !selectedUi.canPatch;
        boxInput.onchange = () => {
          if (!selectedUi.canPatch) return;
          selectedUi.postFieldUpdate({ flagsRaw: buildStatusBarFlagsRaw(selectedField.flagsRaw, { [flag]: boxInput.checked }) ?? "" });
        };
        const caption = document.createElement("span");
        caption.textContent = flag.replace("#PB_StatusBar_", "");
        wrap.appendChild(boxInput);
        wrap.appendChild(caption);
        statusBarFlagActions.appendChild(wrap);
      }
      propsEl.appendChild(row("Flags", statusBarFlagActions));

      const selectedDeleteStatusFieldBtn = document.createElement("button");
      selectedDeleteStatusFieldBtn.textContent = "Delete Field";
      selectedDeleteStatusFieldBtn.disabled = !selectedUi.delFn;
      selectedDeleteStatusFieldBtn.title = selectedDeleteStatusFieldBtn.disabled
        ? "Only parsed statusbar fields with a source line can be deleted."
        : "Delete the currently selected statusbar field.";
      selectedDeleteStatusFieldBtn.onclick = () => selectedUi.delFn?.();
      propsEl.appendChild(row("Delete", selectedDeleteStatusFieldBtn));
    }

    const box = miniList();
    (sb.fields ?? []).forEach((f, idx) => {
      const fieldUi = getStatusBarFieldUi(f);
      const label = `Field ${idx}  ${getStatusBarFieldDisplaySummary(f)}  width:${f.widthRaw}`;

      const rowEl = miniRow(
        label,
        fieldUi.editFn,
        fieldUi.delFn,
        { label: "Label", onClick: fieldUi.statusTextFn, disabled: !fieldUi.statusTextFn, title: "Edit the stored StatusBarText value for this field without clearing the other statusbar cells." },
        { label: "Progress", onClick: fieldUi.statusProgressFn, disabled: !fieldUi.statusProgressFn, title: "Toggle the stored StatusBarProgress state for this field without clearing the other statusbar cells." },
        { label: "Clear", onClick: fieldUi.statusClearFn, disabled: !fieldUi.statusClearFn, title: "Remove text/image/progress decoration from this field." },
        { label: "Set Image", onClick: fieldUi.statusSetImageFn, disabled: !fieldUi.statusSetImageFn, title: "Assign or update the stored StatusBarImage reference while preserving the other statusbar cells." },
        { label: "Use Existing", onClick: fieldUi.statusPickImageFn, disabled: !fieldUi.statusPickImageFn, title: "Select an image from the form image list and assign it to this field." },
        { label: "Choose File", onClick: fieldUi.statusChooseFileImageFn, disabled: !fieldUi.statusChooseFileImageFn, title: "Select a file, create a new LoadImage entry and assign it to this statusbar field." },
        { label: "Create New", onClick: fieldUi.statusCreateImageFn, disabled: !fieldUi.statusCreateImageFn, title: "Create a new form image entry and assign it to this statusbar field." },
        { label: "Image", onClick: fieldUi.statusImage ? () => selectImageById(fieldUi.statusImage!.id) : undefined, disabled: !fieldUi.statusImage, title: fieldUi.statusImageTitle }
      );
      if (selectedFieldIndex === idx) rowEl.classList.add("selected");
      rowEl.onclick = (ev) => {
        if (ev.target instanceof HTMLButtonElement) return;
        setSelectionAndRefresh({ kind: "statusBarField", statusBarId: sb.id, fieldIndex: idx });
      };
      box.appendChild(rowEl);
    });
    if (showStatusBarRootInspector) {
      propsEl.appendChild(section("Fields"));
      propsEl.appendChild(box);

      const addImageBtn = document.createElement("button");
      addImageBtn.textContent = "Add Image";
      addImageBtn.title = "Insert a new statusbar field with image decoration defaults.";
      addImageBtn.onclick = () => {
        postInsertStatusBarField(sb, getStatusBarPreviewInsertArgs("image"));
      };

      const addLabelBtn = document.createElement("button");
      addLabelBtn.textContent = "Add Label";
      addLabelBtn.title = "Insert a new statusbar field with the default label text.";
      addLabelBtn.onclick = () => {
        postInsertStatusBarField(sb, getStatusBarPreviewInsertArgs("label"));
      };

      const addProgressBtn = document.createElement("button");
      addProgressBtn.textContent = "Add Progress";
      addProgressBtn.title = "Insert a new statusbar field with progress decoration defaults.";
      addProgressBtn.onclick = () => {
        postInsertStatusBarField(sb, getStatusBarPreviewInsertArgs("progress"));
      };

      const actions = document.createElement("div");
      actions.className = "miniActions";
      actions.appendChild(addImageBtn);
      actions.appendChild(addLabelBtn);
      actions.appendChild(addProgressBtn);
      if (sel.kind === "statusbar") {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete StatusBar";
        deleteBtn.onclick = () => {
          openDestructiveAction({
            kind: "deleteStatusBar",
            statusBarId: sb.id,
            message: `Delete statusbar '${sb.id}'?`,
            confirmLabel: "Delete StatusBar"
          });
        };
        actions.appendChild(deleteBtn);
      }
      propsEl.appendChild(actions);
      if (pendingDestructiveAction?.kind === "deleteStatusBar" && pendingDestructiveAction.statusBarId === sb.id) {
        const pendingEl = createPendingDestructiveActionEl();
        if (pendingEl) propsEl.appendChild(pendingEl);
      }
    }
    if (selectedField
      && pendingDestructiveAction
      && ((pendingDestructiveAction.kind === "deleteStatusBarField"
        || pendingDestructiveAction.kind === "clearStatusBarField")
        && pendingDestructiveAction.statusBarId === sb.id
        && pendingDestructiveAction.fieldIndex === selectedFieldIndex)) {
      const pendingEl = createPendingDestructiveActionEl();
      if (pendingEl) propsEl.appendChild(pendingEl);
    }
    return;
  }

  if (sel.kind === "image") {
    const img = (model.images ?? []).find(entry => entry.id === sel.id);
    if (!img) {
      propsEl.innerHTML = "<div class='muted'>Image not found</div>";
      return;
    }

    const usages = collectImageUsages(img.id);
    const canPatch = typeof img.source?.line === "number";
    const imageEditorOpen = canPatch && isImageEditorOpen(img);
    const imageDraft = getImageEditorDraft(img);

    propsEl.appendChild(row("Id", readonlyInput(img.id)));
    propsEl.appendChild(row("Kind", readonlyInput(imageEditorOpen ? (imageDraft.inline ? "CatchImage" : "LoadImage") : (img.inline ? "CatchImage" : "LoadImage"))));
    propsEl.appendChild(row(
      "First Param",
      imageEditorOpen
        ? textInput(imageDraft.idRaw, v => updateImageEditorDraft({ idRaw: v }), {
            title: "Patch the first image argument (#ImgName or #PB_Any) without using a browser prompt."
          })
        : readonlyInput(img.firstParam)
    ));
    if (imageEditorOpen && imageDraft.idRaw.trim().toLowerCase() === "#pb_any") {
      propsEl.appendChild(row(
        "Assigned Var",
        textInput(imageDraft.assignedVar, v => updateImageEditorDraft({ assignedVar: v }), {
          title: "Provide the assigned variable name for #PB_Any image entries."
        })
      ));
    }
    propsEl.appendChild(row(
      "Image Raw",
      imageEditorOpen
        ? textInput(imageDraft.imageRaw, v => updateImageEditorDraft({ imageRaw: v }), {
            title: "Patch the raw LoadImage/CatchImage argument without using a browser prompt."
          })
        : readonlyInput(img.imageRaw)
    ));
    propsEl.appendChild(row("References", readonlyInput(String(usages.length))));

    propsEl.appendChild(section("References"));
    if (!usages.length) {
      propsEl.appendChild(mutedNote("This image is currently not referenced by any parsed gadget, menu, toolbar or statusbar field."));
    } else {
      const refsBox = miniList();
      for (const usage of usages) {
        refsBox.appendChild(miniRow(usage.label, undefined, undefined, {
          label: "Go",
          onClick: () => {
            setSelectionAndRefresh(usage.select);
          }
        }));
      }
      propsEl.appendChild(refsBox);
    }

    const actions = document.createElement("div");
    actions.className = "miniActions";

    const editBtn = document.createElement("button");
    editBtn.textContent = imageEditorOpen ? "Save Image" : "Edit Image";
    editBtn.disabled = !canPatch;
    editBtn.onclick = () => {
      if (!canPatch) return;
      if (imageEditorOpen) {
        saveImageEditor(img);
        return;
      }
      openImageEditor(img);
      renderProps();
    };

    const cancelEditBtn = document.createElement("button");
    cancelEditBtn.textContent = "Cancel Edit";
    cancelEditBtn.hidden = !imageEditorOpen;
    cancelEditBtn.disabled = !imageEditorOpen;
    cancelEditBtn.onclick = () => {
      if (!canPatch || !imageEditorOpen) return;
      closeImageEditor(img.source?.line);
      renderProps();
    };

    const chooseFileBtn = document.createElement("button");
    chooseFileBtn.textContent = "Choose File";
    chooseFileBtn.disabled = imageEditorOpen || !(canPatch && canChooseFileImageEntry(img));
    chooseFileBtn.title = canChooseFileImageEntry(img)
      ? "Select a file for this LoadImage entry."
      : "Only LoadImage entries can select a file path.";
    chooseFileBtn.onclick = () => {
      if (!(canPatch && canChooseFileImageEntry(img))) return;
      post({
        type: "chooseImageFileForEntry",
        sourceLine: img.source!.line,
        inline: img.inline,
        idRaw: img.firstParam,
        assignedVar: img.variable
      });
    };

    const toggleInlineBtn = document.createElement("button");
    toggleInlineBtn.textContent = img.inline ? "Use LoadImage" : "Use CatchImage";
    toggleInlineBtn.disabled = imageEditorOpen || !canPatch;
    toggleInlineBtn.title = img.inline
      ? "Switch this image entry from CatchImage to LoadImage without changing its raw value."
      : "Switch this image entry from LoadImage to CatchImage without changing its raw value.";
    toggleInlineBtn.onclick = () => {
      if (!canPatch) return;
      post({
        type: "updateImage",
        sourceLine: img.source!.line,
        inline: !img.inline,
        idRaw: img.firstParam,
        imageRaw: img.imageRaw,
        assignedVar: img.pbAny ? img.variable : undefined
      });
    };

    const togglePbAnyBtn = document.createElement("button");
    togglePbAnyBtn.textContent = img.pbAny ? "Use Enum Id" : "Use PB_Any";
    togglePbAnyBtn.disabled = imageEditorOpen || !(canPatch && canToggleImagePbAny(img));
    togglePbAnyBtn.title = img.pbAny
      ? "Switch this image entry from #PB_Any assignment to a regular image id and update parsed references."
      : "Switch this image entry to #PB_Any assignment and update parsed references.";
    togglePbAnyBtn.onclick = () => {
      if (!(canPatch && canToggleImagePbAny(img))) return;
      post({
        type: "toggleImagePbAny",
        sourceLine: img.source!.line,
        toPbAny: !img.pbAny,
      });
    };

    const relativeBtn = document.createElement("button");
    relativeBtn.textContent = "Make Relative";
    relativeBtn.disabled = imageEditorOpen || !(canPatch && canRelativizeImageEntry(img));
    relativeBtn.title = canRelativizeImageEntry(img)
      ? "Rewrite the LoadImage file path relative to the current form file."
      : "Only quoted LoadImage file paths can be made relative.";
    relativeBtn.onclick = () => {
      if (!(canPatch && canRelativizeImageEntry(img))) return;
      post({
        type: "relativizeImagePath",
        sourceLine: img.source!.line,
        inline: img.inline,
        idRaw: img.firstParam,
        imageRaw: img.imageRaw,
        assignedVar: img.variable
      });
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete Image";
    delBtn.disabled = imageEditorOpen || !canPatch;
    delBtn.onclick = () => {
      if (!canPatch) return;
      openDestructiveAction({
        kind: "deleteImage",
        imageId: img.id,
        sourceLine: img.source!.line,
        message: `Delete image '${img.id}'?`,
        confirmLabel: "Delete Image"
      });
    };

    actions.appendChild(editBtn);
    actions.appendChild(cancelEditBtn);
    actions.appendChild(chooseFileBtn);
    actions.appendChild(toggleInlineBtn);
    actions.appendChild(togglePbAnyBtn);
    actions.appendChild(relativeBtn);
    actions.appendChild(delBtn);
    propsEl.appendChild(actions);
    if (pendingDestructiveAction?.kind === "deleteImage" && pendingDestructiveAction.imageId === img.id) {
      const pendingEl = createPendingDestructiveActionEl();
      if (pendingEl) propsEl.appendChild(pendingEl);
    }
    return;
  }

  if (sel.kind === "images") {
    propsEl.appendChild(row("Entries", readonlyInput(String(model.images?.length ?? 0))));

    const box = miniList();
    for (const img of model.images ?? []) {
      const label = `${img.pbAny && img.variable ? `${img.variable} = ` : ""}${img.inline ? "CatchImage" : "LoadImage"}(${img.firstParam}, ${img.imageRaw})`;
      const canPatch = typeof img.source?.line === "number";

      const rowEl = miniRow(
        label,
        canPatch
          ? () => {
              setSelectionAndRefresh({ kind: "image", id: img.id });
            }
          : undefined,
          canPatch
            ? () => {
                openDestructiveAction(
                  {
                    kind: "deleteImage",
                    imageId: img.id,
                    sourceLine: img.source!.line,
                    message: `Delete image '${img.id}'?`,
                    confirmLabel: "Delete Image"
                  },
                  { kind: "image", id: img.id }
                );
              }
            : undefined,
          {
            label: "Choose",
            onClick: canPatch && canChooseFileImageEntry(img)
              ? () => {
                  post({
                    type: "chooseImageFileForEntry",
                    sourceLine: img.source!.line,
                    inline: img.inline,
                    idRaw: img.firstParam,
                    assignedVar: img.variable
                  });
                }
              : undefined,
            disabled: !(canPatch && canChooseFileImageEntry(img)),
            title: canChooseFileImageEntry(img)
              ? "Select a file for this LoadImage entry."
              : "Only LoadImage entries can select a file path."
          },
          {
            label: img.inline ? "Load" : "Catch",
            onClick: canPatch
              ? () => {
                  post({
                    type: "updateImage",
                    sourceLine: img.source!.line,
                    inline: !img.inline,
                    idRaw: img.firstParam,
                    imageRaw: img.imageRaw,
                    assignedVar: img.pbAny ? img.variable : undefined
                  });
                }
              : undefined,
            disabled: !canPatch,
            title: img.inline
              ? "Switch this image entry from CatchImage to LoadImage without changing its raw value."
              : "Switch this image entry from LoadImage to CatchImage without changing its raw value."
          },
          {
            label: img.pbAny ? "Enum" : "PB_Any",
            onClick: canPatch && canToggleImagePbAny(img)
              ? () => {
                  post({
                    type: "toggleImagePbAny",
                    sourceLine: img.source!.line,
                    toPbAny: !img.pbAny
                  });
                }
              : undefined,
            disabled: !(canPatch && canToggleImagePbAny(img)),
            title: img.pbAny
              ? "Switch this image entry from #PB_Any assignment to a regular image id and update parsed references."
              : "Switch this image entry to #PB_Any assignment and update parsed references."
          },
          {
            label: "Relative",
            onClick: canPatch && canRelativizeImageEntry(img)
              ? () => {
                  post({
                    type: "relativizeImagePath",
                    sourceLine: img.source!.line,
                    inline: img.inline,
                    idRaw: img.firstParam,
                    imageRaw: img.imageRaw,
                    assignedVar: img.variable
                  });
                }
              : undefined,
            disabled: !(canPatch && canRelativizeImageEntry(img)),
            title: canRelativizeImageEntry(img)
              ? "Rewrite the LoadImage file path relative to the current form file."
              : "Only quoted LoadImage file paths can be made relative."
          }
        );
      rowEl.onclick = (ev) => {
        if (ev.target instanceof HTMLButtonElement) return;
        setSelectionAndRefresh({ kind: "image", id: img.id });
      };
      box.appendChild(rowEl);
    }
    propsEl.appendChild(section("Images"));
    propsEl.appendChild(box);

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Image";
    addBtn.onclick = () => {
      openImageInsertDraft();
    };

    const actions = document.createElement("div");
    actions.className = "miniActions";
    actions.appendChild(addBtn);
    propsEl.appendChild(actions);
    if (pendingImageInsertDraft) {
      const pendingEl = createPendingImageInsertDraftEl();
      if (pendingEl) propsEl.appendChild(pendingEl);
    }
    return;
  }

  if (sel.kind !== "gadget") {
    propsEl.innerHTML = "";
    return;
  }

  const selId = sel.id;
  const g = model.gadgets.find(it => it.id === selId);
  if (!g) {
    propsEl.innerHTML = "";
    return;
  }

  propsEl.appendChild(row("Id", readonlyInput(g.id)));
  propsEl.appendChild(row("Kind", readonlyInput(g.kind)));
  propsEl.appendChild(row("Parent", readonlyInput((g.parentId ?? "").toString())));
  propsEl.appendChild(row("Tab", readonlyInput(typeof g.parentItem === "number" ? String(g.parentItem) : "")));
  propsEl.appendChild(row("Items", readonlyInput(String(g.items?.length ?? 0))));
  propsEl.appendChild(row("Columns", readonlyInput(String(g.columns?.length ?? 0))));
  const isImageCapableGadget = IMAGE_CAPABLE_GADGET_KINDS.has(g.kind);
  const gadgetImageRawInput = isImageCapableGadget
    ? textInput(
        g.imageRaw ?? "",
        v => {
          if (!isImageCapableGadget) return;
          const normalized = normalizeImageReference(v);
          if (!normalized.imageRaw) return;
          g.imageRaw = normalized.imageRaw;
          g.imageId = normalized.imageId;
          post({
            type: "setGadgetImageRaw",
            id: g.id,
            imageRaw: normalized.imageRaw
          });
          renderProps();
        },
        { title: "Use a raw image argument such as ImageID(#ImgOpen) or 0." }
      )
    : readonlyInput(g.imageRaw ?? "");
  propsEl.appendChild(row("Image Raw", gadgetImageRawInput));
  propsEl.appendChild(row("Image Id", readonlyInput(g.imageId ?? "")));
  const gadgetImage = findImageEntryById(g.imageId);
  const gadgetImageHint = getImageReferenceHint(g.imageId, "gadget");
  const gadgetImageActions = document.createElement("div");
  gadgetImageActions.className = "row-actions";

  if (isImageCapableGadget) {
    const gadgetPickImageBtn = document.createElement("button");
    gadgetPickImageBtn.textContent = "Use Existing Image";
    gadgetPickImageBtn.disabled = !(model.images?.length);
    gadgetPickImageBtn.title = model.images?.length ? "Select an image from the form image list." : "No image entries are defined in this form.";
    gadgetPickImageBtn.onclick = () => {
      openImageReferencePicker({ kind: "gadget", gadgetId: g.id }, g.imageId);
    };
    gadgetImageActions.appendChild(gadgetPickImageBtn);

    const gadgetCreateImageBtn = document.createElement("button");
    gadgetCreateImageBtn.textContent = "Create New Image";
    gadgetCreateImageBtn.title = "Create a new form image entry and assign it to this gadget.";
    gadgetCreateImageBtn.onclick = () => {
      openImageAssignmentDraft({ kind: "gadget", gadgetId: g.id }, "create");
    };
    gadgetImageActions.appendChild(gadgetCreateImageBtn);

    const gadgetChooseFileBtn = document.createElement("button");
    gadgetChooseFileBtn.textContent = "Choose File";
    gadgetChooseFileBtn.title = "Select a file, create a new LoadImage entry and assign it to this gadget. Optionally resize the gadget to the image size.";
    gadgetChooseFileBtn.onclick = () => {
      openImageAssignmentDraft({ kind: "gadget", gadgetId: g.id }, "chooseFile");
    };
    gadgetImageActions.appendChild(gadgetChooseFileBtn);
  }

  const gadgetImageBtn = document.createElement("button");
  gadgetImageBtn.textContent = "Select Image";
  gadgetImageBtn.disabled = !gadgetImage;
  gadgetImageBtn.title = gadgetImage ? "" : gadgetImageHint;
  gadgetImageBtn.onclick = () => {
    if (!gadgetImage) return;
    selectImageById(gadgetImage.id);
  };
  gadgetImageActions.appendChild(gadgetImageBtn);
  propsEl.appendChild(row("", gadgetImageActions));
  if (isImageReferencePickerOpenFor({ kind: "gadget", gadgetId: g.id })) {
    const pendingEl = createPendingImageReferencePickerEl();
    if (pendingEl) propsEl.appendChild(pendingEl);
  }
  if (isImageAssignmentDraftOpenFor({ kind: "gadget", gadgetId: g.id })) {
    const pendingEl = createPendingImageAssignmentDraftEl();
    if (pendingEl) propsEl.appendChild(pendingEl);
  }
  if (gadgetImageHint) {
    propsEl.appendChild(mutedNote(gadgetImageHint));
  }
  if (isImageCapableGadget) {
    propsEl.appendChild(mutedNote("Image-capable gadgets accept raw image expressions such as ImageID(#ImgOpen) or 0."));
  }

  const canEditCaption = canEditGadgetText(g.kind);
  const canEditColors = canEditGadgetColors(g.kind);
  const canEditChecked = canEditGadgetCheckedState(g.kind);
  const hasExpressionVisibility = (Boolean(g.hiddenRaw) && g.hidden === undefined) || (Boolean(g.disabledRaw) && g.disabled === undefined);
  const hasExpressionChecked = canEditChecked && Boolean(g.stateRaw) && g.state === undefined;

  if (canEditCaption) {
    propsEl.appendChild(
      row(
        "Caption Is Variable",
        checkboxInput(Boolean(g.textVariable), v => {
          applyLocalGadgetTextUpdate(g, getGadgetTextInspectorValue(g), v);
        })
      )
    );
    propsEl.appendChild(
      row(
        "Caption",
        textInput(
          getGadgetTextInspectorValue(g),
          v => {
            applyLocalGadgetTextUpdate(g, v, Boolean(g.textVariable));
          },
          { title: "Matches the original Caption / CaptionIsVariable property pair and patches the gadget constructor argument." }
        )
      )
    );
  }

  propsEl.appendChild(
    row(
      "Tooltip Is Variable",
      checkboxInput(Boolean(g.tooltipVariable), v => {
        applyLocalGadgetTooltipUpdate(g, getGadgetTooltipInspectorValue(g), v);
      })
    )
  );
  propsEl.appendChild(
    row(
      "Tooltip",
      textInput(
        getGadgetTooltipInspectorValue(g),
        v => {
          applyLocalGadgetTooltipUpdate(g, v, Boolean(g.tooltipVariable));
        },
        { title: "Matches the original Tooltip / TooltipIsVariable property pair and patches GadgetToolTip(...)." }
      )
    )
  );

  propsEl.appendChild(
    row(
      "Hidden",
      checkboxInput(Boolean(g.hidden), v => {
        g.hidden = v;
        g.hiddenRaw = v ? "1" : "0";
        postGadgetProperties(g.id, { hiddenRaw: g.hiddenRaw });
        render();
        renderProps();
      }, {
        title: g.hiddenRaw && g.hidden === undefined ? "The source currently uses a non-literal HideGadget expression. Toggling here rewrites it to 1 or 0." : "Matches the original Hidden property and patches HideGadget(...)."
      })
    )
  );
  propsEl.appendChild(
    row(
      "Disabled",
      checkboxInput(Boolean(g.disabled), v => {
        g.disabled = v;
        g.disabledRaw = v ? "1" : "0";
        postGadgetProperties(g.id, { disabledRaw: g.disabledRaw });
        render();
        renderProps();
      }, {
        title: g.disabledRaw && g.disabled === undefined ? "The source currently uses a non-literal DisableGadget expression. Toggling here rewrites it to 1 or 0." : "Matches the original Disabled property and patches DisableGadget(...)."
      })
    )
  );
  const resizeCtx = getWindowResizeLockContext();
  const canEditHorizontalLocks = canEditGadgetHorizontalLocks(g, resizeCtx);
  const verticalLockTopToggle = buildGadgetVerticalLockResizeUpdate(g, resizeCtx, !Boolean(g.lockTop), Boolean(g.lockBottom));
  const verticalLockBottomToggle = buildGadgetVerticalLockResizeUpdate(g, resizeCtx, Boolean(g.lockTop), !Boolean(g.lockBottom));
  propsEl.appendChild(row("LockLeft", checkboxInput(Boolean(g.lockLeft), v => {
    applyLocalGadgetHorizontalLockUpdate(g, v, Boolean(g.lockRight));
  }, {
    disabled: !canEditHorizontalLocks,
    title: canEditHorizontalLocks
      ? "Matches the original LockLeft property and patches an existing ResizeGadget(...) line using the original top-level horizontal anchor formulas."
      : "Horizontal lock editing currently requires an existing top-level ResizeGadget(...) line with preserved raw geometry expressions."
  })));
  propsEl.appendChild(row("LockRight", checkboxInput(Boolean(g.lockRight), v => {
    applyLocalGadgetHorizontalLockUpdate(g, Boolean(g.lockLeft), v);
  }, {
    disabled: !canEditHorizontalLocks,
    title: canEditHorizontalLocks
      ? "Matches the original LockRight property and patches an existing ResizeGadget(...) line using the original top-level horizontal anchor formulas."
      : "Horizontal lock editing currently requires an existing top-level ResizeGadget(...) line with preserved raw geometry expressions."
  })));
  propsEl.appendChild(row("LockTop", checkboxInput(Boolean(g.lockTop), v => {
    applyLocalGadgetVerticalLockUpdate(g, v, Boolean(g.lockBottom));
  }, {
    disabled: !verticalLockTopToggle,
    title: verticalLockTopToggle
      ? "Matches the original LockTop property for the already parsed vertical ResizeGadget(...) forms. Verified state changes now include horizontal-only fallbacks, top-level bottom-anchor transitions rebuilt from the preserved constructor y expression, and top-level stretch-height transitions rebuilt from the original codeviewer.pb skin formulas."
      : "LockTop editing is currently only enabled for vertical state changes that can be rebuilt from the already parsed ResizeGadget(...) formulas or from the original top-level codeviewer.pb height formulas for the current host skin."
  })));
  propsEl.appendChild(row("LockBottom", checkboxInput(Boolean(g.lockBottom), v => {
    applyLocalGadgetVerticalLockUpdate(g, Boolean(g.lockTop), v);
  }, {
    disabled: !verticalLockBottomToggle,
    title: verticalLockBottomToggle
      ? "Matches the original LockBottom property for the already parsed vertical ResizeGadget(...) forms. Verified state changes now include horizontal-only fallbacks, top-level bottom-anchor transitions rebuilt from the preserved constructor y expression, and top-level stretch-height transitions rebuilt from the original codeviewer.pb skin formulas."
      : "LockBottom editing is currently only enabled for vertical state changes that can be rebuilt from the already parsed ResizeGadget(...) formulas or from the original top-level codeviewer.pb height formulas for the current host skin."
  })));
  propsEl.appendChild(mutedNote(canEditHorizontalLocks || verticalLockTopToggle || verticalLockBottomToggle
    ? "LockLeft / LockRight patch existing top-level ResizeGadget(...) lines directly. LockTop / LockBottom now also support horizontal-only fallbacks, top-level bottom-anchor transitions rebuilt from the preserved constructor y expression, and top-level stretch-height transitions rebuilt from the original codeviewer.pb formulas for the current host skin."
    : "LockLeft / LockRight / LockTop / LockBottom are parsed from existing ResizeGadget(...) logic. Editing is currently enabled only for transitions that can be rebuilt safely from already parsed top-level ResizeGadget(...) formulas or from the original top-level codeviewer.pb formulas for the current host skin."
  ));
  if (hasExpressionVisibility) {
    propsEl.appendChild(mutedNote("Non-literal Hidden/Disabled expressions are preserved while untouched. Editing them here rewrites the value to 1 or 0."));
  }

  propsEl.appendChild(
    row(
      "Font Raw",
      textInput(
        g.gadgetFontRaw ?? "",
        v => {
          const trimmed = v.trim();
          g.gadgetFontRaw = trimmed || undefined;
          postGadgetProperties(g.id, { gadgetFontRaw: trimmed || undefined });
          renderProps();
        },
        { title: "Patch the raw SetGadgetFont(..., FontID(...)) argument directly." }
      )
    )
  );
  const gadgetFontSummary = getGadgetFontDisplaySummary(g);
  if (gadgetFontSummary) {
    propsEl.appendChild(mutedNote(`Parsed font: ${gadgetFontSummary}`));
  }

  if (canEditColors) {
    propsEl.appendChild(
      row(
        "FrontColor Raw",
        textInput(
          g.frontColorRaw ?? "",
          v => {
            const trimmed = v.trim();
            g.frontColorRaw = trimmed || undefined;
            postGadgetProperties(g.id, { frontColorRaw: trimmed || undefined });
            renderProps();
          },
          { title: "Patch the raw SetGadgetColor(..., #PB_Gadget_FrontColor, ...) expression directly." }
        )
      )
    );
    propsEl.appendChild(
      row(
        "BackColor Raw",
        textInput(
          g.backColorRaw ?? "",
          v => {
            const trimmed = v.trim();
            g.backColorRaw = trimmed || undefined;
            postGadgetProperties(g.id, { backColorRaw: trimmed || undefined });
            renderProps();
          },
          { title: "Patch the raw SetGadgetColor(..., #PB_Gadget_BackColor, ...) expression directly." }
        )
      )
    );
  }

  const gadgetCtorRangeLabels = getGadgetCtorRangeFieldLabels(g.kind);
  if (gadgetCtorRangeLabels) {
    propsEl.appendChild(
      row(
        gadgetCtorRangeLabels.minLabel,
        textInput(
          getGadgetCtorRangeInspectorValue(g.minRaw, g.min),
          v => {
            applyLocalGadgetCtorRangeUpdate(g, "min", v);
          },
          { title: gadgetCtorRangeLabels.title }
        )
      )
    );
    propsEl.appendChild(
      row(
        gadgetCtorRangeLabels.maxLabel,
        textInput(
          getGadgetCtorRangeInspectorValue(g.maxRaw, g.max),
          v => {
            applyLocalGadgetCtorRangeUpdate(g, "max", v);
          },
          { title: gadgetCtorRangeLabels.title }
        )
      )
    );
  }

  if (canEditChecked) {
    propsEl.appendChild(
      row(
        "Checked",
        checkboxInput(Boolean(g.state), v => {
          g.state = v ? 1 : 0;
          g.stateRaw = buildGadgetCheckedStateRaw(g.kind, v);
          post({ type: "setGadgetStateRaw", id: g.id, stateRaw: g.stateRaw });
          render();
          renderProps();
        }, {
          title: hasExpressionChecked
            ? "The source currently uses a non-literal SetGadgetState expression. Toggling here rewrites it to the original saved Checked form."
            : "Matches the original Checked property and patches SetGadgetState(...)."
        })
      )
    );
    if (hasExpressionChecked) {
      propsEl.appendChild(mutedNote("Non-literal Checked expressions are preserved while untouched. Editing them here rewrites the state to the original saved form or removes SetGadgetState(...)."));
    }
  }

  if (g.kind === "CustomGadget") {
    propsEl.appendChild(
      row(
        "SelectGadget",
        textInput(
          g.customSelectName ?? "",
          () => {},
          {
            disabled: true,
            title: "The original Property Grid shows a SelectGadget combo entry, but the persisted form only stores InitCode/CreateCode. The current value is derived from the parsed custom creation call name."
          }
        )
      )
    );
    propsEl.appendChild(
      row(
        "InitCode",
        textInput(
          g.customInitRaw ?? "",
          v => {
            const trimmed = v.trim();
            g.customInitRaw = trimmed || undefined;
            postCustomGadgetCode(g.id, { customInitRaw: trimmed.length ? trimmed : "" });
            renderProps();
          },
          { title: "Matches the original InitCode property and patches the custom gadget initialisation line." }
        )
      )
    );
    propsEl.appendChild(
      row(
        "CreateCode",
        textInput(
          g.customCreateRaw ?? "",
          v => {
            const trimmed = v.trim();
            if (!trimmed.length) {
              renderProps();
              return;
            }
            g.customCreateRaw = trimmed;
            postCustomGadgetCode(g.id, { customCreateRaw: trimmed });
            renderProps();
          },
          { title: "Matches the original CreateCode property and patches both the custom gadget marker template and the generated creation line." }
        )
      )
    );
    propsEl.appendChild(
      row(
        "Help",
        textInput(
          getCustomGadgetHelpDisplay(),
          () => {},
          {
            disabled: true,
            title: "Matches the original readonly Help field for custom gadgets."
          }
        )
      )
    );
    propsEl.appendChild(mutedNote("SelectGadget is not reconstructed from the saved form. InitCode and CreateCode are the persisted original custom-gadget fields."));
  }

  const hasEventGadgetBlock = Boolean(model.window?.hasEventGadgetBlock);
  const gadgetEventProcHint = hasEventGadgetBlock
    ? ""
    : EVENT_UI_HINT.eventGadgetMissing;
  propsEl.appendChild(
    row(
      "SelectProc",
      editableComboInput(
        g.eventProc ?? "",
        getProcedureSuggestions(),
        v => {
          if (!hasEventGadgetBlock) return;
          const trimmed = v.trim();
          g.eventProc = trimmed || undefined;
          post({
            type: "setGadgetEventProc",
            id: g.id,
            eventProc: trimmed.length ? trimmed : undefined
          });
          renderProps();
        },
        {
          disabled: !hasEventGadgetBlock,
          title: gadgetEventProcHint || "Matches the original editable SelectProc combo box; suggestions come from readable Procedure definitions.",
          placeholder: "Type or pick a procedure"
        }
      )
    )
  );
  if (!hasEventGadgetBlock) {
    propsEl.appendChild(mutedNote(gadgetEventProcHint));
  }

  if (g.parentId) {
    const btn = document.createElement("button");
    btn.textContent = "Select Parent";
    btn.onclick = () => {
      selection = { kind: "gadget", id: g.parentId! };
      render();
      renderListAndParentSelector();
      renderProps();
    };
    propsEl.appendChild(row("", btn));
  }

  propsEl.appendChild(row("X", numberInput(g.x, v => { g.x = asInt(v); postGadgetRect(g); render(); renderProps(); })));
  propsEl.appendChild(row("Y", numberInput(g.y, v => { g.y = asInt(v); postGadgetRect(g); render(); renderProps(); })));
  propsEl.appendChild(row("W", numberInput(g.w, v => { g.w = asInt(v); postGadgetRect(g); render(); renderProps(); })));
  propsEl.appendChild(row("H", numberInput(g.h, v => { g.h = asInt(v); postGadgetRect(g); render(); renderProps(); })));

  if (g.kind === "SplitterGadget") {
    propsEl.appendChild(
      row(
        "Splitter Position",
        numberInput(getEditableSplitterState(g), v => {
          const next = Math.trunc(v);
          const vertical = hasPbFlag(g.flagsExpr, "#PB_Splitter_Vertical");
          const limit = vertical ? g.w : g.h;
          if (!Number.isFinite(next) || next <= 0 || next >= limit) {
            alert(`Splitter position must be between 1 and ${Math.max(1, limit - 1)}.`);
            renderProps();
            return;
          }
          g.state = next;
          g.stateRaw = String(next);
          post({ type: "setGadgetStateRaw", id: g.id, stateRaw: String(next) });
          render();
          renderProps();
        })
      )
    );
    propsEl.appendChild(mutedNote("Matches the original SplitterPosition property and writes SetGadgetState(...)."));
  }

  // Items editor (minimal UI)
  propsEl.appendChild(section("Items"));
  const itemDraft = getGadgetItemDraft(g);
  const itemEditorOpen = isGadgetItemEditorOpen(g);
  if (itemDraft && itemEditorOpen) {
    propsEl.appendChild(row(
      "Item Text",
      textInput(itemDraft.text, v => updateGadgetItemEditorDraft({ text: v }), {
        title: "Patch the gadget item text without using a browser prompt."
      })
    ));
    propsEl.appendChild(row(
      "Position",
      textInput(itemDraft.posRaw, v => updateGadgetItemEditorDraft({ posRaw: v }), {
        title: "Patch the raw gadget item position without using a browser prompt."
      })
    ));
    propsEl.appendChild(row(
      "Image Raw",
      textInput(itemDraft.imageRaw, v => updateGadgetItemEditorDraft({ imageRaw: v }), {
        title: "Patch the optional gadget item image reference without using a browser prompt."
      })
    ));
    propsEl.appendChild(row(
      "Flags Raw",
      textInput(itemDraft.flagsRaw, v => updateGadgetItemEditorDraft({ flagsRaw: v }), {
        title: "Patch the optional gadget item flags without using a browser prompt."
      })
    ));

    const itemEditorActions = document.createElement("div");
    itemEditorActions.className = "miniActions";
    const saveItemBtn = document.createElement("button");
    saveItemBtn.textContent = itemDraft.sourceLine ? "Save Item" : "Insert Item";
    saveItemBtn.onclick = () => saveGadgetItemEditor(g);
    const cancelItemBtn = document.createElement("button");
    cancelItemBtn.textContent = "Cancel Item";
    cancelItemBtn.onclick = () => {
      closeGadgetItemEditor(g.id);
      renderProps();
    };
    itemEditorActions.appendChild(saveItemBtn);
    itemEditorActions.appendChild(cancelItemBtn);
    propsEl.appendChild(itemEditorActions);
  }

  const itemsBox = miniList();
  (g.items ?? []).forEach((it, idx) => {
    const label = `${idx}  ${it.text ?? it.textRaw ?? ""}`;
    const canPatch = typeof it.source?.line === "number";

    const itemImage = findImageEntryById(it.imageId);
    const itemImageHint = getImageReferenceHint(it.imageId, "gadget");

    itemsBox.appendChild(
      miniRow(
        label,
        canPatch
          ? () => {
              openGadgetItemEditor(g, it);
              renderProps();
            }
          : undefined,
        canPatch
          ? () => {
              openDestructiveAction({
                kind: "deleteGadgetItem",
                gadgetId: g.id,
                sourceLine: it.source!.line,
                message: `Delete item ${idx} from gadget '${g.id}'?`,
                confirmLabel: "Delete Item"
              });
            }
          : undefined,
        {
          label: "Image",
          onClick: itemImage ? () => selectImageById(itemImage.id) : undefined,
          disabled: !itemImage,
          title: itemImage ? "" : itemImageHint
        }
      )
    );
  });

  const addItemBtn = document.createElement("button");
  addItemBtn.textContent = "Add Item";
  addItemBtn.onclick = () => {
    openGadgetItemEditor(g);
    renderProps();
  };

  const itemActions = document.createElement("div");
  itemActions.className = "miniActions";
  itemActions.appendChild(addItemBtn);

  propsEl.appendChild(itemsBox);
  propsEl.appendChild(itemActions);
  if (pendingDestructiveAction?.kind === "deleteGadgetItem" && pendingDestructiveAction.gadgetId === g.id) {
    const pendingEl = createPendingDestructiveActionEl();
    if (pendingEl) propsEl.appendChild(pendingEl);
  }

  // Columns editor (minimal UI)
  propsEl.appendChild(section("Columns"));
  const columnDraft = getGadgetColumnDraft(g);
  const columnEditorOpen = isGadgetColumnEditorOpen(g);
  if (columnDraft && columnEditorOpen) {
    propsEl.appendChild(row(
      "Column Title",
      textInput(columnDraft.title, v => updateGadgetColumnEditorDraft({ title: v }), {
        title: "Patch the column title without using a browser prompt."
      })
    ));
    propsEl.appendChild(row(
      "Column Index",
      textInput(columnDraft.colRaw, v => updateGadgetColumnEditorDraft({ colRaw: v }), {
        title: "Patch the raw column index without using a browser prompt."
      })
    ));
    propsEl.appendChild(row(
      "Width",
      textInput(columnDraft.widthRaw, v => updateGadgetColumnEditorDraft({ widthRaw: v }), {
        title: "Patch the raw column width without using a browser prompt."
      })
    ));

    const columnEditorActions = document.createElement("div");
    columnEditorActions.className = "miniActions";
    const saveColumnBtn = document.createElement("button");
    saveColumnBtn.textContent = columnDraft.sourceLine ? "Save Column" : "Insert Column";
    saveColumnBtn.onclick = () => saveGadgetColumnEditor(g);
    const cancelColumnBtn = document.createElement("button");
    cancelColumnBtn.textContent = "Cancel Column";
    cancelColumnBtn.onclick = () => {
      closeGadgetColumnEditor(g.id);
      renderProps();
    };
    columnEditorActions.appendChild(saveColumnBtn);
    columnEditorActions.appendChild(cancelColumnBtn);
    propsEl.appendChild(columnEditorActions);
  }

  const colsBox = miniList();
  (g.columns ?? []).forEach((c, idx) => {
    const label = `${idx}  ${c.title ?? c.titleRaw ?? ""}  w:${c.widthRaw ?? ""}`;
    const canPatch = typeof c.source?.line === "number";

    colsBox.appendChild(
      miniRow(
        label,
        canPatch
          ? () => {
              openGadgetColumnEditor(g, c, idx);
              renderProps();
            }
          : undefined,
        canPatch
          ? () => {
              openDestructiveAction({
                kind: "deleteGadgetColumn",
                gadgetId: g.id,
                sourceLine: c.source!.line,
                message: `Delete column ${idx} from gadget '${g.id}'?`,
                confirmLabel: "Delete Column"
              });
            }
          : undefined
      )
    );
  });

  const addColBtn = document.createElement("button");
  addColBtn.textContent = "Add Column";
  addColBtn.onclick = () => {
    openGadgetColumnEditor(g);
    renderProps();
  };

  const colActions = document.createElement("div");
  colActions.className = "miniActions";
  colActions.appendChild(addColBtn);

  propsEl.appendChild(colsBox);
  propsEl.appendChild(colActions);
  if (pendingDestructiveAction?.kind === "deleteGadgetColumn" && pendingDestructiveAction.gadgetId === g.id) {
    const pendingEl = createPendingDestructiveActionEl();
    if (pendingEl) propsEl.appendChild(pendingEl);
  }
}

function createPendingImageReferencePickerEl() {
  if (!pendingImageReferencePicker) return null;
  const wrap = document.createElement("div");
  wrap.appendChild(createSubSection("Select Existing Image"));
  wrap.appendChild(row(
    "Image",
    selectInput(
      pendingImageReferencePicker.selectedImageId,
      (model.images ?? []).map(img => ({
        value: img.id,
        label: `${img.id} — ${img.inline ? "CatchImage" : "LoadImage"}(${img.firstParam}, ${img.imageRaw})`
      })),
      value => updateImageReferencePicker({ selectedImageId: value })
    )
  ));
  const selected = findImageEntryById(pendingImageReferencePicker.selectedImageId);
  wrap.appendChild(row("Current", readonlyInput(selected?.imageRaw ?? selected?.image ?? "")));
  const actions = document.createElement("div");
  actions.className = "miniActions";
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Assign";
  saveBtn.onclick = () => saveImageReferencePicker();
  actions.appendChild(saveBtn);
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => closeImageReferencePicker();
  actions.appendChild(cancelBtn);
  wrap.appendChild(actions);
  return wrap;
}

function createPendingImageAssignmentDraftEl() {
  if (!pendingImageAssignmentDraft) return null;
  const wrap = document.createElement("div");
  wrap.appendChild(createSubSection(pendingImageAssignmentDraft.mode === "create" ? "Create and Assign Image" : "Choose File and Assign Image"));
  if (pendingImageAssignmentDraft.mode === "create") {
    wrap.appendChild(row(
      "Kind",
      selectInput(
        pendingImageAssignmentDraft.inline ? "CatchImage" : "LoadImage",
        [
          { value: "LoadImage", label: "LoadImage" },
          { value: "CatchImage", label: "CatchImage" }
        ],
        value => updateImageAssignmentDraft({ inline: value === "CatchImage" })
      )
    ));
  }
  else {
    wrap.appendChild(row("Kind", readonlyInput("LoadImage")));
  }
  wrap.appendChild(row(
    "First Param",
    textInput(pendingImageAssignmentDraft.idRaw, value => updateImageAssignmentDraft({ idRaw: value }), {
      title: "Use either a fixed image id like #ImgOpen or #PB_Any."
    })
  ));
  if (pendingImageAssignmentDraft.idRaw.trim().toLowerCase() === "#pb_any") {
    wrap.appendChild(row(
      "Assigned Var",
      textInput(pendingImageAssignmentDraft.assignedVar, value => updateImageAssignmentDraft({ assignedVar: value }), {
        title: "Variable name receiving the #PB_Any image handle."
      })
    ));
  }
  if (pendingImageAssignmentDraft.mode === "create") {
    wrap.appendChild(row(
      "Image Raw",
      textInput(pendingImageAssignmentDraft.imageRaw, value => updateImageAssignmentDraft({ imageRaw: value }), {
        title: 'Raw second argument for LoadImage/CatchImage, for example "icons/open.png" or ?Label.'
      })
    ));
  }
  if (pendingImageAssignmentDraft.mode === "chooseFile" && pendingImageAssignmentDraft.target.kind === "gadget") {
    wrap.appendChild(row(
      "Resize",
      checkboxInput(
        pendingImageAssignmentDraft.resizeToImage,
        value => updateImageAssignmentDraft({ resizeToImage: value }),
        { title: "Resize the gadget to the selected image dimensions after creating the new LoadImage entry." }
      )
    ));
  }
  const actions = document.createElement("div");
  actions.className = "miniActions";
  const saveBtn = document.createElement("button");
  saveBtn.textContent = pendingImageAssignmentDraft.mode === "create" ? "Create" : "Continue";
  saveBtn.onclick = () => saveImageAssignmentDraft();
  actions.appendChild(saveBtn);
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => closeImageAssignmentDraft();
  actions.appendChild(cancelBtn);
  wrap.appendChild(actions);
  return wrap;
}

function createPendingImageInsertDraftEl() {
  if (!pendingImageInsertDraft) return null;
  const wrap = document.createElement("div");
  wrap.appendChild(createSubSection("New Image"));
  wrap.appendChild(row(
    "Kind",
    selectInput(
      pendingImageInsertDraft.inline ? "CatchImage" : "LoadImage",
      [
        { value: "LoadImage", label: "LoadImage" },
        { value: "CatchImage", label: "CatchImage" }
      ],
      value => updateImageInsertDraft({ inline: value === "CatchImage" })
    )
  ));
  wrap.appendChild(row(
    "First Param",
    textInput(pendingImageInsertDraft.idRaw, value => updateImageInsertDraft({ idRaw: value }), {
      title: "Use either a fixed image id like #ImgOpen or #PB_Any."
    })
  ));
  if (pendingImageInsertDraft.idRaw.trim().toLowerCase() === "#pb_any") {
    wrap.appendChild(row(
      "Assigned Var",
      textInput(pendingImageInsertDraft.assignedVar, value => updateImageInsertDraft({ assignedVar: value }), {
        title: "Variable name receiving the #PB_Any image handle."
      })
    ));
  }
  wrap.appendChild(row(
    "Image Raw",
    textInput(pendingImageInsertDraft.imageRaw, value => updateImageInsertDraft({ imageRaw: value }), {
      title: 'Raw second argument for LoadImage/CatchImage, for example "icons/open.png" or ?Label.'
    })
  ));
  const actions = document.createElement("div");
  actions.className = "miniActions";
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Add Image";
  saveBtn.onclick = () => saveImageInsertDraft();
  actions.appendChild(saveBtn);
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => closeImageInsertDraft();
  actions.appendChild(cancelBtn);
  wrap.appendChild(actions);
  return wrap;
}

function createSubSection(title: string) {
  const h = document.createElement("div");
  h.className = "subHeader";
  h.textContent = title;
  return h;
}

function row(label: string, input: HTMLElement) {
  const wrap = document.createElement("div");
  wrap.className = "row";
  const l = document.createElement("div");
  l.textContent = label;
  wrap.appendChild(l);
  wrap.appendChild(input);
  return wrap;
}

function inputWithActions(input: HTMLElement, ...actions: HTMLElement[]) {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "6px";
  wrap.style.width = "100%";
  input.style.flex = "1 1 auto";
  wrap.appendChild(input);
  for (const action of actions) {
    action.style.flex = "0 0 auto";
    wrap.appendChild(action);
  }
  return wrap;
}

function readonlyInput(value: string) {
  const i = document.createElement("input");
  i.value = value;
  i.readOnly = true;
  return i;
}


function mutedNote(message: string) {
  const d = document.createElement("div");
  d.className = "muted";
  d.textContent = message;
  return d;
}

function textInput(
  value: string,
  onChange: (v: string) => void,
  options?: { disabled?: boolean; title?: string; placeholder?: string }
) {
  const i = document.createElement("input");
  i.value = value;
  i.disabled = Boolean(options?.disabled);
  i.title = options?.title ?? "";
  i.placeholder = options?.placeholder ?? "";
  i.onchange = () => onChange(i.value);
  return i;
}

function editableComboInput(
  value: string,
  suggestions: string[],
  onChange: (v: string) => void,
  options?: { disabled?: boolean; title?: string; placeholder?: string }
) {
  const wrap = document.createElement("div");
  wrap.className = "comboInputWrap";

  const input = document.createElement("input");
  const listId = `pbfd-proc-list-${Math.random().toString(36).slice(2)}`;
  input.value = value;
  input.disabled = Boolean(options?.disabled);
  input.title = options?.title ?? "";
  input.placeholder = options?.placeholder ?? "";
  input.setAttribute("list", listId);
  input.onchange = () => onChange(input.value);

  const datalist = document.createElement("datalist");
  datalist.id = listId;
  for (const suggestion of suggestions) {
    const opt = document.createElement("option");
    opt.value = suggestion;
    datalist.appendChild(opt);
  }

  wrap.appendChild(input);
  wrap.appendChild(datalist);
  return wrap;
}

function selectInput(
  value: string,
  options: { value: string; label: string }[],
  onChange: (v: string) => void,
  config?: { disabled?: boolean; title?: string }
) {
  const select = document.createElement("select");
  select.disabled = Boolean(config?.disabled);
  select.title = config?.title ?? "";
  for (const option of options) {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    select.appendChild(opt);
  }
  select.value = value;
  select.onchange = () => onChange(select.value);
  return select;
}

function checkboxInput(
  value: boolean,
  onChange: (v: boolean) => void,
  options?: { disabled?: boolean; title?: string }
) {
  const i = document.createElement("input");
  i.type = "checkbox";
  i.checked = Boolean(value);
  i.disabled = Boolean(options?.disabled);
  i.title = options?.title ?? "";
  i.onchange = () => onChange(i.checked);
  return i;
}

function numberInput(value: number, onChange: (v: number) => void) {
  const i = document.createElement("input");
  i.type = "number";
  i.value = String(value);
  i.onchange = () => onChange(Number(i.value));
  return i;
}

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function clampPos(v: number): number {
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.trunc(v));
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function setupPanelResize() {
  const resizer = document.getElementById("panelResizer") as HTMLElement | null;
  if (!resizer) return;
  let dragging = false;
  let activePointerId: number | null = null;
  const applyWidth = (clientX: number) => {
    const nextWidth = clamp(window.innerWidth - clientX - 3, 300, Math.max(300, Math.min(900, window.innerWidth - 220)));
    document.documentElement.style.setProperty("--pbfd-panel-width", `${Math.trunc(nextWidth)}px`);
  };
  const onMove = (ev: PointerEvent) => {
    if (!dragging) return;
    applyWidth(ev.clientX);
  };
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove("dragging");
    document.body.style.cursor = "";
    if (activePointerId !== null) {
      resizer.releasePointerCapture?.(activePointerId);
      activePointerId = null;
    }
  };
  resizer.addEventListener("pointerdown", ev => {
    ev.preventDefault();
    dragging = true;
    activePointerId = ev.pointerId;
    resizer.classList.add("dragging");
    document.body.style.cursor = "col-resize";
    resizer.setPointerCapture?.(ev.pointerId);
    applyWidth(ev.clientX);
  });
  resizer.addEventListener("pointermove", onMove);
  resizer.addEventListener("pointerup", stop);
  resizer.addEventListener("pointercancel", stop);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
}

function asInt(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

resizeCanvas();
setupPanelResize();
vscode.postMessage({ type: "ready" });