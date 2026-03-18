type PreviewRect = { x: number; y: number; w: number; h: number };

type PreviewChromeMetrics = {
  panelHeight: number;
  scrollAreaWidth: number;
  splitterWidth: number;
  menuHeight: number;
  toolBarHeight: number;
  statusBarHeight: number;
};

function intersectRect(a: PreviewRect, b: PreviewRect): PreviewRect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  return {
    x,
    y,
    w: Math.max(0, right - x),
    h: Math.max(0, bottom - y)
  };
}

function rectContainsPoint(rect: PreviewRect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function isPointOnRectBorder(rect: PreviewRect, x: number, y: number, margin = 4): boolean {
  if (!rectContainsPoint(rect, x, y)) return false;
  return x <= rect.x + margin
    || x >= rect.x + rect.w - margin
    || y <= rect.y + margin
    || y >= rect.y + rect.h - margin;
}

function getScrollAreaBarSize(rect: PreviewRect, metrics: PreviewChromeMetrics): number {
  return Math.min(metrics.scrollAreaWidth, Math.max(12, Math.min(rect.w, rect.h) - 4));
}

function getScrollAreaVerticalBarRect(rect: PreviewRect, metrics: PreviewChromeMetrics): PreviewRect {
  const bar = getScrollAreaBarSize(rect, metrics);
  return {
    x: rect.x + rect.w - bar,
    y: rect.y,
    w: bar,
    h: Math.max(0, rect.h - bar)
  };
}

function getScrollAreaHorizontalBarRect(rect: PreviewRect, metrics: PreviewChromeMetrics): PreviewRect {
  const bar = getScrollAreaBarSize(rect, metrics);
  return {
    x: rect.x,
    y: rect.y + rect.h - bar,
    w: Math.max(0, rect.w - bar),
    h: bar
  };
}

function getScrollAreaMaxOffsetX(rect: PreviewRect, metrics: PreviewChromeMetrics, innerWidth?: number): number {
  const bar = getScrollAreaBarSize(rect, metrics);
  const viewportWidth = Math.max(0, rect.w - bar);
  const contentWidth = typeof innerWidth === "number" && innerWidth > 0 ? innerWidth : viewportWidth;
  return Math.max(0, contentWidth - viewportWidth);
}

function getScrollAreaMaxOffsetY(rect: PreviewRect, metrics: PreviewChromeMetrics, innerHeight?: number): number {
  const bar = getScrollAreaBarSize(rect, metrics);
  const viewportHeight = Math.max(0, rect.h - bar);
  const contentHeight = typeof innerHeight === "number" && innerHeight > 0 ? innerHeight : viewportHeight;
  return Math.max(0, contentHeight - viewportHeight);
}

function getScrollAreaVerticalThumbRect(
  rect: PreviewRect,
  metrics: PreviewChromeMetrics,
  innerHeight?: number,
  offsetY = 0
): PreviewRect {
  const track = getScrollAreaVerticalBarRect(rect, metrics);
  const maxOffset = getScrollAreaMaxOffsetY(rect, metrics, innerHeight);
  if (track.w <= 0 || track.h <= 0) return { x: track.x, y: track.y, w: 0, h: 0 };

  if (maxOffset <= 0) {
    return { x: track.x, y: track.y, w: track.w, h: track.h };
  }

  const bar = getScrollAreaBarSize(rect, metrics);
  const viewportHeight = Math.max(0, rect.h - bar);
  const contentHeight = typeof innerHeight === "number" && innerHeight > 0 ? innerHeight : viewportHeight;
  const trackHeight = Math.max(1, track.h);
  const thumbHeight = Math.max(14, Math.min(trackHeight, Math.round((viewportHeight / contentHeight) * trackHeight)));
  const travel = Math.max(0, trackHeight - thumbHeight);
  const clampedOffset = Math.max(0, Math.min(offsetY, maxOffset));
  const thumbY = track.y + Math.round((clampedOffset / maxOffset) * travel);
  return { x: track.x, y: thumbY, w: track.w, h: thumbHeight };
}

function getScrollAreaHorizontalThumbRect(
  rect: PreviewRect,
  metrics: PreviewChromeMetrics,
  innerWidth?: number,
  offsetX = 0
): PreviewRect {
  const track = getScrollAreaHorizontalBarRect(rect, metrics);
  const maxOffset = getScrollAreaMaxOffsetX(rect, metrics, innerWidth);
  if (track.w <= 0 || track.h <= 0) return { x: track.x, y: track.y, w: 0, h: 0 };

  if (maxOffset <= 0) {
    return { x: track.x, y: track.y, w: track.w, h: track.h };
  }

  const bar = getScrollAreaBarSize(rect, metrics);
  const viewportWidth = Math.max(0, rect.w - bar);
  const contentWidth = typeof innerWidth === "number" && innerWidth > 0 ? innerWidth : viewportWidth;
  const trackWidth = Math.max(1, track.w);
  const thumbWidth = Math.max(14, Math.min(trackWidth, Math.round((viewportWidth / contentWidth) * trackWidth)));
  const travel = Math.max(0, trackWidth - thumbWidth);
  const clampedOffset = Math.max(0, Math.min(offsetX, maxOffset));
  const thumbX = track.x + Math.round((clampedOffset / maxOffset) * travel);
  return { x: thumbX, y: track.y, w: thumbWidth, h: track.h };
}

function getSplitterBarRect(
  splitterRect: PreviewRect,
  vertical: boolean,
  splitterWidth: number,
  state?: number
): PreviewRect {
  const bar = splitterWidth;
  const range = Math.max(0, (vertical ? splitterRect.w : splitterRect.h) - bar);
  const rawPos = typeof state === "number" ? Math.trunc(state) : Math.trunc(range / 2);
  const pos = Math.max(0, Math.min(rawPos, range));
  return vertical
    ? { x: splitterRect.x + pos, y: splitterRect.y, w: bar, h: splitterRect.h }
    : { x: splitterRect.x, y: splitterRect.y + pos, w: splitterRect.w, h: bar };
}

function getMenuBarRect(windowRect: PreviewRect, titleBarHeight: number, metrics: PreviewChromeMetrics): PreviewRect {
  return {
    x: windowRect.x,
    y: windowRect.y + Math.max(0, titleBarHeight),
    w: windowRect.w,
    h: metrics.menuHeight
  };
}

function getToolBarRect(
  windowRect: PreviewRect,
  titleBarHeight: number,
  hasMenu: boolean,
  metrics: PreviewChromeMetrics
): PreviewRect {
  return {
    x: windowRect.x,
    y: windowRect.y + Math.max(0, titleBarHeight) + (hasMenu ? metrics.menuHeight : 0),
    w: windowRect.w,
    h: metrics.toolBarHeight
  };
}

function getStatusBarRect(windowRect: PreviewRect, metrics: PreviewChromeMetrics): PreviewRect {
  return {
    x: windowRect.x,
    y: windowRect.y + Math.max(0, windowRect.h - metrics.statusBarHeight),
    w: windowRect.w,
    h: Math.min(metrics.statusBarHeight, Math.max(0, windowRect.h))
  };
}

function getWindowContentRect(
  windowRect: PreviewRect,
  titleBarHeight: number,
  hasMenu: boolean,
  hasToolbar: boolean,
  hasStatusbar: boolean,
  metrics: PreviewChromeMetrics
): PreviewRect {
  const top = Math.max(0, titleBarHeight)
    + (hasMenu ? metrics.menuHeight : 0)
    + (hasToolbar ? metrics.toolBarHeight : 0);
  const bottom = hasStatusbar ? metrics.statusBarHeight : 0;
  return {
    x: windowRect.x,
    y: windowRect.y + top,
    w: windowRect.w,
    h: Math.max(0, windowRect.h - top - bottom)
  };
}

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
  text?: string;
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
  stateRaw?: string;
  state?: number;
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
  title?: string;
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
  setGadgetEventProc: "setGadgetEventProc",
  setGadgetImageRaw: "setGadgetImageRaw",
  setGadgetStateRaw: "setGadgetStateRaw",
  setWindowRect: "setWindowRect",
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
  chooseFileAndAssignStatusBarFieldImage: "chooseFileAndAssignStatusBarFieldImage"
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
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetEventProc; id: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetImageRaw; id: string; imageRaw: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetStateRaw; id: string; stateRaw: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowRect; id: string; x: number; y: number; w: number; h: number }
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
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignStatusBarFieldImage; statusBarId: string; sourceLine: number; widthRaw: string; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignMenuEntryImage; menuId: string; sourceLine: number; kind: string; idRaw?: string; textRaw?: string; shortcut?: string; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignToolBarEntryImage; toolBarId: string; sourceLine: number; kind: string; idRaw?: string; toggle?: boolean; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignStatusBarFieldImage; statusBarId: string; sourceLine: number; widthRaw: string; newImageIdRaw: string; newAssignedVar?: string };

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

let pendingImageEditor: PendingImageEditor | null = null;

const expanded = new Map<string, boolean>();
const panelActiveItems = new Map<string, number>();
const scrollAreaOffsets = new Map<string, { x: number; y: number }>();

type PreviewEntryRect = PreviewRect & { ownerId: string; index: number };
type PreviewMenuFooterRect = PreviewRect & { menuId: string; parentIndex: number };
type PreviewMenuAddRect = PreviewRect & { menuId: string };
type PreviewToolBarAddRect = PreviewRect & { toolBarId: string };
type PreviewStatusBarAddRect = PreviewRect & { statusBarId: string };
type MenuEntryMovePlacement = "before" | "after" | "appendChild";

type MenuEntryMoveTarget = {
  targetSourceLine: number;
  placement: MenuEntryMovePlacement;
  indicatorRect: PreviewRect;
  indicatorOrientation: "horizontal" | "vertical";
};

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

