import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import Card from "@mui/material/Card";
import "./WidgetBase.css";
import "./DoorOpenedAlarmsWidget.css";
import { createSeededRandom } from "../../lib/seededRandom";

const TIME_SLOTS = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "00:00", "03:00"];

const buildRangeLabels = (days: number) =>
  Array.from({ length: days }).flatMap((_, dayIndex) =>
    TIME_SLOTS.map((slot) => `D${dayIndex + 1} ${slot}`),
  );

const generateStoreSeries = (days: number, storeId: string) => {
  const rand = createSeededRandom(`${storeId}:temperature`);
  const pointsPerDay = TIME_SLOTS.length;
  const values: number[] = [];
  const base = 80;

  for (let day = 0; day < days; day += 1) {
    const dayStart = values.length;
    const doorIndex = dayStart + 2 + Math.floor(rand() * 3);
    const dropDepth = 10 + Math.floor(rand() * 6); // 10-15C drop
    const recoverySteps = 2 + Math.floor(rand() * 2); // 2-3 points

    for (let i = 0; i < pointsPerDay; i += 1) {
      const idx = dayStart + i;
      const noise = Math.floor(rand() * 3) - 1;
      let value = base + noise;

      if (idx === doorIndex) {
        value = base - dropDepth;
      } else if (idx > doorIndex && idx <= doorIndex + recoverySteps) {
        const step = idx - doorIndex;
        value = base - dropDepth + (dropDepth * step) / recoverySteps + noise;
      }

      values.push(Math.round(Math.max(60, Math.min(92, value))));
    }
  }

  return values;
};

// Temperature is a sensor reading, not a countable quantity, so the scope's
// series is the pointwise average of its stores' own series — a single
// store shows its own native reading, a region/root shows the blended trend.
const generateAggregateSeries = (days: number, storeIds: string[]) => {
  const perStoreSeries = storeIds.map((id) => generateStoreSeries(days, id));
  const length = perStoreSeries[0]?.length ?? 0;
  return Array.from({ length }, (_, i) =>
    Math.round(
      perStoreSeries.reduce((sum, series) => sum + series[i], 0) / perStoreSeries.length,
    ),
  );
};

type DoorOpenedAlarmsWidgetProps = {
  storeIds?: string[];
};

// Below this, the chart's axes and labels can't render legibly — fall back
// to just the latest reading instead.
const MIN_CHART_HEIGHT = 180;
const MIN_CHART_WIDTH = 260;

export default function DoorOpenedAlarmsWidget({
  storeIds = ["root"],
}: DoorOpenedAlarmsWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 320, height: 160 });
  const [range, setRange] = useState("last-week");
  const [isCompact, setIsCompact] = useState(false);
  const seriesData = useMemo(() => {
    if (range === "last-3-days") return generateAggregateSeries(3, storeIds);
    return generateAggregateSeries(7, storeIds);
  }, [range, storeIds]);
  const xLabels = useMemo(
    () => buildRangeLabels(range === "last-3-days" ? 3 : 7),
    [range],
  );
  const latestReading = seriesData[seriesData.length - 1] ?? 0;

  const isPeakIndex = (index: number) => {
    if (seriesData.length < 3) return true;
    if (index <= 0 || index >= seriesData.length - 1) return false;
    const prev = seriesData[index - 1];
    const curr = seriesData[index];
    const next = seriesData[index + 1];
    return curr >= prev && curr > next;
  };

  useEffect(() => {
    if (!widgetRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsCompact(height < MIN_CHART_HEIGHT || width < MIN_CHART_WIDTH);
        const nextWidth = Math.max(220, width - 12);
        const nextHeight = Math.max(140, height - 90);
        setChartSize({ width: nextWidth, height: nextHeight });
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);


  return (
    <Card ref={widgetRef} className="widget-card widget-door-opened">
      <div className="widget-title widget-title-row">
        <span>Temperature</span>
        {!isCompact && (
          <select
            className="alarm-range-select"
            value={range}
            onChange={(event) => setRange(event.target.value)}
            aria-label="Select time range"
          >
            <option value="last-3-days">Last 3 days</option>
            <option value="last-week">Last week</option>
          </select>
        )}
      </div>

      {isCompact ? (
        <div className="door-opened-compact">
          <span className="door-opened-compact-value">{latestReading}°C</span>
          <span className="door-opened-compact-label">Latest reading</span>
        </div>
      ) : (
      <div className="door-opened-chart">
        <svg width="0" height="0" aria-hidden="true">
          <defs>
            <linearGradient id="doorOpenedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f06a24" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f06a24" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <LineChart
            series={[
              {
                data: seriesData,
                color: "#d94d14",
                curve: "monotoneX",
                area: true,
                showMark: false,
                valueFormatter: (value, context) => {
                  const dataIndex = (context as { dataIndex?: number })?.dataIndex;
                  if (typeof dataIndex === "number" && isPeakIndex(dataIndex)) {
                    return "Door opened";
                  }
                  if (value == null) return "";
                  return `${value}°C`;
                },
              },
            ]}
            xAxis={[
              {
                scaleType: "point",
                data: xLabels.slice(0, seriesData.length),
                label: "Time (hours)",
              },
            ]}
            yAxis={[
              {
                label: "Temperature (°C)",
                sx: {
                  color: "var(--text-primary)",
                },
              },
            ]}
            sx={{
              "& .MuiChartsAxis-tickLabel": {
                fill: "var(--widget-text-primary)",
              },
              "& .MuiChartsAxis-label": {
                fill: "var(--widget-text-primary)",
              },
              "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                stroke: "var(--widget-text-primary)",
              },
              "& .MuiChartsGrid-line": {
                stroke: "rgba(0, 0, 0, 0.08)",
              },
              ".dark & .MuiChartsGrid-line": {
                stroke: "rgba(255, 255, 255, 0.12)",
              },
            }}
          width={chartSize.width}
          height={chartSize.height}
          grid={{ horizontal: true, vertical: false }}
        />

      </div>
      )}
    </Card>
  );
}
