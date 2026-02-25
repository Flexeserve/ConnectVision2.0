import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import "./WidgetBase.css";
import "./DoorOpenedAlarmsWidget.css";

const TIME_SLOTS = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "00:00", "03:00"];

const buildRangeLabels = (days: number) =>
  Array.from({ length: days }).flatMap((_, dayIndex) =>
    TIME_SLOTS.map((slot) => `D${dayIndex + 1} ${slot}`),
  );

const generateSeries = (days: number) => {
  const pointsPerDay = TIME_SLOTS.length;
  const values: number[] = [];
  const base = 80;

  for (let day = 0; day < days; day += 1) {
    const dayStart = values.length;
    const doorIndex = dayStart + 2 + Math.floor(Math.random() * 3);
    const dropDepth = 10 + Math.floor(Math.random() * 6); // 10-15C drop
    const recoverySteps = 2 + Math.floor(Math.random() * 2); // 2-3 points

    for (let i = 0; i < pointsPerDay; i += 1) {
      const idx = dayStart + i;
      const noise = Math.floor(Math.random() * 3) - 1;
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

export default function DoorOpenedAlarmsWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 320, height: 160 });
  const [range, setRange] = useState("last-week");
  const seriesData = useMemo(() => {
    if (range === "last-3-days") return generateSeries(3);
    return generateSeries(7);
  }, [range]);
  const xLabels = useMemo(
    () => buildRangeLabels(range === "last-3-days" ? 3 : 7),
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
        <span>Temperature</span>
        <select
          className="alarm-range-select"
          value={range}
          onChange={(event) => setRange(event.target.value)}
          aria-label="Select time range"
        >
          <option value="last-3-days">Last 3 days</option>
          <option value="last-week">Last week</option>
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
    </div>
  );
}
