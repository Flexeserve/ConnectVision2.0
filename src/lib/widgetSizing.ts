// Shared size tokens for the Business Manager widget grid and its widgets'
// own compact/expand breakpoints. Every widget's ResizeObserver used to
// declare its own local MIN_CHART_WIDTH/MIN_RING_HEIGHT/etc. constants,
// which drifted independently over time — e.g. Cloud Connected's ring
// threshold (150x165) diverged from the otherwise-identical Stores Online
// and Schedule Compliance rings (110x120), and Fan Life's expand threshold
// (850) was set far higher than every sibling widget's (500) for no
// content-driven reason. Widgets should import from here instead of
// redeclaring their own numbers, so "does this behave like the others"
// stays a fact instead of something that has to be re-verified per widget.

// --- Grid geometry (BusinessManagerPage's react-grid-layout) ---------------
export const GRID_COLS = 20;
export const GRID_ROW_HEIGHT = 20;
export const GRID_MARGIN: [number, number] = [8, 8];

// --- Ring/gauge widgets: compact number <-> ring+legend ---------------------
// Below this, the ring plus its legend can't render without clipping, so the
// widget falls back to just the headline number. Used by Stores Online,
// Schedule Compliance, Cloud Connected, and as Temperature Alarms' first
// (compact <-> ring) tier.
export const RING_COMPACT_MIN_WIDTH = 110;
export const RING_COMPACT_MIN_HEIGHT = 120;

// --- Temperature Alarms' second tier: ring <-> alternating bar chart -------
// Past this, there's room for the 7-day breakdown bar chart, so the panel
// alternates between it and the ring instead of showing the ring only. Only
// Temperature Alarms uses this today, but it's named/shared here so a future
// widget that grows a third tier has a consistent starting point rather than
// picking its own arbitrary number.
export const ALTERNATE_VIEW_MIN_WIDTH = 360;
export const ALTERNATE_VIEW_MIN_HEIGHT = 200;

// --- Chart/table/list widgets: compact number <-> full detail view ---------
// Below this, a widget's full chart/table/list can't render legibly next to
// (or instead of) its headline value, so it falls back to just the value.
// Set well above the shared grid default (state 1, w:10) so the detail view
// only appears once actually resized wider (state 2), not squeezed in at
// half-row width. Used by Temperature, Alarm Summary, Energy Consumption /
// Cost, Energy widget, and Fan Life's progress-bar list.
export const DETAIL_VIEW_MIN_WIDTH = 500;
export const DETAIL_VIEW_MIN_HEIGHT = 160;
