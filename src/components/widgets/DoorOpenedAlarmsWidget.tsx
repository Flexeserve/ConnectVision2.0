import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import "./WidgetBase.css";
import "./DoorOpenedAlarmsWidget.css";

const generateSeries = (length: number) => {
  const base = 82;
  const values: number[] = [];
  const eventCount = Math.max(2, Math.round(length / 4));
  const eventGap = Math.max(2, Math.floor(length / eventCount));
  const dropDepth = 8 + Math.round(Math.random() * 6); // 8-14C drop
  const recoverySteps = 3;

  let doorEventIndex = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < length; i += 1) {
    const inRecovery = i > doorEventIndex && i <= doorEventIndex + recoverySteps;
    const currentBase = inRecovery
      ? base - dropDepth + (dropDepth * (i - doorEventIndex)) / recoverySteps
      : base;
    const noise = Math.floor(Math.random() * 3) - 1; // -1 to +1
    const value = Math.min(92, Math.max(68, Math.round(currentBase + noise)));
    values.push(value);

    if (i === doorEventIndex) {
      values[i] = Math.max(68, base - dropDepth);
      doorEventIndex += eventGap + Math.floor(Math.random() * 2);
    }
  }

  return values;
};

const X_LABELS_BY_RANGE: Record<string, string[]> = {
  "last-week": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "last-month": ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"],
  "last-3-months": [
    "W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13","W14","W15","W16","W17","W18",
  ],
};

export default function DoorOpenedAlarmsWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 320, height: 160 });
  const [range, setRange] = useState("last-week");
  const seriesData = useMemo(() => {
    if (range === "last-week") return generateSeries(7);
    if (range === "last-month") return generateSeries(12);
    return generateSeries(18);
  }, [range]);
  const xLabels = useMemo(
    () => X_LABELS_BY_RANGE[range] ?? X_LABELS_BY_RANGE["last-week"],
    [range],
  );

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
        const nextWidth = Math.max(220, width - 12);
        const nextHeight = Math.max(140, height - 90);
        setChartSize({ width: nextWidth, height: nextHeight });
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);


  return (
    <div ref={widgetRef} className="widget-card widget-door-opened">
      <div className="widget-title widget-title-row">
        <span>Door Opened Alarms</span>
        <select
          className="alarm-range-select"
          value={range}
          onChange={(event) => setRange(event.target.value)}
          aria-label="Select time range"
        >
          <option value="last-week">Last week</option>
          <option value="last-month">Last month</option>
          <option value="last-3-months">Last 3 months</option>
        </select>
      </div>

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
                showMark: ({ index }) => {
                  if (index === 0 || index === seriesData.length - 1) return true;
                  if (seriesData.length < 3) return true;
                  const prev = seriesData[index - 1];
                  const curr = seriesData[index];
                  const next = seriesData[index + 1];
                  const isTrough = curr <= prev && curr <= next;
                  return !isTrough;
                },
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
                label:
                  range === "last-week"
                    ? "Time (days)"
                    : range === "last-month"
                      ? "Time (weeks)"
                      : "Time (weeks)",
              },
            ]}
            yAxis={[
              {
                label: "Temperature (°C)",
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
    </div>
  );
}
