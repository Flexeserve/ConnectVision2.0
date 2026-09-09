import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import Card from "@mui/material/Card";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import "./WidgetBase.css";
import "./EnergyCostWidget.css";
import { seededInt } from "../../lib/seededRandom";
import { useWidgetSize } from "./WidgetSizeContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CURRENCY_OPTIONS = [
  { code: "GBP", symbol: "£", rate: 0.18 },
  { code: "EUR", symbol: "€", rate: 0.21 },
  { code: "USD", symbol: "$", rate: 0.23 },
];

// Each store contributes its own daily kWh usage; the scope's dataset is the
// sum across its stores, so a region/root shows cumulative energy cost while
// a single-store scope shows just that store's own consumption.
const buildDataset = (storeIds: string[]) =>
  DAYS.map((day) => ({
    day,
    current: storeIds.reduce(
      (sum, id) => sum + seededInt(`${id}:energy-current:${day}`, 15, 45),
      0,
    ),
    last: storeIds.reduce(
      (sum, id) => sum + seededInt(`${id}:energy-last:${day}`, 14, 42),
      0,
    ),
  }));

type EnergyCostWidgetProps = {
  storeIds?: string[];
};

export default function EnergyCostWidget({
  storeIds = ["root"],
}: EnergyCostWidgetProps) {
  const DATASET = useMemo(() => buildDataset(storeIds), [storeIds]);
  const size = useWidgetSize();
  const isLarge = size === "large";
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 320, height: 160 });
  const [currency, setCurrency] = useState(CURRENCY_OPTIONS[0]);

  useEffect(() => {
    if (!widgetRef.current || !isLarge) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // LARGE stacks the chart below the KPI (same width as SMALL, just
        // taller), so the chart gets nearly the full width rather than a
        // share of it. Extra buffer beyond title/KPI/padding accounts for
        // the custom dot legend rendered below the plot.
        const nextWidth = Math.max(240, width - 24);
        const nextHeight = Math.max(110, height - 210);
        setChartSize({ width: nextWidth, height: nextHeight });
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, [isLarge]);

  const totalKwh = useMemo(
    () => DATASET.reduce((sum, v) => sum + v.current, 0),
    [DATASET],
  );
  const totalCost = useMemo(
    () => totalKwh * currency.rate,
    [totalKwh, currency],
  );
  // "This week" vs "last week" — same data the chart already plots, just
  // summed instead of charted, to fill the blank space left below the cost
  // once the card grew taller than its own label/value/sub content needs.
  const totalLastKwh = useMemo(
    () => DATASET.reduce((sum, v) => sum + v.last, 0),
    [DATASET],
  );
  const totalLastCost = useMemo(
    () => totalLastKwh * currency.rate,
    [totalLastKwh, currency],
  );
  const costDeltaPercent = useMemo(() => {
    if (totalLastCost === 0) return 0;
    return ((totalCost - totalLastCost) / totalLastCost) * 100;
  }, [totalCost, totalLastCost]);
  // Cost down from last week reads as a saving (green, pointing down);
  // cost up reads as a loss (red, pointing up).
  const isSaving = costDeltaPercent <= 0;

  const xAxis = useMemo(
    () => [
      {
        dataKey: "day",
        scaleType: "band" as const,
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
        curve: "monotoneX" as const,
        showMark: false,
      },
      {
        dataKey: "last",
        label: "Last week",
        color: "#7a7a7a",
        curve: "monotoneX" as const,
        showMark: false,
      },
    ],
    [],
  );

  return (
    <Card ref={widgetRef} className="widget-card widget-energy-cost">
      <div className="widget-title">
        <span>Energy Consumption / Cost</span>
        <AttachMoneyIcon className="widget-title-icon" fontSize="small" />
      </div>

      <div className={`energy-cost-body ${isLarge ? "energy-cost-body--large" : "energy-cost-body--compact"}`}>
        <div className="energy-cost-left">
          <div className="energy-cost-label">Cost</div>
          <div className="energy-cost-value">
            {currency.symbol}
            {totalCost.toFixed(1)}
          </div>
          <div className="energy-cost-sub">{totalKwh} kWh</div>
          {isLarge && (
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
          )}
          <div
            className={`energy-cost-delta ${
              isSaving ? "energy-cost-delta--saving" : "energy-cost-delta--loss"
            }`}
          >
            <span className="energy-cost-delta-arrow" aria-hidden="true">
              {isSaving ? "▼" : "▲"}
            </span>
            {Math.abs(costDeltaPercent).toFixed(1)}%{" "}
            {isSaving ? "saved" : "more"} vs last week
          </div>
        </div>

        {isLarge && (
        <div className="energy-cost-chart">
          <LineChart
            dataset={DATASET}
            xAxis={xAxis}
            yAxis={yAxis}
            series={series}
            width={chartSize.width}
            height={chartSize.height}
            grid={{ vertical: true, horizontal: true }}
            hideLegend
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
          <div className="energy-cost-legend">
            <span className="energy-cost-legend-item">
              <span className="energy-cost-dot energy-cost-dot--current" />
              This week
            </span>
            <span className="energy-cost-legend-item">
              <span className="energy-cost-dot energy-cost-dot--last" />
              Last week
            </span>
          </div>
        </div>
        )}
      </div>
    </Card>
  );
}