type PbfdSymbols = {
  menuEntryKinds: readonly string[];
  toolBarEntryKinds: readonly string[];
  containerGadgetKinds: readonly string[];
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

function promptImageReferenceFromModel(currentImageId?: string): { imageId: string; imageRaw: string } | undefined {
  const images = model.images ?? [];
  if (!images.length) {
    alert("No image entries are defined in this form.");
    return undefined;
  }

  const options = images
    .map((img, index) => {
      const procName = img.inline ? "CatchImage" : "LoadImage";
      const assignPrefix = img.pbAny && img.variable ? `${img.variable} = ` : "";
      return `${index + 1}. ${img.id}  ${assignPrefix}${procName}(${img.firstParam}, ${img.imageRaw})`;
    })
    .join("\n");

  const defaultValue = currentImageId && findImageEntryById(currentImageId)
    ? currentImageId
    : images[0]?.id;
  const value = prompt(`Select image by id or number:\n\n${options}`, defaultValue ?? "");
  if (value === null) return undefined;

  const trimmed = value.trim();
  if (!trimmed.length) return undefined;

  const selected = /^\d+$/.test(trimmed)
    ? images[Number(trimmed) - 1]
    : images.find(img => img.id === trimmed);
  if (!selected) {
    alert(`Image '${trimmed}' was not found in this form.`);
    return undefined;
  }

  return {
    imageId: selected.id,
    imageRaw: `ImageID(${selected.id})`
  };
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

type Handle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

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
  renderDiagnostics();
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
  const c = clampRect(r.x, r.y, r.w, r.h, minW, minH);
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
  return clampRect(nx, ny, nw, nh, minW, minH);
}

function applyDropSnapRectInPlace(r: RectLike, minW: number, minH: number) {
  if (!shouldSnapDrop()) return;

  const gs = settings.gridSize;
  r.x = snapValue(r.x, gs);
  r.y = snapValue(r.y, gs);
  r.w = snapValue(r.w, gs);
  r.h = snapValue(r.h, gs);

  const c = clampRect(r.x, r.y, r.w, r.h, minW, minH);
  r.x = c.x;
  r.y = c.y;
  r.w = c.w;
  r.h = c.h;
}

type DragState =
  | { target: "gadget"; mode: "move"; id: string; startMx: number; startMy: number; startX: number; startY: number }
  | {
      target: "menuEntry";
      menuId: string;
      entryIndex: number;
      sourceLine: number;
      kind: string;
      startMx: number;
      startMy: number;
      moved: boolean;
      moveTarget: MenuEntryMoveTarget | null;
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
  | { target: "window"; mode: "move"; startMx: number; startMy: number; startX: number; startY: number }
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
    panelActiveItems.clear();
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
  return getWindowContentRect(
    getWindowLocalRect(),
    Math.max(0, asInt(settings.titleBarHeight)),
    hasParsedMenuChrome(),
    hasParsedToolbarChrome(),
    hasParsedStatusbarChrome(),
    metrics
  );
}

function getMenuBarRectGlobal(wr: { x: number; y: number; w: number; h: number; tbH: number }, metrics: PreviewChromeMetrics): PreviewRect | null {
  if (!hasParsedMenuChrome()) return null;
  return getMenuBarRect({ x: wr.x, y: wr.y, w: wr.w, h: wr.h }, wr.tbH, metrics);
}

function getToolBarRectGlobal(wr: { x: number; y: number; w: number; h: number; tbH: number }, metrics: PreviewChromeMetrics): PreviewRect | null {
  if (!hasParsedToolbarChrome()) return null;
  return getToolBarRect({ x: wr.x, y: wr.y, w: wr.w, h: wr.h }, wr.tbH, hasParsedMenuChrome(), metrics);
}

function getStatusBarRectGlobal(wr: { x: number; y: number; w: number; h: number; tbH: number }, metrics: PreviewChromeMetrics): PreviewRect | null {
  if (!hasParsedStatusbarChrome()) return null;
  return getStatusBarRect({ x: wr.x, y: wr.y, w: wr.w, h: wr.h }, metrics);
}

function hitWindow(mx: number, my: number): boolean {
  const wr = getWinRect();
  if (!wr) return false;
  return mx >= wr.x && mx <= wr.x + wr.w && my >= wr.y && my <= wr.y + wr.h;
}

function toLocal(mx: number, my: number): { lx: number; ly: number } {
  const wr = getWinRect();
  const ox = wr?.x ?? 0;
  const oy = wr?.y ?? 0;
  return { lx: mx - ox, ly: my - oy };
}

function toGlobal(lx: number, ly: number): { gx: number; gy: number } {
  const wr = getWinRect();
  const ox = wr?.x ?? 0;
  const oy = wr?.y ?? 0;
  return { gx: lx + ox, gy: ly + oy };
}

function hitTestGadget(mx: number, my: number): Gadget | null {
  if (!hitWindow(mx, my)) return null;

  const { lx, ly } = toLocal(mx, my);
  const metrics = getPreviewChromeMetrics();
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

function handlePointsLocal(x: number, y: number, w: number, h: number): Array<[Handle, number, number]> {
  return [
    ["nw", x, y],
    ["n", x + w / 2, y],
    ["ne", x + w, y],
    ["w", x, y + h / 2],
    ["e", x + w, y + h / 2],
    ["sw", x, y + h],
    ["s", x + w / 2, y + h],
    ["se", x + w, y + h]
  ];
}

function hitHandlePoints(points: Array<[Handle, number, number]>, mx: number, my: number): Handle | null {
  const half = HANDLE_HIT / 2;
  for (const [h, px, py] of points) {
    if (mx >= px - half && mx <= px + half && my >= py - half && my <= py + half) {
      return h;
    }
  }
  return null;
}

function hitHandleGadget(g: Gadget, mx: number, my: number): Handle | null {
  const metrics = getPreviewChromeMetrics();
  const layout = getGadgetPreviewLayout(g, metrics);
  if (!layout.visible) return null;
  const { gx, gy } = toGlobal(layout.rect.x, layout.rect.y);
  const pts = handlePointsLocal(gx, gy, layout.rect.w, layout.rect.h);
  return hitHandlePoints(pts, mx, my);
}

function hitHandleWindow(mx: number, my: number): Handle | null {
  const wr = getWinRect();
  if (!wr) return null;

  // Handles are around the outer window rect
  const pts = handlePointsLocal(wr.x, wr.y, wr.w, wr.h);
  return hitHandlePoints(pts, mx, my);
}

function isInTitleBar(mx: number, my: number): boolean {
  const wr = getWinRect();
  if (!wr) return false;
  const tbH = wr.tbH;
  if (tbH <= 0) return false;

  return mx >= wr.x && mx <= wr.x + wr.w && my >= wr.y && my <= wr.y + tbH;
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

function clampRect(
  x: number,
  y: number,
  w: number,
  h: number,
  minW: number,
  minH: number
): { x: number; y: number; w: number; h: number } {
  let nx = asInt(x);
  let ny = asInt(y);
  let nw = asInt(w);
  let nh = asInt(h);

  if (nw < minW) nw = minW;
  if (nh < minH) nh = minH;

  return { x: nx, y: ny, w: nw, h: nh };
}

function applyResize(
  x: number,
  y: number,
  w: number,
  h: number,
  dx: number,
  dy: number,
  handle: Handle,
  minW: number,
  minH: number
): { x: number; y: number; w: number; h: number } {
  let nx = x;
  let ny = y;
  let nw = w;
  let nh = h;

  const west = handle === "nw" || handle === "w" || handle === "sw";
  const east = handle === "ne" || handle === "e" || handle === "se";
  const north = handle === "nw" || handle === "n" || handle === "ne";
  const south = handle === "sw" || handle === "s" || handle === "se";

  if (east) nw = w + dx;
  if (south) nh = h + dy;

  if (west) {
    nx = x + dx;
    nw = w - dx;
  }

  if (north) {
    ny = y + dy;
    nh = h - dy;
  }

  if (nw < minW) {
    if (west) nx = x + (w - minW);
    nw = minW;
  }

  if (nh < minH) {
    if (north) ny = y + (h - minH);
    nh = minH;
  }

  return clampRect(nx, ny, nw, nh, minW, minH);
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

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const panelTabHit = hitTestPanelTab(mx, my, getPreviewChromeMetrics());
  if (panelTabHit) {
    panelActiveItems.set(panelTabHit.panel.id, panelTabHit.index);
    selection = { kind: "gadget", id: panelTabHit.panel.id };
    drag = null;
    canvas.style.cursor = "default";
    renderSelectionUiWithoutParentSelector();
    return;
  }

  const menuAddHit = hitTestMenuAddButton(mx, my);
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

  const toolBarAddHit = hitTestToolBarAddButton(mx, my);
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

  const statusBarAddHit = hitTestStatusBarAddButton(mx, my);
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

  const footerHit = hitTestMenuFooter(mx, my, getPreviewChromeMetrics());
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

  const topLevelChromeHit = hitTestTopLevelChrome(mx, my, getPreviewChromeMetrics());
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

  const chromeHit = hitTestPreviewChrome(mx, my, getPreviewChromeMetrics());
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
        startY: g.y
      };
      canvas.style.cursor = "move";
    } else if (chromeHit.zone === "scrollAreaVBar" || chromeHit.zone === "scrollAreaHBar") {
      const metrics = getPreviewChromeMetrics();
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
        startY: g.y
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
        startY: g.y
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
        startY: wr.y
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

    const topLevelChromeHit = hitTestTopLevelChrome(mx, my, getPreviewChromeMetrics());
    if (topLevelChromeHit) {
      canvas.style.cursor = "default";
      return;
    }

    const chromeHit = hitTestPreviewChrome(mx, my, getPreviewChromeMetrics());
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
    const metrics = getPreviewChromeMetrics();
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
    d.moveTarget = moved ? getMenuEntryMoveTarget(d.menuId, d.entryIndex, mx, my) : null;
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
      const r0 = applyResize(d.startX, d.startY, d.startW, d.startH, dx, dy, d.handle, MIN_GADGET_W, MIN_GADGET_H);

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
    const r0 = applyResize(d.startX, d.startY, d.startW, d.startH, dx, dy, d.handle, MIN_WIN_W, MIN_WIN_H);

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
      applyDropSnapRectInPlace(g, MIN_GADGET_W, MIN_GADGET_H);
      postGadgetRect(g);
    }
  } else {
    if (model.window) {
      applyDropSnapRectInPlace(model.window, MIN_WIN_W, MIN_WIN_H);
      postWindowRect();
    }
  }

  drag = null;
});

