import { GADGET_KIND } from "./model";
import type { InsertableGadgetKind } from "./gadgetInsertUtils";

export type ToolboxPanelTabId = "toolbox" | "objects";

export interface ToolboxPanelItem {
  key: string;
  label: string;
  iconText: string;
  kind?: InsertableGadgetKind;
  enabled: boolean;
}

export interface ToolboxPanelCategory {
  id: string;
  title: string;
  items: readonly ToolboxPanelItem[];
}

function buildIconText(label: string): string {
  const words = label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function item(label: string, kind?: InsertableGadgetKind, enabled = Boolean(kind)): ToolboxPanelItem {
  return {
    key: kind ?? label.replace(/\s+/g, "-"),
    label,
    iconText: buildIconText(label),
    kind,
    enabled,
  };
}

const TOOLBOX_PANEL_CATEGORIES: readonly ToolboxPanelCategory[] = [
  {
    id: "common-controls",
    title: "Common Controls",
    items: [
      item("Cursor"),
      item("Button", GADGET_KIND.ButtonGadget),
      item("ButtonImage", GADGET_KIND.ButtonImageGadget),
      item("Calendar", GADGET_KIND.CalendarGadget),
      item("Canvas", GADGET_KIND.CanvasGadget),
      item("CheckBox", GADGET_KIND.CheckBoxGadget),
      item("ComboBox", GADGET_KIND.ComboBoxGadget),
      item("Date", GADGET_KIND.DateGadget),
      item("Editor", GADGET_KIND.EditorGadget),
      item("Explorer Combo", GADGET_KIND.ExplorerComboGadget),
      item("Explorer List", GADGET_KIND.ExplorerListGadget),
      item("Explorer Tree", GADGET_KIND.ExplorerTreeGadget),
      item("HyperLink", GADGET_KIND.HyperLinkGadget),
      item("Image", GADGET_KIND.ImageGadget),
      item("IP", GADGET_KIND.IPAddressGadget),
      item("ListIcon", GADGET_KIND.ListIconGadget),
      item("ListView", GADGET_KIND.ListViewGadget),
      item("OpenGL", GADGET_KIND.OpenGLGadget),
      item("Option", GADGET_KIND.OptionGadget),
      item("ProgressBar", GADGET_KIND.ProgressBarGadget),
      item("Scintilla", GADGET_KIND.ScintillaGadget),
      item("ScrollBar", GADGET_KIND.ScrollBarGadget),
      item("Spin", GADGET_KIND.SpinGadget),
      item("String", GADGET_KIND.StringGadget),
      item("Text", GADGET_KIND.TextGadget),
      item("TrackBar", GADGET_KIND.TrackBarGadget),
      item("Tree", GADGET_KIND.TreeGadget),
      item("Web", GADGET_KIND.WebGadget),
      item("WebView", GADGET_KIND.WebViewGadget),
    ],
  },
  {
    id: "containers",
    title: "Containers",
    items: [
      item("Cursor"),
      item("Container", GADGET_KIND.ContainerGadget),
      item("Frame", GADGET_KIND.FrameGadget),
      item("Panel", GADGET_KIND.PanelGadget),
      item("ScrollArea", GADGET_KIND.ScrollAreaGadget),
      item("Splitter", GADGET_KIND.SplitterGadget),
    ],
  },
  {
    id: "menus-toolbars",
    title: "Menus & Toolbars",
    items: [
      item("Cursor"),
      item("ToolBar"),
      item("StatusBar"),
      item("Menu"),
    ],
  },
] as const;

export function getToolboxPanelCategories(): readonly ToolboxPanelCategory[] {
  return TOOLBOX_PANEL_CATEGORIES;
}

export function getDefaultToolboxPanelKind(): InsertableGadgetKind {
  const firstSelectable = TOOLBOX_PANEL_CATEGORIES
    .flatMap(category => category.items)
    .find(entry => entry.enabled && entry.kind);

  if (!firstSelectable?.kind) {
    throw new Error("No selectable toolbox item is configured.");
  }

  return firstSelectable.kind;
}
