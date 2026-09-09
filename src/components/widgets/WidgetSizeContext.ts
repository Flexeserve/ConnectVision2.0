import { createContext, useContext } from "react";

// Widgets no longer free-resize to arbitrary pixel dimensions — every widget
// is either SMALL (a compact square tile) or LARGE (a tall rectangle, 2x the
// height of its width), toggled via a button on the widget itself (see
// WidgetSlot in BusinessManagerPage.tsx). This replaces the old pattern
// where each widget's own ResizeObserver guessed "compact vs detail" from
// measured pixel thresholds (DETAIL_VIEW_MIN_WIDTH, RING_COMPACT_MIN_*,
// ALTERNATE_VIEW_MIN_*, Fan Life's own EXPAND_WIDTH) — fragile because a
// threshold tuned for one grid scale silently broke the next time the grid's
// row height or column count changed (see widgetSizing.ts's history of
// recalibrating these). With only two possible sizes, a widget can just ask
// which one it currently is instead of re-deriving that from geometry.
export type WidgetSize = "small" | "large";

export const WidgetSizeContext = createContext<WidgetSize>("small");

export const useWidgetSize = (): WidgetSize => useContext(WidgetSizeContext);
