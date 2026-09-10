import type { ReactNode } from "react";
import { DonutChart } from "@tremor/react";
import { useWidgetSize } from "./WidgetSizeContext";

// The shared card frame for every dashboard widget. Replaces the old
// .widget-card / .widget-title CSS. The card *chrome* (background, radius,
// border, shadow) lives on the .widget-cell wrapper that BusinessManagerPage
// renders around each widget — this component is padding + the title row +
// the content slot.

type WidgetShellProps = {
  title: string;
  icon?: ReactNode;
  /** Extra classes for the content region (the area under the title row). */
  contentClassName?: string;
  children: ReactNode;
};

export function WidgetShell({
  title,
  icon,
  contentClassName = "",
  children,
}: WidgetShellProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden p-3.5">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2.5">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </span>
        {icon ? (
          <span className="shrink-0 text-ink-subtle [&_svg]:size-4">{icon}</span>
        ) : null}
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}

// A large headline metric — the primary read on most widgets. Scales down at
// SMALL so it never clips the square tile.
export function WidgetMetric({
  value,
  unit,
  tone = "default",
}: {
  value: ReactNode;
  unit?: ReactNode;
  tone?: "default" | "accent" | "success" | "danger";
}) {
  const size = useWidgetSize();
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "success"
        ? "text-success"
        : tone === "danger"
          ? "text-danger"
          : "text-ink";
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-1 text-center ${toneClass}`}
    >
      <div
        className={`font-bold leading-none tabular-nums ${
          size === "large" ? "text-5xl" : "text-4xl"
        }`}
      >
        {value}
        {unit ? (
          <span className="ml-1 text-[0.4em] font-semibold text-ink-muted">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function WidgetCaption({ children }: { children: ReactNode }) {
  return <div className="text-xs text-ink-muted">{children}</div>;
}

// The shared donut-ring layout used by Stores Online / Schedule Compliance /
// Cloud Connected. A Tremor <DonutChart> with a headline number overlaid in
// the middle and a colour-keyed legend below.
export type RingSegment = {
  name: string;
  value: number;
  /** Tailwind palette name (also a Tremor colour name), e.g. "emerald". */
  color: "emerald" | "gray" | "amber" | "red" | "blue" | "orange";
};

export function DonutWidget({
  title,
  icon,
  centerValue,
  centerLabel,
  segments,
}: {
  title: string;
  icon?: ReactNode;
  centerValue: ReactNode;
  centerLabel: string;
  segments: RingSegment[];
}) {
  const size = useWidgetSize();
  return (
    <WidgetShell title={title} icon={icon}>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="relative">
          <DonutChart
            data={segments}
            category="value"
            index="name"
            colors={segments.map((s) => s.color)}
            showLabel={false}
            showTooltip={size === "large"}
            className={size === "large" ? "h-44 w-44" : "h-28 w-28"}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-bold leading-none tabular-nums text-ink ${
                size === "large" ? "text-3xl" : "text-2xl"
              }`}
            >
              {centerValue}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-subtle">
              {centerLabel}
            </span>
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
    </WidgetShell>
  );
}
