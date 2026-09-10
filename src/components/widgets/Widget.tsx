import { useContext, useEffect, useState, type ReactNode } from "react";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { ProgressCircle } from "@tremor/react";
import { WidgetSpanContext } from "./widgetSpan";
import useElementSize from "../../hooks/useElementSize";

// A dashboard widget with two states — default and expanded. Expanded is
// entered either by the toggle button OR by the widget being resized to
// span >= 2x2 cells in the grid (see widgetSpan.ts, provided by the
// SortableWidget wrapper in BusinessManagerPage).

type WidgetProps = {
  title: string;
  icon?: ReactNode;
  /**
   * Widget body. Receives whether the widget is currently expanded so it can
   * render its compact view or its detailed view.
   */
  children: (expanded: boolean) => ReactNode;
  /** Start expanded. */
  defaultExpanded?: boolean;
  /** Fired on toggle — for optional persistence by the caller. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Extra classes on the outer card. */
  className?: string;
};

export function Widget({
  title,
  icon,
  children,
  defaultExpanded = false,
  onExpandedChange,
  className = "",
}: WidgetProps) {
  const [selfExpanded, setSelfExpanded] = useState(defaultExpanded);
  const span = useContext(WidgetSpanContext);
  // Resized to a big cell -> show the detailed view even without a click.
  const spanForcesExpanded = !!span && (span.c >= 2 || span.r >= 2);
  const expanded = spanForcesExpanded || selfExpanded;

  const toggle = () =>
    setSelfExpanded((prev) => {
      const next = !prev;
      onExpandedChange?.(next);
      return next;
    });

  return (
    <div
      data-expanded={expanded ? "true" : undefined}
      className={`relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-widget border border-line bg-surface shadow-widget dark:shadow-widget-dark ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3.5 pb-2 pt-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {icon ? (
            <span className="shrink-0 text-ink-subtle [&_svg]:size-4">{icon}</span>
          ) : null}
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {title}
          </span>
        </div>
        {!spanForcesExpanded && (
          <button
            type="button"
            onClick={toggle}
            aria-label={expanded ? "Collapse widget" : "Expand widget"}
            aria-pressed={expanded}
            className="-mr-1 shrink-0 rounded-md p-1 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
          >
            {expanded ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3.5">
        {children(expanded)}
      </div>
    </div>
  );
}

// Drop <Widget>s straight into this. Columns auto-fill the container width;
// rows are a FIXED height (so widgets stay uniform tiles and content that
// overflows scrolls locally rather than stretching the cell); an expanded
// widget takes 2x2 and `dense` reflow backfills the holes that leaves.
export function WidgetGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid auto-rows-[15rem] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] grid-flow-row-dense gap-3">
      {children}
    </div>
  );
}

// --- shared body parts ----------------------------------------------------

// A big centered headline number.
export function Metric({
  value,
  unit,
  caption,
  tone = "default",
  expanded = false,
}: {
  value: ReactNode;
  unit?: ReactNode;
  caption?: ReactNode;
  tone?: "default" | "accent" | "success" | "danger";
  expanded?: boolean;
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "success"
        ? "text-success"
        : tone === "danger"
          ? "text-danger"
          : "text-ink";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
      <div
        className={`font-bold leading-none tabular-nums ${toneClass} ${
          expanded ? "text-5xl" : "text-4xl"
        }`}
      >
        {value}
        {unit ? (
          <span className="ml-1 text-[0.4em] font-semibold text-ink-muted">
            {unit}
          </span>
        ) : null}
      </div>
      {caption ? (
        <div className="text-xs text-ink-muted">{caption}</div>
      ) : null}
    </div>
  );
}

export type RingSegment = {
  name: string;
  value: number;
  /** Tailwind palette name (also a Tremor colour name). */
  color: "emerald" | "gray" | "amber" | "red" | "blue" | "orange";
};

// A radial progress ring (Tremor ProgressCircle) with a headline number and
// short caption in the middle and a colour-keyed legend below. The arc shows
// the first segment's share of the total. The ring is fluid — it sizes itself
// to whatever space the widget hands it (kept square, never overflowing),
// matching the gauges in Offline Devices.
export function RingView({
  centerValue,
  centerLabel,
  segments,
  expanded = false,
}: {
  centerValue: ReactNode;
  centerLabel?: string;
  segments: RingSegment[];
  expanded?: boolean;
}) {
  const [fitRef, { width, height }] = useElementSize<HTMLDivElement>();
  const side = Math.min(width, height);
  const radius = Math.max(28, Math.min(90, Math.floor(side / 2) - 12));
  const strokeWidth = Math.max(7, Math.round(radius / 6));
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const primary = segments[0]!;
  const pct = Math.round((primary.value / total) * 100);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
      <div
        ref={fitRef}
        className="flex min-h-[6rem] w-full flex-1 items-center justify-center"
      >
        <ProgressCircle
          value={pct}
          radius={radius}
          strokeWidth={strokeWidth}
          color={primary.color}
          showAnimation={false}
        >
          <div className="flex flex-col items-center px-1 text-center">
            <span
              className={`font-bold leading-none tabular-nums text-ink ${
                expanded ? "text-3xl" : "text-2xl"
              }`}
            >
              {centerValue}
            </span>
            {centerLabel ? (
              <span className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-subtle">
                {centerLabel}
              </span>
            ) : null}
          </div>
        </ProgressCircle>
      </div>
      <div className="flex shrink-0 flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span
            key={s.name}
            className="flex items-center gap-1.5 text-xs text-ink-muted"
          >
            <span className={`size-2 rounded-full bg-${s.color}-500`} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

type ListTone = "default" | "success" | "danger" | "warning";
const listToneClass: Record<ListTone, string> = {
  default: "text-ink",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
};

// A scrollable per-store breakdown for a widget's expanded view.
export function StoreList({
  rows,
}: {
  rows: { key: string; name: string; value: ReactNode; tone?: ListTone }[];
}) {
  return (
    <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto pr-1">
      {rows.map((r) => (
        <div
          key={r.key}
          className="flex items-center justify-between gap-3 py-1.5 text-sm"
        >
          <span className="truncate text-ink-muted">{r.name}</span>
          <span
            className={`shrink-0 font-semibold tabular-nums ${
              listToneClass[r.tone ?? "default"]
            }`}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Cycles an expanded widget through a set of views on a timer. A standalone
// toggle button (top-right) turns the auto-cycle on/off; the progress dots sit
// in a bar along the bottom and can be clicked to jump straight to a view
// (which also pauses the cycle so you can hold on it).
export function Alternator({
  panes,
  intervalMs = 6000,
}: {
  panes: { key: string; label: string; node: ReactNode }[];
  intervalMs?: number;
}) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const count = panes.length;

  useEffect(() => {
    if (!auto || count < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [auto, count, intervalMs]);

  if (count === 0) return null;
  const active = panes[Math.min(i, count - 1)]!;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {count > 1 && (
        <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            {active.label}
          </span>
          <button
            type="button"
            onClick={() => setAuto((a) => !a)}
            aria-label={auto ? "Auto-cycling views — pause" : "Views paused — resume"}
            aria-pressed={auto}
            title={auto ? "Auto-cycling — click to hold" : "Paused — click to resume"}
            className="flex shrink-0 items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted transition-colors hover:text-ink"
          >
            <RefreshCw className={`size-3 ${auto ? "opacity-100" : "opacity-40"}`} />
            {auto ? "Auto" : "Hold"}
          </button>
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        {panes.map((p, n) => (
          <div
            key={p.key}
            className={`absolute inset-0 flex flex-col transition-opacity duration-500 ${
              n === i ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {p.node}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-2 flex shrink-0 items-center justify-center gap-1.5">
          {panes.map((p, n) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setAuto(false);
                setI(n);
              }}
              aria-label={`Show ${p.label}`}
              aria-current={n === i}
              className={`size-1.5 rounded-full transition-colors ${
                n === i ? "bg-accent" : "bg-line-strong hover:bg-ink-subtle"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
