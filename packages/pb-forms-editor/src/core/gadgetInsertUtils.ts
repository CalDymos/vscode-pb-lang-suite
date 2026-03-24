import { GADGET_KIND, type Gadget, type GadgetKind } from "./model";

export const PBFD_INSERTABLE_GADGET_KINDS = [
  GADGET_KIND.ButtonGadget,
  GADGET_KIND.ButtonImageGadget,
  GADGET_KIND.StringGadget,
  GADGET_KIND.TextGadget,
  GADGET_KIND.CheckBoxGadget,
  GADGET_KIND.OptionGadget,
  GADGET_KIND.FrameGadget,
  GADGET_KIND.ComboBoxGadget,
  GADGET_KIND.ListViewGadget,
  GADGET_KIND.ListIconGadget,
  GADGET_KIND.TreeGadget,
  GADGET_KIND.EditorGadget,
  GADGET_KIND.SpinGadget,
  GADGET_KIND.TrackBarGadget,
  GADGET_KIND.ProgressBarGadget,
  GADGET_KIND.ImageGadget,
  GADGET_KIND.HyperLinkGadget,
  GADGET_KIND.CalendarGadget,
  GADGET_KIND.DateGadget,
  GADGET_KIND.ContainerGadget,
  GADGET_KIND.PanelGadget,
  GADGET_KIND.ScrollAreaGadget,
  GADGET_KIND.WebViewGadget,
  GADGET_KIND.WebGadget,
  GADGET_KIND.OpenGLGadget,
  GADGET_KIND.CanvasGadget,
  GADGET_KIND.ExplorerTreeGadget,
  GADGET_KIND.ExplorerListGadget,
  GADGET_KIND.ExplorerComboGadget,
  GADGET_KIND.IPAddressGadget,
  GADGET_KIND.ScrollBarGadget,
  GADGET_KIND.ScintillaGadget,
] as const satisfies readonly GadgetKind[];

export type InsertableGadgetKind = typeof PBFD_INSERTABLE_GADGET_KINDS[number];

type GadgetIdentityLike = Pick<Gadget, "id" | "pbAny" | "variable" | "firstParam">;

const INSERT_PREFIX_BY_KIND: Record<InsertableGadgetKind, string> = {
  ButtonGadget: "Button_",
  ButtonImageGadget: "ButtonImage_",
  StringGadget: "String_",
  TextGadget: "Text_",
  CheckBoxGadget: "Checkbox_",
  OptionGadget: "Option_",
  FrameGadget: "Frame3D_",
  ComboBoxGadget: "Combo_",
  ListViewGadget: "ListView_",
  ListIconGadget: "ListIcon_",
  TreeGadget: "Tree_",
  EditorGadget: "Editor_",
  SpinGadget: "Spin_",
  TrackBarGadget: "TrackBar_",
  ProgressBarGadget: "ProgressBar_",
  ImageGadget: "Image_",
  HyperLinkGadget: "Hyperlink_",
  CalendarGadget: "Calendar_",
  DateGadget: "Date_",
  ContainerGadget: "Container_",
  PanelGadget: "Panel_",
  ScrollAreaGadget: "ScrollArea_",
  WebViewGadget: "WebView_",
  WebGadget: "WebView_",
  OpenGLGadget: "OpenGL_",
  CanvasGadget: "Canvas_",
  ExplorerTreeGadget: "ExplorerTree_",
  ExplorerListGadget: "ExplorerList_",
  ExplorerComboGadget: "ExplorerCombo_",
  IPAddressGadget: "IP_",
  ScrollBarGadget: "Scrollbar_",
  ScintillaGadget: "Scintilla_",
};

