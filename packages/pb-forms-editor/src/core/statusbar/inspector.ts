export const STATUSBAR_WIDTH_IGNORE_LITERAL = "#PB_Ignore";
export const STATUSBAR_WIDTH_INPUT_ERROR = `Only non-negative integer values or ${STATUSBAR_WIDTH_IGNORE_LITERAL} are supported.`;

export type ParsedStatusBarWidthInput =
  | { ok: true; raw: string; previewWidth: number | null }
  | { ok: false; error: string };

export function parseStatusBarWidthInspectorInput(raw: string): ParsedStatusBarWidthInput {
  const trimmed = raw.trim();
  if (!trimmed.length) {
    return { ok: false, error: STATUSBAR_WIDTH_INPUT_ERROR };
  }

  if (trimmed === STATUSBAR_WIDTH_IGNORE_LITERAL || trimmed === "-1") {
    return {
      ok: true,
      raw: STATUSBAR_WIDTH_IGNORE_LITERAL,
      previewWidth: null
    };
  }

  if (!/^[+]?[0-9]+$/.test(trimmed)) {
    return { ok: false, error: STATUSBAR_WIDTH_INPUT_ERROR };
  }

  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 0) {
    return { ok: false, error: STATUSBAR_WIDTH_INPUT_ERROR };
  }

  return {
    ok: true,
    raw: String(value),
    previewWidth: value
  };
}

export function normalizeStatusBarProgressRaw(progressBar: boolean | undefined, progressRaw: string | undefined): string {
  if (!progressBar) return "";
  return "0";
}

export function getStatusBarProgressInspectorValue(progressBar: boolean | undefined, progressRaw: string | undefined): string {
  return normalizeStatusBarProgressRaw(progressBar, progressRaw);
}
