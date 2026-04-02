export type InspectorGadgetItemLabelLike = {
  text?: string;
  textRaw?: string;
};

export function getPanelInspectorItemLabel(item: InspectorGadgetItemLabelLike | undefined, index: number): string {
  const name = item?.text ?? item?.textRaw ?? "";
  return name.length ? `[${index}] ${name}` : `[${index}]`;
}