function getPreviewChromeMetrics(): PreviewChromeMetrics {
  const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();

  if (ua.includes("mac")) {
    return {
      panelHeight: 31,
      scrollAreaWidth: 14,
      splitterWidth: 12,
      menuHeight: 23,
      toolBarHeight: 36,
      statusBarHeight: 24
    };
  }

  if (ua.includes("linux")) {
    return {
      panelHeight: 29,
      scrollAreaWidth: 20,
      splitterWidth: 9,
      menuHeight: 28,
      toolBarHeight: 38,
      statusBarHeight: 26
    };
  }

  return {
    panelHeight: 22,
    scrollAreaWidth: 20,
    splitterWidth: 9,
    menuHeight: 22,
    toolBarHeight: 24,
    statusBarHeight: 23
  };
}

function hasPbFlag(flagsExpr: string | undefined, flag: string): boolean {
  if (!flagsExpr) return false;
  const parts = flagsExpr.split("|").map((part) => part.trim());
  return parts.includes(flag);
}

function unquotePbString(raw: string | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

type GadgetPreviewLayout = {
  rect: PreviewRect;
  clip: PreviewRect;
  visible: boolean;
};

type PanelTabRect = {
  index: number;
  label: string;
  rect: PreviewRect;
  active: boolean;
};

type PreviewChromeHitZone = "containerBorder" | "panelHeader" | "scrollAreaVBar" | "scrollAreaHBar" | "splitterBar";

type PreviewChromeHit = {
  gadget: Gadget;
  zone: PreviewChromeHitZone;
};

type TopLevelChromeHit =
  | { selection: { kind: "menu"; id: string }; rect: PreviewRect }
  | { selection: { kind: "menuEntry"; menuId: string; entryIndex: number }; rect: PreviewRect }
  | { selection: { kind: "toolbar"; id: string }; rect: PreviewRect }
  | { selection: { kind: "toolBarEntry"; toolBarId: string; entryIndex: number }; rect: PreviewRect }
  | { selection: { kind: "statusbar"; id: string }; rect: PreviewRect }
  | { selection: { kind: "statusBarField"; statusBarId: string; fieldIndex: number }; rect: PreviewRect };

function hitTestTopLevelChrome(mx: number, my: number, metrics: PreviewChromeMetrics): TopLevelChromeHit | null {
  const wr = getWinRect();
  if (!wr || !hitWindow(mx, my)) return null;

  const statusbar = getPrimaryStatusbar();
  const statusbarRect = getStatusBarRectGlobal(wr, metrics);
  if (statusbar && statusbarRect && rectContainsPoint(statusbarRect, mx, my)) {
    const fieldHit = statusBarFieldPreviewRects.find(entry => rectContainsPoint(entry, mx, my));
    if (fieldHit) {
      return { selection: { kind: "statusBarField", statusBarId: fieldHit.ownerId, fieldIndex: fieldHit.index }, rect: fieldHit };
    }
    return { selection: { kind: "statusbar", id: statusbar.id }, rect: statusbarRect };
  }

  const menu = getPrimaryMenu();
  const menuRect = getMenuBarRectGlobal(wr, metrics);
  if (menu && menuRect && rectContainsPoint(menuRect, mx, my)) {
    const entryHit = menuEntryPreviewRects.find(entry => rectContainsPoint(entry, mx, my));
    if (entryHit) {
      return { selection: { kind: "menuEntry", menuId: entryHit.ownerId, entryIndex: entryHit.index }, rect: entryHit };
    }
    return { selection: { kind: "menu", id: menu.id }, rect: menuRect };
  }

  const toolbar = getPrimaryToolbar();
  const toolbarRect = getToolBarRectGlobal(wr, metrics);
  if (toolbar && toolbarRect && rectContainsPoint(toolbarRect, mx, my)) {
    const entryHit = toolBarEntryPreviewRects.find(entry => rectContainsPoint(entry, mx, my));
    if (entryHit) {
      return { selection: { kind: "toolBarEntry", toolBarId: entryHit.ownerId, entryIndex: entryHit.index }, rect: entryHit };
    }
    return { selection: { kind: "toolbar", id: toolbar.id }, rect: toolbarRect };
  }

  return null;
}

function getGadgetById(id: string | undefined): Gadget | undefined {
  if (!id) return undefined;
  return model.gadgets.find((g) => g.id === id);
}

function rectIntersects(a: PreviewRect, b: PreviewRect): boolean {
  const i = intersectRect(a, b);
  return i.w > 0 && i.h > 0;
}

function getPanelActiveItem(panel: Gadget): number {
  const tabCount = panel.items?.length ?? 0;
  const stored = panelActiveItems.get(panel.id);
  if (typeof stored === "number" && stored >= 0 && stored < Math.max(1, tabCount)) {
    return stored;
  }
  return 0;
}

function getScrollAreaPreviewOffset(gadgetId: string): { x: number; y: number } {
  const stored = scrollAreaOffsets.get(gadgetId);
  if (stored) return stored;
  return { x: 0, y: 0 };
}

function getScrollAreaOffsetX(g: Gadget, rect: PreviewRect, metrics: PreviewChromeMetrics): number {
  return clamp(getScrollAreaPreviewOffset(g.id).x, 0, getScrollAreaMaxOffsetX(rect, metrics, g.min));
}

function getScrollAreaOffsetY(g: Gadget, rect: PreviewRect, metrics: PreviewChromeMetrics): number {
  return clamp(getScrollAreaPreviewOffset(g.id).y, 0, getScrollAreaMaxOffsetY(rect, metrics, g.max));
}

function setScrollAreaPreviewOffset(g: Gadget, rect: PreviewRect, metrics: PreviewChromeMetrics, nextX: number, nextY: number) {
  const clampedX = clamp(nextX, 0, getScrollAreaMaxOffsetX(rect, metrics, g.min));
  const clampedY = clamp(nextY, 0, getScrollAreaMaxOffsetY(rect, metrics, g.max));
  if (clampedX === 0 && clampedY === 0) {
    scrollAreaOffsets.delete(g.id);
    return;
  }
  scrollAreaOffsets.set(g.id, { x: clampedX, y: clampedY });
}

function getPanelTabRects(
  ctx: CanvasRenderingContext2D,
  g: Gadget,
  rect: PreviewRect,
  metrics: PreviewChromeMetrics
): PanelTabRect[] {
  const panelHeight = Math.min(metrics.panelHeight, Math.max(18, rect.h));
  const activeIndex = getPanelActiveItem(g);
  const tabs = g.items ?? [];
  const tabRects: PanelTabRect[] = [];
  let tabX = rect.x;

  for (let i = 0; i < tabs.length; i++) {
    const label = (tabs[i].text ?? unquotePbString(tabs[i].textRaw)) || `Tab ${i}`;
    const tabW = Math.max(46, Math.ceil(ctx.measureText(label).width) + 14);
    const active = i === activeIndex;
    const tabH = Math.max(16, panelHeight - (active ? 1 : 4));
    const tabY = rect.y + (active ? 0 : 2);
    const nextRight = tabX + tabW;

    if (tabX >= rect.x + rect.w - 12) break;

    tabRects.push({
      index: i,
      label,
      active,
      rect: {
        x: tabX,
        y: tabY,
        w: Math.max(0, Math.min(tabW, rect.x + rect.w - tabX)),
        h: tabH
      }
    });

    tabX = nextRight;
  }

  return tabRects;
}

function getContentRectForGadget(
  g: Gadget,
  rect: PreviewRect,
  metrics: PreviewChromeMetrics
): PreviewRect {
  switch (g.kind) {
    case "PanelGadget": {
      const panelHeight = Math.min(metrics.panelHeight, Math.max(18, rect.h));
      return { x: rect.x, y: rect.y + panelHeight, w: rect.w, h: Math.max(0, rect.h - panelHeight) };
    }

    case "ScrollAreaGadget": {
      const bar = getScrollAreaBarSize(rect, metrics);
      return { x: rect.x, y: rect.y, w: Math.max(0, rect.w - bar), h: Math.max(0, rect.h - bar) };
    }

    default:
      return rect;
  }
}

function getSplitterPaneRect(splitter: Gadget, splitterRect: PreviewRect, childId: string, metrics: PreviewChromeMetrics): PreviewRect {
  const vertical = hasPbFlag(splitter.flagsExpr, "#PB_Splitter_Vertical");
  const bar = metrics.splitterWidth;
  const range = Math.max(0, (vertical ? splitterRect.w : splitterRect.h) - bar);
  const rawPos = typeof splitter.state === "number" ? Math.trunc(splitter.state) : Math.trunc(range / 2);
  const pos = clamp(rawPos, 0, range);

  if (childId === splitter.gadget1Id) {
    return vertical
      ? { x: splitterRect.x, y: splitterRect.y, w: pos, h: splitterRect.h }
      : { x: splitterRect.x, y: splitterRect.y, w: splitterRect.w, h: pos };
  }

  if (childId === splitter.gadget2Id) {
    return vertical
      ? { x: splitterRect.x + pos + bar, y: splitterRect.y, w: Math.max(0, splitterRect.w - pos - bar), h: splitterRect.h }
      : { x: splitterRect.x, y: splitterRect.y + pos + bar, w: splitterRect.w, h: Math.max(0, splitterRect.h - pos - bar) };
  }

  return splitterRect;
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
      const paneRect = getSplitterPaneRect(splitter, splitterLayout.rect, g.id, metrics);
      rect = paneRect;
      clip = intersectRect(splitterLayout.clip, paneRect);
      visible = splitterLayout.visible && clip.w > 0 && clip.h > 0;
    }
  } else if (g.parentId) {
    const parent = getGadgetById(g.parentId);
    if (parent) {
      const parentLayout = getGadgetPreviewLayout(parent, metrics, cache, visiting);
      const parentContentRect = getContentRectForGadget(parent, parentLayout.rect, metrics);
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

function hitTestMenuFooter(mx: number, my: number, metrics: PreviewChromeMetrics): PreviewMenuFooterRect | null {
  const wr = getWinRect();
  if (!wr || !hitWindow(mx, my)) return null;

  const menu = getPrimaryMenu();
  const menuRect = getMenuBarRectGlobal(wr, metrics);
  if (!menu || !menuRect) return null;

  return menuFooterPreviewRects.find(entry => rectContainsPoint(entry, mx, my)) ?? null;
}

function hitTestMenuAddButton(mx: number, my: number): PreviewMenuAddRect | null {
  return menuAddPreviewRect && rectContainsPoint(menuAddPreviewRect, mx, my) ? menuAddPreviewRect : null;
}

function hitTestToolBarAddButton(mx: number, my: number): PreviewToolBarAddRect | null {
  return toolBarAddPreviewRect && rectContainsPoint(toolBarAddPreviewRect, mx, my) ? toolBarAddPreviewRect : null;
}

function hitTestStatusBarAddButton(mx: number, my: number): PreviewStatusBarAddRect | null {
  return statusBarAddPreviewRect && rectContainsPoint(statusBarAddPreviewRect, mx, my) ? statusBarAddPreviewRect : null;
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
  const viewportW = Math.max(0, w - bar);
  const viewportH = Math.max(0, h - bar);
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

function getMenuPreviewLabel(entry: MenuEntry): string {
  if (entry.kind === "MenuBar" || entry.kind === "CloseSubMenu") return "";
  return (entry.text ?? unquotePbString(entry.textRaw) ?? entry.idRaw ?? entry.kind).trim();
}

function getMenuEntryLevel(entry: MenuEntry | undefined): number {
  return Math.max(0, entry?.level ?? 0);
}

function getMenuEntryRect(menuId: string, entryIndex: number): PreviewEntryRect | undefined {
  return menuEntryPreviewRects.find(entry => entry.ownerId === menuId && entry.index === entryIndex);
}

function getMenuFooterRect(menuId: string, parentIndex: number): PreviewMenuFooterRect | undefined {
  return menuFooterPreviewRects.find(entry => entry.menuId === menuId && entry.parentIndex === parentIndex);
}

function getDefaultMenuItemInsertArgs(menu: MenuModel): { idRaw: string; textRaw: string } {
  let logicalCount = 0;
  for (const entry of menu.entries ?? []) {
    if (entry.kind === "CloseSubMenu") continue;
    logicalCount += 1;
  }

  const nextIndex = logicalCount + 1;
  return {
    idRaw: `#MenuItem_${nextIndex}`,
    textRaw: toPbString(`MenuItem${nextIndex}`)
  };
}

function isBoundToolBarTooltipEntry(toolBar: ToolbarModel, entryIndex: number): boolean {
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

function shouldShowToolBarStructureEntry(toolBar: ToolbarModel, entryIndex: number): boolean {
  const entry = toolBar.entries?.[entryIndex];
  if (!entry) return false;
  if (entry.kind !== "ToolBarToolTip") return true;
  return !isBoundToolBarTooltipEntry(toolBar, entryIndex);
}

function getVisibleToolBarEntryCount(toolBar: ToolbarModel): number {
  let count = 0;
  for (let i = 0; i < (toolBar.entries?.length ?? 0); i++) {
    if (!shouldShowToolBarStructureEntry(toolBar, i)) continue;
    count += 1;
  }
  return count;
}

function getDefaultToolBarInsertId(toolBar: ToolbarModel): string {
  let logicalCount = 0;
  for (const entry of toolBar.entries ?? []) {
    if (entry.kind === "ToolBarToolTip") continue;
    logicalCount += 1;
  }

  return `#Toolbar_${logicalCount}`;
}

function canEditToolBarTooltip(entry: ToolBarEntry): boolean {
  return entry.kind !== "ToolBarSeparator"
    && entry.kind !== "ToolBarToolTip"
    && typeof entry.idRaw === "string"
    && entry.idRaw.trim().length > 0;
}

function getToolBarPreviewInsertArgs(
  toolBar: ToolbarModel,
  action: "button" | "toggle" | "separator"
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

function getStatusBarPreviewInsertArgs(
  action: "image" | "label" | "progress"
): { widthRaw: string; textRaw?: string; progressBar?: boolean; progressRaw?: string } {
  switch (action) {
    case "image":
      return { widthRaw: "50" };
    case "label":
      return { widthRaw: "50", textRaw: toPbString("Label") };
    case "progress":
      return { widthRaw: "50", progressBar: true, progressRaw: "0" };
  }
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

function getStatusBarFieldDisplayKind(field: StatusbarField): string {
  if (field.progressBar) return "Progress";
  if ((field.imageRaw ?? "").trim().length) return "Image";
  if ((field.textRaw ?? "").trim().length) return "Label";
  return "Empty";
}

function getStatusBarFieldDisplaySummary(field: StatusbarField): string {
  const kind = getStatusBarFieldDisplayKind(field);
  switch (kind) {
    case "Progress":
      return `${kind} ${field.progressRaw ?? "0"}`;
    case "Image":
      return `${kind} ${field.imageId ?? field.imageRaw ?? ""}`.trim();
    case "Label":
      return `${kind} ${field.text ?? field.textRaw ?? ""}`.trim();
    default:
      return kind;
  }
}

function getDirectMenuChildIndices(menu: MenuModel, parentIndex: number): number[] {
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

function getMenuAncestorChain(menu: MenuModel, entryIndex: number): number[] {
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

function getMenuVisibleEntries(menu: MenuModel): Array<{ index: number; entry: MenuEntry; rect: PreviewEntryRect }> {
  const result: Array<{ index: number; entry: MenuEntry; rect: PreviewEntryRect }> = [];

  for (const [index, entry] of menu.entries.entries()) {
    const rect = getMenuEntryRect(menu.id, index);
    if (!rect) continue;
    result.push({ index, entry, rect });
  }

  return result;
}

function getMenuEntrySourceLine(menu: MenuModel, entryIndex: number): number | undefined {
  return menu.entries?.[entryIndex]?.source?.line;
}

function getMenuEntryBlockEndIndex(entries: MenuEntry[], entryIndex: number): number {
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

function getPredictedMenuEntryMoveIndex(
  menu: MenuModel,
  sourceEntryIndex: number,
  targetEntryIndex: number,
  placement: MenuEntryMovePlacement
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

function getMenuEntryMoveTarget(menuId: string, sourceEntryIndex: number, mx: number, my: number): MenuEntryMoveTarget | null {
  const menu = (model.menus ?? []).find(entry => entry.id === menuId);
  if (!menu) return null;

  const winRect = getWinRect();
  const metrics = getPreviewChromeMetrics();
  const menuBarRect = winRect ? getMenuBarRectGlobal(winRect, metrics) : null;
  const menuBarBottom = menuBarRect ? menuBarRect.y + menuBarRect.h : 0;

  const visibleEntries = getMenuVisibleEntries(menu);
  if (!visibleEntries.length) return null;

  const firstVisibleRoot = visibleEntries.find(item => getMenuEntryLevel(item.entry) === 0);
  if (
    firstVisibleRoot
    && firstVisibleRoot.index !== sourceEntryIndex
    && mx <= firstVisibleRoot.rect.x
    && my >= firstVisibleRoot.rect.y
    && my < firstVisibleRoot.rect.y + firstVisibleRoot.rect.h
  ) {
    const targetSourceLine = getMenuEntrySourceLine(menu, firstVisibleRoot.index);
    if (typeof targetSourceLine === "number") {
      return {
        targetSourceLine,
        placement: "before",
        indicatorRect: {
          x: firstVisibleRoot.rect.x - 1,
          y: firstVisibleRoot.rect.y,
          w: 2,
          h: firstVisibleRoot.rect.h
        },
        indicatorOrientation: "vertical"
      };
    }
  }

  let previousLevel = 0;
  for (const visibleEntry of visibleEntries) {
    const level = getMenuEntryLevel(visibleEntry.entry);
    const rect = visibleEntry.rect;
    const targetSourceLine = getMenuEntrySourceLine(menu, visibleEntry.index);

    if (
      typeof targetSourceLine === "number"
      && visibleEntry.index !== sourceEntryIndex
      && level > previousLevel
      && my >= rect.y - 1
      && my < rect.y + 1
      && mx > rect.x
      && mx <= rect.x + rect.w
    ) {
      return {
        targetSourceLine,
        placement: "before",
        indicatorRect: {
          x: rect.x,
          y: rect.y - 1,
          w: rect.w,
          h: 2
        },
        indicatorOrientation: "horizontal"
      };
    }

    if (
      typeof targetSourceLine === "number"
      && mx > rect.x
      && mx <= rect.x + rect.w
      && my > rect.y + 1
      && my <= rect.y + rect.h
    ) {
      return {
        targetSourceLine,
        placement: "after",
        indicatorRect: level === 0
          ? { x: rect.x + rect.w, y: rect.y, w: 2, h: rect.h }
          : { x: rect.x, y: rect.y + rect.h, w: rect.w, h: 2 },
        indicatorOrientation: level === 0 ? "vertical" : "horizontal"
      };
    }

    if (visibleEntry.entry.kind === "OpenSubMenu") {
      const footerRect = getMenuFooterRect(menu.id, visibleEntry.index);
      const childIndices = getDirectMenuChildIndices(menu, visibleEntry.index);
      const isSelectedEmptyOpenSubmenu = Boolean(
        selection
        && selection.kind === "menuEntry"
        && selection.menuId === menu.id
        && selection.entryIndex === visibleEntry.index
      );
      if (
        footerRect
        && childIndices.length === 0
        && typeof targetSourceLine === "number"
        && visibleEntry.index !== sourceEntryIndex
        && isSelectedEmptyOpenSubmenu
        && mx > rect.x + rect.w
        && my > menuBarBottom
      ) {
        return {
          targetSourceLine,
          placement: "appendChild",
          indicatorRect: {
            x: rect.x + rect.w,
            y: rect.y,
            w: footerRect.w,
            h: 2
          },
          indicatorOrientation: "horizontal"
        };
      }
    }

    previousLevel = level;
  }

  return null;
}

function getMenuFlyoutPanelRect(
  ctx: CanvasRenderingContext2D,
  menu: MenuModel,
  parentIndex: number,
  anchorRect: PreviewRect
): PreviewRect | null {
  const childIndices = getDirectMenuChildIndices(menu, parentIndex);

  let innerWidth = 0;
  let height = 20;
  for (const childIndex of childIndices) {
    const entry = menu.entries[childIndex];
    if (entry.kind === "MenuBar") {
      height += 12;
      continue;
    }

    let textWidth = Math.ceil(ctx.measureText(getMenuPreviewLabel(entry)).width);
    if (entry.shortcut) {
      textWidth += Math.ceil(ctx.measureText(entry.shortcut).width);
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
    const parentRect = getMenuEntryRect(menu.id, parentIndex);
    if (!parentRect) continue;

    const anchorRect: PreviewRect = previousPanelRect
      ? { x: previousPanelRect.x + previousPanelRect.w, y: parentRect.y, w: 0, h: 0 }
      : { x: parentRect.x, y: rect.y + rect.h - 2, w: 0, h: 0 };

    const panelRect = getMenuFlyoutPanelRect(ctx, menu, parentIndex, anchorRect);
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

function parseStatusbarWidth(widthRaw: string | undefined): number | null {
  const trimmed = (widthRaw ?? "").trim();
  if (!trimmed.length || trimmed === "#PB_Ignore") return null;
  const width = Number(trimmed);
  if (!Number.isFinite(width) || width < 0) return null;
  return Math.trunc(width);
}

const STATUSBAR_KNOWN_FLAGS = [
  "#PB_StatusBar_Raised",
  "#PB_StatusBar_BorderLess",
  "#PB_StatusBar_Center",
  "#PB_StatusBar_Right"
] as const;

function splitPbFlags(flagsRaw: string | undefined): string[] {
  return (flagsRaw ?? "")
    .split("|")
    .map(part => part.trim())
    .filter(Boolean);
}

function buildStatusBarFlagsRaw(existingRaw: string | undefined, updates: Partial<Record<(typeof STATUSBAR_KNOWN_FLAGS)[number], boolean>>): string | undefined {
  const current = splitPbFlags(existingRaw);
  const currentSet = new Set(current);
  for (const flag of STATUSBAR_KNOWN_FLAGS) {
    const next = updates[flag];
    if (typeof next !== "boolean") continue;
    if (next) currentSet.add(flag);
    else currentSet.delete(flag);
  }
  const unknown = current.filter(flag => !STATUSBAR_KNOWN_FLAGS.includes(flag as (typeof STATUSBAR_KNOWN_FLAGS)[number]));
  const orderedKnown = STATUSBAR_KNOWN_FLAGS.filter(flag => currentSet.has(flag));
  const merged = [...orderedKnown, ...unknown];
  return merged.length ? merged.join(" | ") : undefined;
}

function getStatusBarAlignedX(fieldX: number, fieldW: number, contentW: number, flagsRaw: string | undefined): number {
  if (hasPbFlag(flagsRaw, "#PB_StatusBar_Center")) {
    return fieldX + Math.max(0, Math.trunc((fieldW - contentW) / 2));
  }
  if (hasPbFlag(flagsRaw, "#PB_StatusBar_Right")) {
    return fieldX + Math.max(0, fieldW - contentW);
  }
  return fieldX;
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

  let fixedWidth = 0;
  let flexibleCount = 0;
  for (const field of statusbar.fields) {
    const parsed = parseStatusbarWidth(field.widthRaw);
    if (parsed === null) flexibleCount++;
    else fixedWidth += parsed;
  }
  const remainingWidth = Math.max(0, rect.w - fixedWidth);
  const flexibleWidth = flexibleCount > 0 ? Math.max(1, Math.floor(remainingWidth / flexibleCount)) : 0;

  let x = rect.x;
  const progressY = rect.y + 5;
  const progressH = Math.max(4, rect.h - 10);
  const imageY = rect.y + 4;
  for (let i = 0; i < statusbar.fields.length; i++) {
    const field = statusbar.fields[i];
    const parsedWidth = parseStatusbarWidth(field.widthRaw);
    const fieldW = Math.max(18, parsedWidth ?? flexibleWidth);
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
      const textX = getStatusBarAlignedX(x, fieldW, textWidth, field.flagsRaw);
      ctx.fillText(textLabel, textX, rect.y + Math.min(rect.h - 6, 15));
    } else if (field.progressBar) {
      const progress = clamp(asInt(field.progressRaw ?? 0), 0, 100);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = border;
      ctx.strokeRect(x + 0.5, progressY + 0.5, Math.max(8, fieldW - 1), progressH - 1);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(x + 1, progressY + 1, Math.max(0, Math.round((Math.max(8, fieldW - 3) * progress) / 100)), Math.max(2, progressH - 2));
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.55;
      const size = Math.max(10, Math.min(16, rect.h - 8));
      const imageX = getStatusBarAlignedX(x, fieldW, size, field.flagsRaw);
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

  const chromeMetrics = getPreviewChromeMetrics();
  const windowContentRect = getWindowContentPreviewRect(chromeMetrics);
  const menuBarRect = getMenuBarRectGlobal(wr, chromeMetrics);
  const toolBarRect = getToolBarRectGlobal(wr, chromeMetrics);
  const statusBarRect = getStatusBarRectGlobal(wr, chromeMetrics);

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
    children: (model.images ?? []).map((img, idx) => ({
      kind: "menuEntry" as const,
      id: `image:${idx}`,
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
      else if (n.kind === "gadget") selection = { kind: "gadget", id: n.id };
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

  const metrics = getPreviewChromeMetrics();
  const vertical = hasPbFlag(g.flagsExpr, "#PB_Splitter_Vertical");
  const range = Math.max(0, (vertical ? g.w : g.h) - metrics.splitterWidth);
  return Math.trunc(range / 2);
}

function renderProps() {
  propsEl.innerHTML = "";

  const sel = selection;
  if (!sel) {
    propsEl.innerHTML = "<div class='muted'>No selection</div>";
    return;
  }

  const toPbString = (v: string): string => {
    const esc = (v ?? "").replace(/"/g, '""');
    return `"${esc}"`;
  };

  const section = (title: string) => {
    const h = document.createElement("div");
    h.className = "subHeader";
    h.textContent = title;
    return h;
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

  const promptImageArgs = (current?: ImageEntry): { inline: boolean; idRaw: string; imageRaw: string; assignedVar?: string } | undefined => {
    const procName = prompt("Image kind (LoadImage/CatchImage)", current?.inline ? "CatchImage" : "LoadImage");
    if (procName === null) return undefined;
    const normalizedProc = procName.trim().toLowerCase();
    const inline = normalizedProc === "catchimage";
    if (normalizedProc !== "loadimage" && normalizedProc !== "catchimage") return undefined;

    const firstParamDefault = current?.firstParam ?? (current?.pbAny ? "#PB_Any" : current?.id ?? "#ImgNew");
    const firstParam = prompt("First param (#ImgName or #PB_Any)", firstParamDefault);
    if (firstParam === null) return undefined;
    const idRaw = firstParam.trim();
    if (!idRaw.length) return undefined;

    let assignedVar: string | undefined;
    if (idRaw.toLowerCase() === "#pb_any") {
      const assigned = prompt("Assigned variable", current?.variable ?? current?.id ?? "imgNew");
      if (assigned === null) return undefined;
      const trimmedAssigned = assigned.trim();
      if (!trimmedAssigned.length) return undefined;
      assignedVar = trimmedAssigned;
    }

    const imageRawPrompt = prompt("Image raw", current?.imageRaw ?? '"image.png"');
    if (imageRawPrompt === null) return undefined;
    const imageRaw = imageRawPrompt.trim();
    if (!imageRaw.length) return undefined;

    return { inline, idRaw, imageRaw, assignedVar };
  };

  const promptCreateAndAssignImageArgs = (current?: ImageEntry): ({ inline: boolean; idRaw: string; imageRaw: string; assignedVar?: string } & { imageId: string; imageRefRaw: string }) | undefined => {
    const next = promptImageArgs(current);
    if (!next) return undefined;

    const reference = buildCreatedImageReference(next.idRaw, next.assignedVar);
    if (!reference) {
      alert("#PB_Any requires an assigned variable name.");
      return undefined;
    }

    return {
      ...next,
      imageId: reference.imageId,
      imageRefRaw: reference.imageRaw,
    };
  };

  const promptCreateAndAssignLoadImageArgs = (): ({ idRaw: string; assignedVar?: string } & { imageId: string; imageRefRaw: string }) | undefined => {
    const firstParam = prompt("First param for new LoadImage entry (#ImgName or #PB_Any)", "#ImgNew");
    if (firstParam === null) return undefined;
    const idRaw = firstParam.trim();
    if (!idRaw.length) return undefined;

    let assignedVar: string | undefined;
    if (idRaw.toLowerCase() === "#pb_any") {
      const assigned = prompt("Assigned variable", "imgNew");
      if (assigned === null) return undefined;
      const trimmedAssigned = assigned.trim();
      if (!trimmedAssigned.length) return undefined;
      assignedVar = trimmedAssigned;
    }

    const reference = buildCreatedImageReference(idRaw, assignedVar);
    if (!reference) {
      alert("#PB_Any requires an assigned variable name.");
      return undefined;
    }

    return {
      idRaw,
      assignedVar,
      imageId: reference.imageId,
      imageRefRaw: reference.imageRaw,
    };
  };

  const promptChooseFileAndAssignGadgetImageArgs = (): ({ idRaw: string; assignedVar?: string; resizeToImage: boolean } & { imageId: string; imageRefRaw: string }) | undefined => {
    const next = promptCreateAndAssignLoadImageArgs();
    if (!next) return undefined;

    return {
      ...next,
      resizeToImage: confirm("Resize gadget to the selected image size?")
    };
  };

  if (sel.kind === "window") {
    if (!model.window) {
      propsEl.innerHTML = "<div class='muted'>No window</div>";
      return;
    }

    const variableName = (model.window.variable ?? model.window.firstParam.replace(/^#/, "")).trim() || "Window_0";
    const enumSymbol = variableName ? `#${variableName.trim()}` : "#Window_0";

    propsEl.appendChild(row("Key", readonlyInput(model.window.id)));
    propsEl.appendChild(
      row("#PB_Any", checkboxInput(model.window.pbAny, v => {
        if (!model.window) return;
        vscode.postMessage({
          type: "toggleWindowPbAny",
          windowKey: model.window.id,
          toPbAny: v,
          variableName,
          enumSymbol,
          enumValueRaw: model.window.enumValueRaw
        });
      }))
    );

    propsEl.appendChild(
      row("Variable", textInput(variableName ?? "", v => {
        vscode.postMessage({
          type: "setWindowVariableName",
          variableName: v.trim().length ? v.trim() : undefined
        });
      }))
    );
    if (!model.window.pbAny) {
      propsEl.appendChild(
        row("Enum Value", textInput(model.window.enumValueRaw ?? "", v => {
          vscode.postMessage({
            type: "setWindowEnumValue",
            enumSymbol,
            enumValueRaw: v.trim().length ? v.trim() : undefined
          });
        }))
      );
    }

    propsEl.appendChild(row("Title", readonlyInput(model.window.title ?? "")));
    propsEl.appendChild(
      row("Event File", textInput(model.window.eventFile ?? "", v => {
        if (!model.window) return;
        const trimmed = v.trim();
        model.window.eventFile = trimmed || undefined;
        post({
          type: "setWindowEventFile",
          windowKey: model.window.id,
          eventFile: trimmed.length ? toPbString(trimmed) : undefined
        });
        renderProps();
      }))
    );
    const hasEventGadgetBlock = Boolean(model.window.hasEventGadgetBlock);
    const windowEventProcHint = hasEventGadgetBlock
      ? ""
      : EVENT_UI_HINT.eventGadgetMissing;
    propsEl.appendChild(
      row(
        "Event Proc",
        textInput(
          model.window.eventProc ?? "",
          v => {
            if (!model.window || !hasEventGadgetBlock) return;
            const trimmed = v.trim();
            model.window.eventProc = trimmed || undefined;
            post({
              type: "setWindowEventProc",
              windowKey: model.window.id,
              eventProc: trimmed.length ? trimmed : undefined
            });
            renderProps();
          },
          { disabled: !hasEventGadgetBlock, title: windowEventProcHint }
        )
      )
    );
    if (!hasEventGadgetBlock) {
      propsEl.appendChild(mutedNote(windowEventProcHint));
    }
    const hasEventMenuBlockForLoop = Boolean(model.window.hasEventMenuBlock);
    const hasEventGadgetCasesForLoop = Boolean(model.window.hasEventGadgetCaseBranches);
    const canDisableGenerateEventLoop = !hasEventMenuBlockForLoop && !hasEventGadgetCasesForLoop;
    const generateEventLoopDisableHint = getGenerateEventLoopDisableHint(model.window);
    propsEl.appendChild(
      row(
        "Generate Event Loop",
        checkboxInput(
          Boolean(model.window.generateEventLoop),
          v => {
            if (!model.window) return;
            if (!v && Boolean(model.window.generateEventLoop) && !canDisableGenerateEventLoop) return;
            model.window.generateEventLoop = v;
            if (!v) {
              if (!model.window.hasEventMenuBlock) model.window.hasEventGadgetBlock = false;
              if (!model.window.hasEventMenuBlock) model.window.hasEventGadgetCaseBranches = false;
            } else {
              model.window.hasEventGadgetBlock = true;
            }
            post({
              type: "setWindowGenerateEventLoop",
              windowKey: model.window.id,
              enabled: v
            });
            renderProps();
          },
          {
            disabled: Boolean(model.window.generateEventLoop) && !canDisableGenerateEventLoop,
            title: Boolean(model.window.generateEventLoop) && !canDisableGenerateEventLoop ? generateEventLoopDisableHint : ""
          }
        )
      )
    );
    if (Boolean(model.window.generateEventLoop) && !canDisableGenerateEventLoop) {
      propsEl.appendChild(mutedNote(generateEventLoopDisableHint));
    }
    propsEl.appendChild(
      row("X", numberInput(model.window.x, v => { if (!model.window) return; model.window.x = asInt(v); postWindowRect(); render(); renderProps(); }))
    );
    propsEl.appendChild(
      row("Y", numberInput(model.window.y, v => { if (!model.window) return; model.window.y = asInt(v); postWindowRect(); render(); renderProps(); }))
    );
    propsEl.appendChild(
      row("W", numberInput(model.window.w, v => { if (!model.window) return; model.window.w = asInt(v); postWindowRect(); render(); renderProps(); }))
    );
    propsEl.appendChild(
      row("H", numberInput(model.window.h, v => { if (!model.window) return; model.window.h = asInt(v); postWindowRect(); render(); renderProps(); }))
    );
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
        const picked = promptImageReferenceFromModel(selectedEntry.iconId);
        if (!picked) return;
        postSelectedMenuUpdate({ iconRaw: picked.imageRaw });
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
        const next = promptCreateAndAssignLoadImageArgs();
        if (!next) return;
        post({
          type: "chooseFileAndAssignMenuEntryImage",
          menuId: m.id,
          sourceLine: selectedEntry.source.line,
          kind: selectedEntry.kind,
          idRaw: selectedEntry.idRaw,
          textRaw: selectedEntry.textRaw ?? (selectedEntry.text !== undefined ? toPbString(selectedEntry.text) : undefined),
          shortcut: selectedEntry.shortcut,
          newImageIdRaw: next.idRaw,
          newAssignedVar: next.assignedVar,
        });
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
        const next = promptCreateAndAssignImageArgs();
        if (!next) return;
        post({
          type: "createAndAssignMenuEntryImage",
          menuId: m.id,
          sourceLine: selectedEntry.source.line,
          kind: selectedEntry.kind,
          idRaw: selectedEntry.idRaw,
          textRaw: selectedEntry.textRaw ?? (selectedEntry.text !== undefined ? toPbString(selectedEntry.text) : undefined),
          shortcut: selectedEntry.shortcut,
          newInline: next.inline,
          newImageIdRaw: next.idRaw,
          newImageRaw: next.imageRaw,
          newAssignedVar: next.assignedVar,
        });
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
      propsEl.appendChild(row(
        "SelectProc",
        textInput(
          selectedEntry.event ?? "",
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
            if (!confirm("Delete this menu entry?")) return;
            vscode.postMessage({
              type: "deleteMenuEntry",
              menuId: m.id,
              sourceLine: e.source!.line,
              kind: e.kind
            });
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
            const selected = promptImageReferenceFromModel(e.iconId);
            if (!selected) return;
            post({
              type: "updateMenuEntry",
              menuId: m.id,
              sourceLine: e.source!.line,
              kind: e.kind,
              idRaw: e.idRaw,
              textRaw: e.textRaw ?? (e.text !== undefined ? toPbString(e.text) : undefined),
              shortcut: e.shortcut,
              iconRaw: selected.imageRaw
            });
          }
        : undefined;
      const menuChooseFileImageFn = e.kind === "MenuItem" && canPatch
        ? () => {
            const next = promptCreateAndAssignLoadImageArgs();
            if (!next) return;
            post({
              type: "chooseFileAndAssignMenuEntryImage",
              menuId: m.id,
              sourceLine: e.source!.line,
              kind: e.kind,
              idRaw: e.idRaw,
              textRaw: e.textRaw ?? (e.text !== undefined ? toPbString(e.text) : undefined),
              shortcut: e.shortcut,
              newImageIdRaw: next.idRaw,
              newAssignedVar: next.assignedVar,
            });
          }
        : undefined;
      const menuCreateImageFn = e.kind === "MenuItem" && canPatch
        ? () => {
            const next = promptCreateAndAssignImageArgs();
            if (!next) return;
            post({
              type: "createAndAssignMenuEntryImage",
              menuId: m.id,
              sourceLine: e.source!.line,
              kind: e.kind,
              idRaw: e.idRaw,
              textRaw: e.textRaw ?? (e.text !== undefined ? toPbString(e.text) : undefined),
              shortcut: e.shortcut,
              newInline: next.inline,
              newImageIdRaw: next.idRaw,
              newImageRaw: next.imageRaw,
              newAssignedVar: next.assignedVar,
            });
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

      const addCloseBtn = document.createElement("button");
      addCloseBtn.textContent = "Add Close";
      addCloseBtn.title = "Insert a new CloseSubMenu entry.";
      addCloseBtn.onclick = () => {
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
          if (!confirm(`Delete menu '${m.id}'?`)) return;
          post({ type: "deleteMenu", menuId: m.id });
        };
        actions.appendChild(deleteBtn);
      }
      propsEl.appendChild(actions);
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
        const picked = promptImageReferenceFromModel(selectedEntry.iconId);
        if (!picked) return;
        post({
          type: "updateToolBarEntry",
          toolBarId: t.id,
          sourceLine: selectedEntry.source.line,
          kind: selectedEntry.kind,
          idRaw: selectedEntry.idRaw,
          iconRaw: picked.imageRaw,
          toggle: selectedEntry.toggle,
        });
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
        const next = promptCreateAndAssignLoadImageArgs();
        if (!next) return;
        post({
          type: "chooseFileAndAssignToolBarEntryImage",
          toolBarId: t.id,
          sourceLine: selectedEntry.source.line,
          kind: selectedEntry.kind,
          idRaw: selectedEntry.idRaw,
          toggle: selectedEntry.toggle,
          newImageIdRaw: next.idRaw,
          newAssignedVar: next.assignedVar,
        });
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
        const next = promptCreateAndAssignImageArgs();
        if (!next) return;
        post({
          type: "createAndAssignToolBarEntryImage",
          toolBarId: t.id,
          sourceLine: selectedEntry.source.line,
          kind: selectedEntry.kind,
          idRaw: selectedEntry.idRaw,
          toggle: selectedEntry.toggle,
          newInline: next.inline,
          newImageIdRaw: next.idRaw,
          newImageRaw: next.imageRaw,
          newAssignedVar: next.assignedVar,
        });
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

      propsEl.appendChild(section("Selected Entry"));
      propsEl.appendChild(row("Variable", readonlyInput(selectedEntry.idRaw ?? "")));
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
        textInput(
          selectedEntry.event ?? "",
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
            const kind = e.kind;
            if (kind === "ToolBarStandardButton") {
              const idRaw = prompt("Button id", e.idRaw ?? "");
              if (idRaw === null) return;
              const iconRaw = prompt("Icon raw", e.iconRaw ?? "0");
              if (iconRaw === null) return;
              vscode.postMessage({
                type: "updateToolBarEntry",
                toolBarId: t.id,
                sourceLine: e.source!.line,
                kind,
                idRaw: idRaw.trim(),
                iconRaw: iconRaw.trim()
              });
              return;
            }

            if (kind === "ToolBarButton") {
              const idRaw = prompt("Button id", e.idRaw ?? "");
              if (idRaw === null) return;
              const iconRaw = prompt("Icon raw", e.iconRaw ?? "0");
              if (iconRaw === null) return;
              const txt = prompt("Text", e.text ?? "");
              if (txt === null) return;
              vscode.postMessage({
                type: "updateToolBarEntry",
                toolBarId: t.id,
                sourceLine: e.source!.line,
                kind,
                idRaw: idRaw.trim(),
                iconRaw: iconRaw.trim(),
                textRaw: toPbString(txt)
              });
              return;
            }

            if (kind === "ToolBarToolTip") {
              const idRaw = prompt("Button id", e.idRaw ?? "");
              if (idRaw === null) return;
              const txt = prompt("Tooltip", e.text ?? "");
              if (txt === null) return;
              vscode.postMessage({
                type: "updateToolBarEntry",
                toolBarId: t.id,
                sourceLine: e.source!.line,
                kind,
                idRaw: idRaw.trim(),
                textRaw: toPbString(txt)
              });
              return;
            }

            if (kind === "ToolBarImageButton") {
              const idRaw = prompt("Button id", e.idRaw ?? "");
              if (idRaw === null) return;
              const iconRaw = prompt("Icon raw", e.iconRaw ?? "ImageID(#ImgOpen)");
              if (iconRaw === null) return;
              const toggleRaw = prompt("Toggle (#PB_ToolBar_Toggle or blank)", e.toggle ? "#PB_ToolBar_Toggle" : "");
              if (toggleRaw === null) return;
              vscode.postMessage({
                type: "updateToolBarEntry",
                toolBarId: t.id,
                sourceLine: e.source!.line,
                kind,
                idRaw: idRaw.trim(),
                iconRaw: iconRaw.trim(),
                toggle: toggleRaw.trim().length > 0
              });
              return;
            }

            // ToolBarSeparator has no editable fields.
          }
        : undefined;

      const delFn = canPatch
        ? () => {
            if (!confirm("Delete this toolbar entry?")) return;
            vscode.postMessage({
              type: "deleteToolBarEntry",
              toolBarId: t.id,
              sourceLine: e.source!.line,
              kind: e.kind
            });
          }
        : undefined;

      const eventFn = e.idRaw && hasEventMenuBlock && e.kind !== "ToolBarToolTip"
        ? () => {
            const cur = e.event ?? "";
            const value = prompt("Event proc (blank clears)", cur);
            if (value === null) return;
            const trimmed = value.trim();
            e.event = trimmed || undefined;
            post({
              type: "setToolBarEntryEvent",
              entryIdRaw: e.idRaw!,
              eventProc: trimmed.length ? trimmed : undefined
            });
            renderProps();
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
            const iconRaw = prompt("Icon raw", e.iconRaw ?? "ImageID(#ImgOpen)");
            if (iconRaw === null) return;
            post({
              type: "updateToolBarEntry",
              toolBarId: t.id,
              sourceLine: e.source!.line,
              kind: e.kind,
              idRaw: e.idRaw,
              iconRaw: iconRaw.trim(),
              toggle: e.toggle
            });
          }
        : undefined;
      const toolBarPickImageFn = e.kind === "ToolBarImageButton" && canPatch
        ? () => {
            const selected = promptImageReferenceFromModel(e.iconId);
            if (!selected) return;
            post({
              type: "updateToolBarEntry",
              toolBarId: t.id,
              sourceLine: e.source!.line,
              kind: e.kind,
              idRaw: e.idRaw,
              iconRaw: selected.imageRaw,
              toggle: e.toggle
            });
          }
        : undefined;
      const toolBarChooseFileImageFn = e.kind === "ToolBarImageButton" && canPatch
        ? () => {
            const next = promptCreateAndAssignLoadImageArgs();
            if (!next) return;
            post({
              type: "chooseFileAndAssignToolBarEntryImage",
              toolBarId: t.id,
              sourceLine: e.source!.line,
              kind: e.kind,
              idRaw: e.idRaw,
              toggle: e.toggle,
              newImageIdRaw: next.idRaw,
              newAssignedVar: next.assignedVar,
            });
          }
        : undefined;
      const toolBarCreateImageFn = e.kind === "ToolBarImageButton" && canPatch
        ? () => {
            const next = promptCreateAndAssignImageArgs();
            if (!next) return;
            post({
              type: "createAndAssignToolBarEntryImage",
              toolBarId: t.id,
              sourceLine: e.source!.line,
              kind: e.kind,
              idRaw: e.idRaw,
              toggle: e.toggle,
              newInline: next.inline,
              newImageIdRaw: next.idRaw,
              newImageRaw: next.imageRaw,
              newAssignedVar: next.assignedVar,
            });
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
          if (!confirm(`Delete toolbar '${t.id}'?`)) return;
          post({ type: "deleteToolBar", toolBarId: t.id });
        };
        actions.appendChild(deleteBtn);
      }
      propsEl.appendChild(actions);
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
        post({
          type: "updateStatusBarField",
          statusBarId: sb.id,
          sourceLine: field.source!.line,
          widthRaw: patch.widthRaw ?? field.widthRaw,
          textRaw: patch.textRaw ?? field.textRaw ?? "",
          imageRaw: patch.imageRaw ?? field.imageRaw ?? "",
          flagsRaw: patch.flagsRaw ?? field.flagsRaw ?? "",
          progressBar: patch.progressBar ?? Boolean(field.progressBar),
          progressRaw: patch.progressRaw ?? field.progressRaw ?? ""
        });
      };

      const editFn = canPatch
        ? () => {
            const width = prompt("Width raw", field.widthRaw ?? "0");
            if (width === null) return;
            const flags = prompt("Flags raw (blank clears)", field.flagsRaw ?? "");
            if (flags === null) return;
            postFieldUpdate({
              widthRaw: width.trim(),
              flagsRaw: flags.trim()
            });
          }
        : undefined;

      const delFn = canPatch
        ? () => {
            if (!confirm("Delete this statusbar field?")) return;
            post({
              type: "deleteStatusBarField",
              statusBarId: sb.id,
              sourceLine: field.source!.line
            });
          }
        : undefined;

      const statusSetImageFn = canPatch
        ? () => {
            const imageRaw = prompt("Image raw (blank clears)", field.imageRaw ?? "");
            if (imageRaw === null) return;
            const flags = prompt("Flags raw (optional)", field.flagsRaw ?? "");
            if (flags === null) return;
            postFieldUpdate({
              textRaw: "",
              imageRaw: imageRaw.trim(),
              flagsRaw: flags.trim(),
              progressBar: false,
              progressRaw: ""
            });
          }
        : undefined;

      const statusPickImageFn = canPatch
        ? () => {
            const selected = promptImageReferenceFromModel(field.imageId);
            if (!selected) return;
            postFieldUpdate({
              textRaw: "",
              imageRaw: selected.imageRaw,
              flagsRaw: field.flagsRaw ?? "",
              progressBar: false,
              progressRaw: ""
            });
          }
        : undefined;

      const statusTextFn = canPatch
        ? () => {
            const textRaw = prompt("Text raw (blank clears)", field.textRaw ?? toPbString(field.text ?? "Label"));
            if (textRaw === null) return;
            const flags = prompt("Flags raw (optional)", field.flagsRaw ?? "");
            if (flags === null) return;
            postFieldUpdate({
              textRaw: textRaw.trim(),
              imageRaw: "",
              flagsRaw: flags.trim(),
              progressBar: false,
              progressRaw: ""
            });
          }
        : undefined;

      const statusProgressFn = canPatch
        ? () => {
            const progressRaw = prompt("Progress raw", field.progressRaw ?? "0");
            if (progressRaw === null) return;
            const flags = prompt("Flags raw (optional)", field.flagsRaw ?? "");
            if (flags === null) return;
            postFieldUpdate({
              textRaw: "",
              imageRaw: "",
              flagsRaw: flags.trim(),
              progressBar: true,
              progressRaw: progressRaw.trim() || "0"
            });
          }
        : undefined;

      const statusClearFn = canPatch
        ? () => {
            if (!confirm("Clear this statusbar field decoration?")) return;
            postFieldUpdate({
              textRaw: "",
              imageRaw: "",
              flagsRaw: "",
              progressBar: false,
              progressRaw: ""
            });
          }
        : undefined;

      const statusChooseFileImageFn = canPatch
        ? () => {
            const next = promptCreateAndAssignLoadImageArgs();
            if (!next) return;
            post({
              type: "chooseFileAndAssignStatusBarFieldImage",
              statusBarId: sb.id,
              sourceLine: field.source!.line,
              widthRaw: field.widthRaw,
              newImageIdRaw: next.idRaw,
              newAssignedVar: next.assignedVar,
            });
          }
        : undefined;

      const statusCreateImageFn = canPatch
        ? () => {
            const next = promptCreateAndAssignImageArgs();
            if (!next) return;
            post({
              type: "createAndAssignStatusBarFieldImage",
              statusBarId: sb.id,
              sourceLine: field.source!.line,
              widthRaw: field.widthRaw,
              newInline: next.inline,
              newImageIdRaw: next.idRaw,
              newImageRaw: next.imageRaw,
              newAssignedVar: next.assignedVar,
            });
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
              textRaw: v.trim().length ? toPbString(v) : "",
              imageRaw: "",
              progressBar: false,
              progressRaw: ""
            });
          },
          {
            disabled: !selectedUi.canPatch,
            title: "Match the original statusbar text field for the current selection."
          }
        )
      ));
      propsEl.appendChild(row("CurrentImage", readonlyInput(selectedImagePath)));
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
      propsEl.appendChild(row(
        "ProgressBar",
        checkboxInput(
          Boolean(selectedField.progressBar),
          checked => {
            if (!selectedUi.canPatch) return;
            selectedUi.postFieldUpdate({
              textRaw: checked ? "" : selectedField.textRaw ?? "",
              imageRaw: checked ? "" : selectedField.imageRaw ?? "",
              progressBar: checked,
              progressRaw: checked ? (selectedField.progressRaw?.trim() || "0") : ""
            });
          },
          {
            disabled: !selectedUi.canPatch,
            title: "Match the original ProgressBar checkbox for the selected statusbar field."
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
    }

    const box = miniList();
    (sb.fields ?? []).forEach((f, idx) => {
      const fieldUi = getStatusBarFieldUi(f);
      const label = `Field ${idx}  ${getStatusBarFieldDisplaySummary(f)}  width:${f.widthRaw}`;

      const rowEl = miniRow(
        label,
        fieldUi.editFn,
        fieldUi.delFn,
        { label: "Label", onClick: fieldUi.statusTextFn, disabled: !fieldUi.statusTextFn, title: "Switch this field to a StatusBarText decoration." },
        { label: "Progress", onClick: fieldUi.statusProgressFn, disabled: !fieldUi.statusProgressFn, title: "Switch this field to a StatusBarProgress decoration." },
        { label: "Clear", onClick: fieldUi.statusClearFn, disabled: !fieldUi.statusClearFn, title: "Remove text/image/progress decoration from this field." },
        { label: "Set Image", onClick: fieldUi.statusSetImageFn, disabled: !fieldUi.statusSetImageFn, title: "Switch this field to a StatusBarImage decoration while preserving the field width." },
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
          if (!confirm(`Delete statusbar '${sb.id}'?`)) return;
          post({ type: "deleteStatusBar", statusBarId: sb.id });
        };
        actions.appendChild(deleteBtn);
      }
      propsEl.appendChild(actions);
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
      if (!confirm("Delete this image entry?")) return;
      post({ type: "deleteImage", sourceLine: img.source!.line });
    };

    actions.appendChild(editBtn);
    actions.appendChild(cancelEditBtn);
    actions.appendChild(chooseFileBtn);
    actions.appendChild(toggleInlineBtn);
    actions.appendChild(togglePbAnyBtn);
    actions.appendChild(relativeBtn);
    actions.appendChild(delBtn);
    propsEl.appendChild(actions);
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
                if (!confirm("Delete this image entry?")) return;
                post({ type: "deleteImage", sourceLine: img.source!.line });
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
      const next = promptImageArgs();
      if (!next) return;
      post({
        type: "insertImage",
        inline: next.inline,
        idRaw: next.idRaw,
        imageRaw: next.imageRaw,
        assignedVar: next.assignedVar
      });
    };

    const actions = document.createElement("div");
    actions.className = "miniActions";
    actions.appendChild(addBtn);
    propsEl.appendChild(actions);
    return;
  }

  if (sel.kind !== "gadget") {
    propsEl.innerHTML = "<div class='muted'>No selection</div>";
    return;
  }

  const selId = sel.id;
  const g = model.gadgets.find(it => it.id === selId);
  if (!g) {
    propsEl.innerHTML = "<div class='muted'>No selection</div>";
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
      const selected = promptImageReferenceFromModel(g.imageId);
      if (!selected) return;
      g.imageRaw = selected.imageRaw;
      g.imageId = selected.imageId;
      post({
        type: "setGadgetImageRaw",
        id: g.id,
        imageRaw: selected.imageRaw
      });
      renderProps();
    };
    gadgetImageActions.appendChild(gadgetPickImageBtn);

    const gadgetCreateImageBtn = document.createElement("button");
    gadgetCreateImageBtn.textContent = "Create New Image";
    gadgetCreateImageBtn.title = "Create a new form image entry and assign it to this gadget.";
    gadgetCreateImageBtn.onclick = () => {
      const next = promptCreateAndAssignImageArgs();
      if (!next) return;
      g.imageRaw = next.imageRefRaw;
      g.imageId = next.imageId;
      post({
        type: "createAndAssignGadgetImage",
        id: g.id,
        newInline: next.inline,
        newImageIdRaw: next.idRaw,
        newImageRaw: next.imageRaw,
        newAssignedVar: next.assignedVar,
      });
      renderProps();
    };
    gadgetImageActions.appendChild(gadgetCreateImageBtn);

    const gadgetChooseFileBtn = document.createElement("button");
    gadgetChooseFileBtn.textContent = "Choose File";
    gadgetChooseFileBtn.title = "Select a file, create a new LoadImage entry and assign it to this gadget. Optionally resize the gadget to the image size.";
    gadgetChooseFileBtn.onclick = () => {
      const next = promptChooseFileAndAssignGadgetImageArgs();
      if (!next) return;
      g.imageRaw = next.imageRefRaw;
      g.imageId = next.imageId;
      post({
        type: "chooseFileAndAssignGadgetImage",
        id: g.id,
        x: g.x,
        y: g.y,
        resizeToImage: next.resizeToImage,
        newImageIdRaw: next.idRaw,
        newAssignedVar: next.assignedVar,
      });
      renderProps();
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
  if (gadgetImageHint) {
    propsEl.appendChild(mutedNote(gadgetImageHint));
  }
  if (isImageCapableGadget) {
    propsEl.appendChild(mutedNote("Image-capable gadgets accept raw image expressions such as ImageID(#ImgOpen) or 0."));
  }
  const hasEventGadgetBlock = Boolean(model.window?.hasEventGadgetBlock);
  const gadgetEventProcHint = hasEventGadgetBlock
    ? ""
    : EVENT_UI_HINT.eventGadgetMissing;
  propsEl.appendChild(
    row(
      "Event Proc",
      textInput(
        g.eventProc ?? "",
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
        { disabled: !hasEventGadgetBlock, title: gadgetEventProcHint }
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
              const txt = prompt("Item text", it.text ?? "");
              if (txt === null) return;
              const pos = prompt("Position (-1 append)", it.posRaw ?? "-1");
              if (pos === null) return;
              const img = prompt("Image raw (optional)", it.imageRaw ?? "");
              if (img === null) return;
              const flags = prompt("Flags raw (optional)", it.flagsRaw ?? "");
              if (flags === null) return;

              vscode.postMessage({
                type: "updateGadgetItem",
                id: g.id,
                sourceLine: it.source!.line,
                posRaw: pos,
                textRaw: toPbString(txt),
                imageRaw: img.trim().length ? img.trim() : undefined,
                flagsRaw: flags.trim().length ? flags.trim() : undefined
              });
            }
          : undefined,
        canPatch
          ? () => {
              if (!confirm("Delete this item?")) return;
              vscode.postMessage({ type: "deleteGadgetItem", id: g.id, sourceLine: it.source!.line });
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
    const txt = prompt("Item text", "");
    if (txt === null) return;
    const pos = prompt("Position (-1 append)", "-1");
    if (pos === null) return;
    const img = prompt("Image raw (optional)", "");
    if (img === null) return;
    const flags = prompt("Flags raw (optional)", "");
    if (flags === null) return;

    vscode.postMessage({
      type: "insertGadgetItem",
      id: g.id,
      posRaw: pos,
      textRaw: toPbString(txt),
      imageRaw: img.trim().length ? img.trim() : undefined,
      flagsRaw: flags.trim().length ? flags.trim() : undefined
    });
  };

  const itemActions = document.createElement("div");
  itemActions.className = "miniActions";
  itemActions.appendChild(addItemBtn);

  propsEl.appendChild(itemsBox);
  propsEl.appendChild(itemActions);

  // Columns editor (minimal UI)
  propsEl.appendChild(section("Columns"));
  const colsBox = miniList();
  (g.columns ?? []).forEach((c, idx) => {
    const label = `${idx}  ${c.title ?? c.titleRaw ?? ""}  w:${c.widthRaw ?? ""}`;
    const canPatch = typeof c.source?.line === "number";

    colsBox.appendChild(
      miniRow(
        label,
        canPatch
          ? () => {
              const title = prompt("Column title", c.title ?? "");
              if (title === null) return;
              const col = prompt("Column index", c.colRaw ?? String(idx));
              if (col === null) return;
              const width = prompt("Width", c.widthRaw ?? "80");
              if (width === null) return;

              vscode.postMessage({
                type: "updateGadgetColumn",
                id: g.id,
                sourceLine: c.source!.line,
                colRaw: col,
                titleRaw: toPbString(title),
                widthRaw: width
              });
            }
          : undefined,
        canPatch
          ? () => {
              if (!confirm("Delete this column?")) return;
              vscode.postMessage({ type: "deleteGadgetColumn", id: g.id, sourceLine: c.source!.line });
            }
          : undefined
      )
    );
  });

  const addColBtn = document.createElement("button");
  addColBtn.textContent = "Add Column";
  addColBtn.onclick = () => {
    const title = prompt("Column title", "");
    if (title === null) return;
    const col = prompt("Column index", String(g.columns?.length ?? 0));
    if (col === null) return;
    const width = prompt("Width", "80");
    if (width === null) return;

    vscode.postMessage({
      type: "insertGadgetColumn",
      id: g.id,
      colRaw: col,
      titleRaw: toPbString(title),
      widthRaw: width
    });
  };

  const colActions = document.createElement("div");
  colActions.className = "miniActions";
  colActions.appendChild(addColBtn);

  propsEl.appendChild(colsBox);
  propsEl.appendChild(colActions);
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

function asInt(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

resizeCanvas();
vscode.postMessage({ type: "ready" });