export type GadgetKind =
  | "ButtonGadget"
  | "ButtonImageGadget"
  | "StringGadget"
  | "TextGadget"
  | "CheckBoxGadget"
  | "OptionGadget"
  | "FrameGadget"
  | "ComboBoxGadget"
  | "ListViewGadget"
  | "ListIconGadget"
  | "TreeGadget"
  | "EditorGadget"
  | "SpinGadget"
  | "TrackBarGadget"
  | "ProgressBarGadget"
  | "ImageGadget"
  | "HyperLinkGadget"
  | "CalendarGadget"
  | "DateGadget"
  | "ContainerGadget"
  | "PanelGadget"
  | "ScrollAreaGadget"
  | "SplitterGadget"
  | "WebViewGadget"
  | "OpenGLGadget"
  | "CanvasGadget"
  | "ExplorerTreeGadget"
  | "ExplorerListGadget"
  | "ExplorerComboGadget"
  | "IPAddressGadget"
  | "ScrollBarGadget"
  | "ScintillaGadget"
  | "WebGadget"
  | "Unknown";

export interface SourceRange {
  start: number;
  end: number;
  line: number;
  lineStart: number;
}

export interface Gadget {
  id: string;            // stable key for patching (assigned var for #PB_Any, else first param)
  kind: GadgetKind;
  pbAny: boolean;
  assignedVar?: string;  // left side if any
  firstParam: string;    // raw first param token
  parentId?: string;     // parent gadget id (Container/Panel/ScrollArea/OpenGadgetList)
  parentItem?: number;   // for PanelGadget children: active tab index (best-effort)
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  flagsExpr?: string;
  items?: GadgetItem[];
  columns?: GadgetColumn[];
  source?: SourceRange;
}

export interface GadgetItem {
  index?: number;        // resolved index (best-effort)
  posRaw: string;        // raw position expression
  textRaw?: string;      // raw text expression
  text?: string;         // unquoted text (when possible)
  imageRaw?: string;     // optional image expression
  flagsRaw?: string;     // optional flags expression
  source?: SourceRange;
}

export interface GadgetColumn {
  index?: number;        // resolved index (best-effort)
  colRaw: string;        // raw column index expression
  titleRaw?: string;     // raw title expression
  title?: string;        // unquoted title (when possible)
  widthRaw?: string;     // raw width expression
  source?: SourceRange;
}

export interface FormWindow {
  id: string;            // stable key for window (assigned var for #PB_Any, else first param)
  pbAny: boolean;
  assignedVar?: string;
  firstParam: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  flagsExpr?: string;
}

export type FormIssueSeverity = "error" | "warning" | "info";

export interface FormIssue {
  severity: FormIssueSeverity;
  message: string;
  line?: number;
}

export interface FormHeaderInfo {
  version?: string;
  line: number;
  hasStrictSyntaxWarning: boolean;
}

export interface ScanRange {
  start: number;
  end: number;
}

export interface FormMeta {
  header?: FormHeaderInfo;
  scanRange: ScanRange;
  issues: FormIssue[];
  enums?: FormEnumerations;
}

export interface FormEnumerations {
  windows: string[];
  gadgets: string[];
}

export interface FormDocument {
  window?: FormWindow;
  gadgets: Gadget[];
  meta: FormMeta;
}
