export const STATUSBAR_KNOWN_FLAGS = [
  "#PB_StatusBar_Raised",
  "#PB_StatusBar_BorderLess",
  "#PB_StatusBar_Center",
  "#PB_StatusBar_Right"
] as const;

export type StatusBarKnownFlag = (typeof STATUSBAR_KNOWN_FLAGS)[number];

export type StatusBarFieldLike = {
  widthRaw?: string;
  textRaw?: string;
  text?: string;
  imageRaw?: string;
  imageId?: string;
  flagsRaw?: string;
  progressBar?: boolean;
  progressRaw?: string;
};

export type StatusBarProgressPreviewMetrics = {
  progress: number;
  trackWidth: number;
  trackHeight: number;
  fillWidth: number;
};

export function parseStatusBarWidth(widthRaw: string | undefined): number | null {
  const trimmed = (widthRaw ?? "").trim();
  if (!trimmed.length || trimmed === "#PB_Ignore") return null;
  const width = Number(trimmed);
  if (!Number.isFinite(width) || width < 0) return null;
  return Math.trunc(width);
}

export function splitPbFlags(flagsRaw: string | undefined): string[] {
  return (flagsRaw ?? "")
    .split("|")
    .map(part => part.trim())
    .filter(Boolean);
}

export function buildStatusBarFlagsRaw(
  existingRaw: string | undefined,
  updates: Partial<Record<StatusBarKnownFlag, boolean>>
): string | undefined {
  const current = splitPbFlags(existingRaw);
  const currentSet = new Set(current);
  for (const flag of STATUSBAR_KNOWN_FLAGS) {
    const next = updates[flag];
    if (typeof next !== "boolean") continue;
    if (next) currentSet.add(flag);
    else currentSet.delete(flag);
  }
  const unknown = current.filter(flag => !STATUSBAR_KNOWN_FLAGS.includes(flag as StatusBarKnownFlag));
  const orderedKnown = STATUSBAR_KNOWN_FLAGS.filter(flag => currentSet.has(flag));
  const merged = [...orderedKnown, ...unknown];
  return merged.length ? merged.join(" | ") : undefined;
}

export function getStatusBarFieldDisplayKind(field: StatusBarFieldLike): string {
  if (field.progressBar) return "Progress";
  if ((field.imageRaw ?? "").trim().length) return "Image";
  if ((field.textRaw ?? "").trim().length) return "Label";
  return "Empty";
}

export function getStatusBarFieldDisplaySummary(field: StatusBarFieldLike): string {
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

function parseStatusBarProgress(progressRaw: string | undefined): number {
  const parsed = Number((progressRaw ?? "").trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.trunc(parsed)));
}

export function getStatusBarProgressPreviewMetrics(fieldWidth: number, fieldHeight: number, progressRaw: string | undefined): StatusBarProgressPreviewMetrics {
  const trackWidth = Math.max(8, Math.trunc(fieldWidth));
  const trackHeight = Math.max(6, Math.trunc(fieldHeight) - 10);
  const innerWidth = Math.max(0, trackWidth - 2);
  const progress = parseStatusBarProgress(progressRaw);
  const fillWidth = Math.max(0, Math.round((innerWidth * progress) / 100));
  return { progress, trackWidth, trackHeight, fillWidth };
}
