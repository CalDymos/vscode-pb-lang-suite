function roundScale(scale: number): number {
  return Math.round(scale * 100) / 100;
}

export function getLayoutDpiScale(devicePixelRatio: number | undefined): number {
  if (typeof devicePixelRatio !== "number" || !Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) {
    return 1;
  }

  const rounded = roundScale(devicePixelRatio);
  return Math.abs(rounded - 1) < 0.001 ? 1 : rounded;
}

export function isLayoutDpiScalingActive(scale: number): boolean {
  return Number.isFinite(scale) && Math.abs(scale - 1) >= 0.001;
}

function isIntegerLiteral(raw: string | undefined): raw is string {
  return /^-?\d+$/.test((raw ?? "").trim());
}

export function parseUnscaledLayoutRaw(raw: string | undefined): number | undefined {
  const trimmed = raw?.trim();
  if (!isIntegerLiteral(trimmed)) return undefined;
  return Number(trimmed);
}

export function unscaleDisplayedLayoutValue(displayValue: number, scale: number): number {
  if (!Number.isFinite(displayValue)) return 0;
  if (!isLayoutDpiScalingActive(scale)) return Math.trunc(displayValue);
  return Math.round(displayValue / scale);
}

export function getStableDisplayedLayoutValue(unscaledValue: number, scale: number): number {
  if (!Number.isFinite(unscaledValue)) return 0;

  const truncated = Math.trunc(unscaledValue);
  if (!isLayoutDpiScalingActive(scale)) return truncated;

  const estimate = truncated * scale;
  const start = Math.floor(estimate) - 8;
  const end = Math.ceil(estimate) + 8;
  for (let candidate = start; candidate <= end; candidate += 1) {
    if (unscaleDisplayedLayoutValue(candidate, scale) === truncated) {
      return candidate;
    }
  }

  return Math.round(estimate);
}

export function getDisplayedLayoutValue(raw: string | undefined, fallbackValue: number, scale: number): number {
  const parsed = parseUnscaledLayoutRaw(raw);
  if (parsed === undefined) return Math.trunc(fallbackValue);
  return getStableDisplayedLayoutValue(parsed, scale);
}

export function formatDisplayedLayoutUnscaledValue(raw: string | undefined, displayValue: number, scale: number): string {
  const trimmed = raw?.trim();
  if (trimmed && !isIntegerLiteral(trimmed)) {
    return trimmed;
  }
  return String(unscaleDisplayedLayoutValue(displayValue, scale));
}
