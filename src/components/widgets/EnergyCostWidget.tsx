import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import "./WidgetBase.css";
import "./EnergyCostWidget.css";
import { seededInt } from "../../lib/seededRandom";

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

// Below this, the line chart can't render legibly alongside the value
// column — fall back to just the headline cost instead.
const MIN_CHART_HEIGHT = 165;
const MIN_CHART_WIDTH = 260;

export default function EnergyCostWidget({
  storeIds = ["root"],
}: EnergyCostWidgetProps) {
  const DATASET = useMemo(() => buildDataset(storeIds), [storeIds]);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 320, height: 160 });
  const [currency, setCurrency] = useState(CURRENCY_OPTIONS[0]);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (!widgetRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsCompact(height < MIN_CHART_HEIGHT || width < MIN_CHART_WIDTH);
        const nextWidth = Math.max(240, width * 0.55);
        // Extra buffer beyond title/padding accounts for the two-series
        // legend MUI renders above the plot, which isn't part of `height`.
        const nextHeight = Math.max(140, height - 110);
        setChartSize({ width: nextWidth, height: nextHeight });
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);

  const totalKwh = useMemo(
    () => DATASET.reduce((sum, v) => sum + v.current, 0),
    [DATASET],
  );
  const totalCost = useMemo(
    () => totalKwh * currency.rate,
    [totalKwh, currency],
  );

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
    <div ref={widgetRef} className="widget-card widget-energy-cost">
      <div className="widget-title">
        <span>Energy Consumption / Cost</span>
      </div>

      <div className={`energy-cost-body ${isCompact ? "energy-cost-body--compact" : ""}`}>
        <div className="energy-cost-left">
          <div className="energy-cost-label">Cost</div>
          <div className="energy-cost-value">
            {currency.symbol}
            {totalCost.toFixed(1)}
          </div>
          <div className="energy-cost-sub">{totalKwh} kWh</div>
          {!isCompact && (
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
        </div>

        {!isCompact && (
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
        )}
      </div>
    </div>
  );
}