const INSERT_LABEL_BY_KIND: Record<InsertableGadgetKind, string> = {
  ButtonGadget: "Button",
  ButtonImageGadget: "ButtonImage",
  StringGadget: "String",
  TextGadget: "Text",
  CheckBoxGadget: "CheckBox",
  OptionGadget: "Option",
  FrameGadget: "Frame",
  ComboBoxGadget: "ComboBox",
  ListViewGadget: "ListView",
  ListIconGadget: "ListIcon",
  TreeGadget: "Tree",
  EditorGadget: "Editor",
  SpinGadget: "Spin",
  TrackBarGadget: "TrackBar",
  ProgressBarGadget: "ProgressBar",
  ImageGadget: "Image",
  HyperLinkGadget: "HyperLink",
  CalendarGadget: "Calendar",
  DateGadget: "Date",
  ContainerGadget: "Container",
  PanelGadget: "Panel",
  ScrollAreaGadget: "ScrollArea",
  WebViewGadget: "WebView",
  WebGadget: "Web",
  OpenGLGadget: "OpenGL",
  CanvasGadget: "Canvas",
  ExplorerTreeGadget: "ExplorerTree",
  ExplorerListGadget: "ExplorerList",
  ExplorerComboGadget: "ExplorerCombo",
  IPAddressGadget: "IPAddress",
  ScrollBarGadget: "ScrollBar",
  ScintillaGadget: "Scintilla",
};

export type InsertedGadgetIdentity = {
  name: string;
  id: string;
  idRaw: string;
  firstParam: string;
  variable?: string;
  assignedVar?: string;
  pbAny: boolean;
};

export function isInsertableGadgetKind(kind: string): kind is InsertableGadgetKind {
  return (PBFD_INSERTABLE_GADGET_KINDS as readonly string[]).includes(kind);
}

export function getInsertableGadgetKinds(): readonly InsertableGadgetKind[] {
  return PBFD_INSERTABLE_GADGET_KINDS;
}

export function getGadgetInsertPrefix(kind: InsertableGadgetKind): string {
  return INSERT_PREFIX_BY_KIND[kind];
}

export function getGadgetInsertLabel(kind: InsertableGadgetKind): string {
  return INSERT_LABEL_BY_KIND[kind];
}

function stripLeadingHash(value: string | undefined): string {
  return (value ?? "").trim().replace(/^#/, "");
}

function collectExistingGadgetNames(gadgets: readonly GadgetIdentityLike[]): Set<string> {
  const names = new Set<string>();
  for (const gadget of gadgets) {
    const candidates = [
      stripLeadingHash(gadget.variable),
      stripLeadingHash(gadget.firstParam),
      stripLeadingHash(gadget.id),
    ];
    for (const candidate of candidates) {
      if (candidate.length) names.add(candidate);
    }
  }
  return names;
}

function getNextNameForPrefix(prefix: string, existingNames: Set<string>): string {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escapedPrefix}(\\d+)$`);
  let nextIndex = 0;
  for (const name of existingNames) {
    const match = re.exec(name);
    if (!match) continue;
    const value = Number.parseInt(match[1] ?? "", 10);
    if (Number.isFinite(value)) nextIndex = Math.max(nextIndex, value + 1);
  }

  while (existingNames.has(`${prefix}${nextIndex}`)) {
    nextIndex += 1;
  }

  return `${prefix}${nextIndex}`;
}

export function shouldInsertGadgetAsPbAny(gadgets: readonly GadgetIdentityLike[]): boolean {
  const hasPbAny = gadgets.some(gadget => gadget.pbAny);
  const hasEnum = gadgets.some(gadget => !gadget.pbAny);
  return hasPbAny && !hasEnum;
}

export function buildInsertedGadgetIdentity(
  kind: InsertableGadgetKind,
  gadgets: readonly GadgetIdentityLike[],
  pbAny: boolean
): InsertedGadgetIdentity {
  const name = getNextNameForPrefix(getGadgetInsertPrefix(kind), collectExistingGadgetNames(gadgets));
  if (pbAny) {
    return {
      name,
      id: name,
      idRaw: "#PB_Any",
      firstParam: "#PB_Any",
      variable: name,
      assignedVar: name,
      pbAny: true,
    };
  }

  const enumId = `#${name}`;
  return {
    name,
    id: enumId,
    idRaw: enumId,
    firstParam: enumId,
    variable: name,
    pbAny: false,
  };
}
