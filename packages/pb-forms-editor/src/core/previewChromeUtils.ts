export type PreviewRect = { x: number; y: number; w: number; h: number };

export type PreviewChromeMetrics = {
  panelHeight: number;
  scrollAreaWidth: number;
  splitterWidth: number;
};

export function intersectRect(a: PreviewRect, b: PreviewRect): PreviewRect {
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

export function rectContainsPoint(rect: PreviewRect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function isPointOnRectBorder(rect: PreviewRect, x: number, y: number, margin = 4): boolean {
  if (!rectContainsPoint(rect, x, y)) return false;
  return x <= rect.x + margin
    || x >= rect.x + rect.w - margin
    || y <= rect.y + margin
    || y >= rect.y + rect.h - margin;
}

export function getScrollAreaBarSize(rect: PreviewRect, metrics: PreviewChromeMetrics): number {
  return Math.min(metrics.scrollAreaWidth, Math.max(12, Math.min(rect.w, rect.h) - 4));
}

export function getScrollAreaVerticalBarRect(rect: PreviewRect, metrics: PreviewChromeMetrics): PreviewRect {
  const bar = getScrollAreaBarSize(rect, metrics);
  return {
    x: rect.x + rect.w - bar,
    y: rect.y,
    w: bar,
    h: Math.max(0, rect.h - bar)
  };
}

export function getScrollAreaHorizontalBarRect(rect: PreviewRect, metrics: PreviewChromeMetrics): PreviewRect {
  const bar = getScrollAreaBarSize(rect, metrics);
  return {
    x: rect.x,
    y: rect.y + rect.h - bar,
    w: Math.max(0, rect.w - bar),
    h: bar
  };
}

export function getScrollAreaMaxOffsetX(
  rect: PreviewRect,
  metrics: PreviewChromeMetrics,
  innerWidth?: number
): number {
  const bar = getScrollAreaBarSize(rect, metrics);
  const viewportWidth = Math.max(0, rect.w - bar);
  const contentWidth = typeof innerWidth === "number" && innerWidth > 0 ? innerWidth : viewportWidth;
  return Math.max(0, contentWidth - viewportWidth);
}

export function getScrollAreaMaxOffsetY(
  rect: PreviewRect,
  metrics: PreviewChromeMetrics,
  innerHeight?: number
): number {
  const bar = getScrollAreaBarSize(rect, metrics);
  const viewportHeight = Math.max(0, rect.h - bar);
  const contentHeight = typeof innerHeight === "number" && innerHeight > 0 ? innerHeight : viewportHeight;
  return Math.max(0, contentHeight - viewportHeight);
}

export function getScrollAreaVerticalThumbRect(
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

export function getScrollAreaHorizontalThumbRect(
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

export function getSplitterBarRect(
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
