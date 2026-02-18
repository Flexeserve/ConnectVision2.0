import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import "./WidgetBase.css";
import "./EnergyCostWidget.css";

const DATASET = [
  { day: "Mon", current: 180, last: 160 },
  { day: "Tue", current: 220, last: 200 },
  { day: "Wed", current: 190, last: 180 },
  { day: "Thu", current: 250, last: 220 },
  { day: "Fri", current: 240, last: 210 },
  { day: "Sat", current: 280, last: 240 },
  { day: "Sun", current: 210, last: 190 },
];

const CURRENCY_OPTIONS = [
  { code: "GBP", symbol: "£", rate: 0.18 },
  { code: "EUR", symbol: "€", rate: 0.21 },
  { code: "USD", symbol: "$", rate: 0.23 },
];

export default function EnergyCostWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 320, height: 160 });
  const [currency, setCurrency] = useState(CURRENCY_OPTIONS[0]);

  useEffect(() => {
    if (!widgetRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const nextWidth = Math.max(240, width * 0.55);
        const nextHeight = Math.max(140, height - 80);
        setChartSize({ width: nextWidth, height: nextHeight });
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);

  const totalKwh = useMemo(
    () => DATASET.reduce((sum, v) => sum + v.current, 0),
    [],
  );
  const totalCost = useMemo(
    () => totalKwh * currency.rate,
    [totalKwh, currency],
  );

  const xAxis = useMemo(
    () => [
      {
        dataKey: "day",
        scaleType: "band",
        label: "Time (days)",
      },
    ],
    [],
  );
  const yAxis = useMemo(
    () => [
      {
        label: "kWh",
      },
    ],
    [],
  );
  const series = useMemo(
    () => [
      {
        dataKey: "current",
        label: "This week",
        color: "#d94d14",
        curve: "monotoneX",
        showMark: false,
      },
      {
        dataKey: "last",
        label: "Last week",
        color: "#7a7a7a",
        curve: "monotoneX",
        showMark: false,
      },
    ],
    [],
  );

  return (
    <div ref={widgetRef} className="widget-card widget-energy-cost">
      <div className="widget-title">
        <span>Energy Consumption / Cost</span>
      </div>

      <div className="energy-cost-body">
        <div className="energy-cost-left">
          <div className="energy-cost-label">Cost</div>
          <div className="energy-cost-value">
            {currency.symbol}
            {totalCost.toFixed(1)}
          </div>
          <div className="energy-cost-sub">{totalKwh} kWh</div>
          <select
            className="energy-currency-select"
            value={currency.code}
            onChange={(event) => {
              const next =
                CURRENCY_OPTIONS.find((opt) => opt.code === event.target.value) ??
                CURRENCY_OPTIONS[0];
              setCurrency(next);
            }}
            aria-label="Select currency"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.code}
              </option>
            ))}
          </select>
        </div>

        <div className="energy-cost-chart">
          <LineChart
            dataset={DATASET}
            xAxis={xAxis}
            yAxis={yAxis}
            series={series}
            width={chartSize.width}
            height={chartSize.height}
            grid={{ vertical: true, horizontal: true }}
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
          />
        </div>
      </div>
    </div>
  );
}
