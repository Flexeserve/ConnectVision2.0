import { useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { DonutChart } from "@tremor/react";

// A dashboard widget with two states — default and expanded — toggled by a
// button, not by resizing. In a CSS grid (see <WidgetGrid>) an expanded
// widget spans 2x2; everything else is a single square tile and the grid
// reflows to fill the gaps. No drag, no resize handles, no geometry math.

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
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () =>
    setExpanded((prev) => {
      const next = !prev;
      onExpandedChange?.(next);
      return next;
    });

  return (
    <div
      data-expanded={expanded}
      className={`relative flex min-h-[220px] flex-col overflow-hidden rounded-widget border border-line bg-surface shadow-widget dark:shadow-widget-dark ${
        expanded ? "sm:col-span-2 sm:row-span-2" : ""
      } ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3.5 pb-2 pt-3">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {icon ? (
            <span className="text-ink-subtle [&_svg]:size-4">{icon}</span>
          ) : null}
          <button
            type="button"
            onClick={toggle}
            aria-label={expanded ? "Collapse widget" : "Expand widget"}
            aria-pressed={expanded}
            className="-mr-1 rounded-md p-1 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
          >
            {expanded ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3.5">
        {children(expanded)}
      </div>
    </div>
  );
}

// Drop <Widget>s straight into this. Columns auto-fill the container width;
// rows are a fixed height and an expanded widget takes 2x2; `dense` reflow
// backfills the holes that leaves.
export function WidgetGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid auto-rows-[minmax(220px,auto)] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] grid-flow-row-dense gap-3">
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

// A Tremor donut with a headline number overlaid and a colour-keyed legend.
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
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <div className="relative">
        <DonutChart
          data={segments}
          category="value"
          index="name"
          colors={segments.map((s) => s.color)}
          showLabel={false}
          showTooltip={expanded}
          className={expanded ? "h-44 w-44" : "h-28 w-28"}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
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
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
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
