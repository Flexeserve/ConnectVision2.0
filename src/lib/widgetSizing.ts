// Shared size tokens for the Business Manager widget grid.
//
// Widgets no longer guess "compact vs detail" from measured-pixel thresholds
// (which kept drifting out of sync with the grid's geometry). Each widget
// just asks whether it's currently "small" or "large" (see
// WidgetSizeContext.ts), derived from its aspect ratio in grid units, and
// the grid uses square cells so grid-unit ratios and on-screen ratios match.

// --- Grid geometry (BusinessManagerPage's gridstack grid) -------------------
export const GRID_COLS = 20;
// Cells are square: BusinessManagerPage measures the live column width and
// feeds it back as `cellHeight`, so a widget's ratio in grid units (e.g.
// LARGE's 10x20 = 1:2) is also its ratio on screen.
export const GRID_MARGIN: [number, number] = [8, 8];

// --- Widget sizes ---------------------------------------------------------
// Widgets free-resize between the bounds below. SMALL (a square tile) and
// LARGE (twice as tall as wide) are the two presets the toggle button snaps
// to — both half the 20-column grid wide, so two LARGE widgets fit side by
// side.
export const WIDGET_SIZE_SMALL = { w: 10, h: 10 } as const;
export const WIDGET_SIZE_LARGE = { w: 10, h: 20 } as const;

// Resize bounds applied to every widget (uniform — each widget already
// adapts its own content responsively via the small/large aspect heuristic
// and Tremor's responsive charts).
export const WIDGET_BOUNDS = {
  minW: 6,
  minH: 6,
  maxW: GRID_COLS,
  maxH: 28,
} as const;
