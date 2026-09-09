// Shared size tokens for the Business Manager widget grid.
//
// Widgets used to free-resize to any pixel dimensions, and each one's own
// ResizeObserver guessed "compact vs detail" from measured-pixel thresholds
// declared here (RING_COMPACT_MIN_*, ALTERNATE_VIEW_MIN_*, DETAIL_VIEW_MIN_*,
// plus Fan Life's own EXPAND_WIDTH). Those thresholds kept drifting out of
// sync with the grid's actual geometry — most recently GRID_ROW_HEIGHT itself
// changing silently broke Temperature Alarms' alternator — because "does this
// look right" depended on the product of two independently-tunable numbers.
// Widgets are now fixed to exactly one of two sizes (below), switched via a
// toggle button rather than a drag handle, so a widget just asks which one
// it currently is (see WidgetSizeContext.ts) instead of re-deriving that
// from its own measured geometry.

// --- Grid geometry (BusinessManagerPage's gridstack grid) -------------------
export const GRID_COLS = 20;
// Column width is fluid (container width / GRID_COLS), measured at ~36px at
// common desktop widths — GRID_ROW_HEIGHT was previously a fixed 20px, well
// under that, so equal row/column *counts* (e.g. a 7x7 minimum) rendered a
// visibly non-square box (7 cols x 7 rows measured 297x188px). Raised to
// match, so equal counts now produce an actually-square box.
export const GRID_ROW_HEIGHT = 36;
export const GRID_MARGIN: [number, number] = [8, 8];

// --- Widget sizes (fixed, not free-resize) ----------------------------------
// Every widget is either SMALL (a square tile) or LARGE (a rectangle twice
// as tall as it is wide). Both share the same width (half the 20-column
// grid) so toggling a widget's size never reflows its neighbors
// horizontally, and two LARGE widgets still fit side by side.
export const WIDGET_SIZE_SMALL = { w: 10, h: 10 } as const;
export const WIDGET_SIZE_LARGE = { w: 10, h: 20 } as const;
