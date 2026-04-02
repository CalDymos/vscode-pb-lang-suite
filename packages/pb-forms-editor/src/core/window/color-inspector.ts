export const WINDOW_COLOR_LITERAL_ERROR_MESSAGE = "Window Color accepts only RGB(r,g,b) or a $hex literal.";

export function pbColorNumberToCssHex(value: number | undefined): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const color = value & 0xffffff;
  const red = color & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = (color >> 16) & 0xff;
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export function cssHexToPbRgbRaw(value: string): string | undefined {
  const normalized = normalizeCssHexColor(value);
  if (!normalized) return undefined;
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  if ([red, green, blue].some((channel) => !Number.isFinite(channel))) return undefined;
  return `RGB(${red},${green},${blue})`;
}

export function normalizeCssHexColor(value: string | undefined): string | undefined {
  const raw = (value ?? "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(raw)) return undefined;
  return raw.toLowerCase();
}

export function parseWindowColorInspectorInput(value: string | undefined):
  | { ok: true; raw?: string; previewColor?: number }
  | { ok: false } {
  const raw = (value ?? "").trim();
  if (!raw.length) return { ok: true, raw: undefined, previewColor: undefined };

  if (/^\$[0-9a-f]+$/i.test(raw)) {
    const parsed = Number.parseInt(raw.slice(1), 16);
    if (!Number.isFinite(parsed)) return { ok: false };
    return { ok: true, raw, previewColor: parsed & 0xffffff };
  }

  const rgbMatch = /^RGB\((.+)\)$/i.exec(raw);
  if (!rgbMatch) return { ok: false };

  const parts = (rgbMatch[1] ?? "").split(",");
  if (parts.length !== 3) return { ok: false };

  const channels = parts.map((part) => Number(part.trim()));
  if (channels.some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)) {
    return { ok: false };
  }

  const [red, green, blue] = channels;
  return {
    ok: true,
    raw: `RGB(${red},${green},${blue})`,
    previewColor: ((blue as number) << 16) | ((green as number) << 8) | (red as number)
  };
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

export function getWindowColorInspectorDisplay(raw: string | undefined): string {
  return (raw ?? "").trim();
}
