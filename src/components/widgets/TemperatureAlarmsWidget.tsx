import { useEffect, useMemo, useRef, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import Card from "@mui/material/Card";
import "./WidgetBase.css";
import "./TemperatureAlarmsWidget.css";
import { seededInt } from "../../lib/seededRandom";

type TemperatureAlarmsWidgetProps = {
  storeIds?: string[];
};

const HIGH_COLOR = "#f14734";
const LOW_COLOR = "#205ffd";
const NONE_COLOR = "#adadad";

const DAYS = 7;
const WEEKDAY_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

// The last label is always "Today"; the rest are the actual weekday names
// for the preceding days (not just "D1, D2, ..."), based on today's real
// date rather than a fixed Monday-Sunday sequence.
const buildDayLabels = (): string[] => {
  const today = new Date();
  return Array.from({ length: DAYS }, (_, i) => {
    const offset = DAYS - 1 - i;
    if (offset === 0) return "Today";
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    return WEEKDAY_NAMES[date.getDay()];
  });
};
const DAY_LABELS = buildDayLabels();

// Most days a store raises no temperature alarms; each store independently
// has a small seeded chance of raising 1-3 on a given day, so a region/root
// scope's daily count is the sum across however many stores it covers.
const buildDailyCounts = (storeIds: string[], seedKey: string) =>
  Array.from({ length: DAYS }, (_, dayIndex) =>
    storeIds.reduce((sum, id) => {
      const raised = seededInt(`${id}:${seedKey}:day${dayIndex}:roll`, 0, 99) < 12;
      return (
        sum + (raised ? seededInt(`${id}:${seedKey}:day${dayIndex}:count`, 1, 3) : 0)
      );
    }, 0),
  );

// Below this, the ring/legend (or the bar chart, once expanded) can't
// render without clipping — fall back to just the headline total instead.
const MIN_PANEL_HEIGHT = 110;
const MIN_PANEL_WIDTH = 120;
// Past this, the panel has room for the 7-day breakdown bar chart, so it
// alternates with the ring instead of showing the ring only.
const EXPAND_HEIGHT = 200;
const EXPAND_WIDTH = 360;
// How long each view (ring, then bar chart) stays up before crossfading
// to the other.
const ALTERNATE_INTERVAL_MS = 6000;

export default function TemperatureAlarmsWidget({
  storeIds = ["root"],
}: TemperatureAlarmsWidgetProps) {
  const highDaily = useMemo(
    () => buildDailyCounts(storeIds, "temp-alarm-high"),
    [storeIds],
  );
  const lowDaily = useMemo(
    () => buildDailyCounts(storeIds, "temp-alarm-low"),
    [storeIds],
  );
  const highCount = highDaily[highDaily.length - 1] ?? 0;
  const lowCount = lowDaily[lowDaily.length - 1] ?? 0;
  const totalCount = highCount + lowCount;

  const slices = useMemo(
    () =>
      totalCount === 0
        ? [{ id: 0, value: 1, color: NONE_COLOR, label: "No alarms" }]
        : [
            { id: 0, value: highCount, color: HIGH_COLOR, label: "High" },
            { id: 1, value: lowCount, color: LOW_COLOR, label: "Low" },
          ],
    [highCount, lowCount, totalCount],
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState({ width: 200, height: 200 });
  const [isCompact, setIsCompact] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBarChart, setShowBarChart] = useState(false);
  const [lastIsExpanded, setLastIsExpanded] = useState(isExpanded);
  if (isExpanded !== lastIsExpanded) {
    setLastIsExpanded(isExpanded);
    if (!isExpanded) setShowBarChart(false);
  }

  useEffect(() => {
    if (!panelRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsCompact(height < MIN_PANEL_HEIGHT || width < MIN_PANEL_WIDTH);
        setIsExpanded(width >= EXPAND_WIDTH && height >= EXPAND_HEIGHT);
        setPanelSize({ width, height });
      }
    });

    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  // Only alternate once there's room for both views — below that, the ring
  // is the only one that fits, so it just stays put.
  useEffect(() => {
    if (!isExpanded) return;
    const interval = setInterval(() => {
      setShowBarChart((prev) => !prev);
    }, ALTERNATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isExpanded]);

  const ringSize = Math.max(72, Math.min(panelSize.width, panelSize.height - 40, 176));

  const ringView = (
    <>
      <div className="temp-alarms-ring-wrap" style={{ width: ringSize, height: ringSize }}>
        <PieChart
          series={[
            {
              data: slices,
              innerRadius: ringSize * 0.36,
              outerRadius: ringSize * 0.48,
              cornerRadius: 2,
            },
          ]}
          hideLegend
          width={ringSize}
          height={ringSize}
        />
        <div className="temp-alarms-value">{totalCount}</div>
      </div>
      <div className="temp-alarms-legend">
        <span className="temp-alarms-legend-item">
          <span className="temp-alarms-dot temp-alarms-dot--high" />
          High
        </span>
        <span className="temp-alarms-legend-item">
          <span className="temp-alarms-dot temp-alarms-dot--low" />
          Low
        </span>
      </div>
    </>
  );

  const barView = (
    <BarChart
      series={[
        { data: highDaily, color: HIGH_COLOR, label: "High" },
        { data: lowDaily, color: LOW_COLOR, label: "Low" },
      ]}
      xAxis={[{ scaleType: "band", data: DAY_LABELS }]}
      width={panelSize.width}
      height={panelSize.height}
      slotProps={{ legend: { sx: { color: "var(--text-primary)" } } }}
      sx={{
        "& .MuiChartsAxis-tickLabel": { fill: "var(--widget-text-primary)" },
        "& .MuiChartsAxis-label": { fill: "var(--widget-text-primary)" },
        "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
          stroke: "var(--widget-text-primary)",
        },
        "& .MuiChartsGrid-line": { stroke: "rgba(0, 0, 0, 0.08)" },
        ".dark & .MuiChartsGrid-line": { stroke: "rgba(255, 255, 255, 0.12)" },
      }}
      grid={{ horizontal: true }}
    />
  );

  return (
    <Card className="widget-card widget-temp-alarms">
      <div className="widget-title">Temperature Alarms</div>
      <div className="temp-alarms-body">
        <div className="temp-alarms-panel" ref={panelRef}>
          {isCompact ? (
            <span
              className="temp-alarms-value temp-alarms-value--compact"
              style={{ color: totalCount === 0 ? "#1fb05c" : "var(--widget-text-primary)" }}
            >
              {totalCount}
            </span>
          ) : isExpanded ? (
            // Both views stay mounted and crossfade via opacity instead of
            // swapping — remounting the chart on every alternation would
            // restart its own enter animation and lose the smooth fade.
            <div className="temp-alarms-alternator">
              <div
                className={`temp-alarms-alternator-pane ${!showBarChart ? "is-visible" : ""}`}
              >
                {ringView}
              </div>
              <div
                className={`temp-alarms-alternator-pane ${showBarChart ? "is-visible" : ""}`}
              >
                {barView}
              </div>
            </div>
          ) : (
            ringView
          )}
        </div>
      </div>
    </Card>
  );
}
