import { useMemo, useState } from "react";
import { Card, LineChart, BadgeDelta } from "@tremor/react";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import "./WidgetBase.css";
import "./EnergyCostWidget.css";
import { seededInt } from "../../lib/seededRandom";
import { useWidgetSize } from "./WidgetSizeContext";

// --- SPIKE: this widget is rebuilt on Tremor (@tremor/react) instead of MUI
// x-charts, to evaluate Tremor as the widget chart/UI layer. Everything else
// on the dashboard is still MUI/HeroUI. If we keep Tremor, the other chart
// widgets follow this pattern; if not, this reverts.

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
    "This week": storeIds.reduce(
      (sum, id) => sum + seededInt(`${id}:energy-current:${day}`, 15, 45),
      0,
    ),
    "Last week": storeIds.reduce(
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
  const chartData = useMemo(() => buildDataset(storeIds), [storeIds]);
  const size = useWidgetSize();
  const isLarge = size === "large";
  const [currency, setCurrency] = useState(CURRENCY_OPTIONS[0]);

  const totalKwh = useMemo(
    () => chartData.reduce((sum, v) => sum + v["This week"], 0),
    [chartData],
  );
  const totalLastKwh = useMemo(
    () => chartData.reduce((sum, v) => sum + v["Last week"], 0),
    [chartData],
  );
  const totalCost = totalKwh * currency.rate;
  const totalLastCost = totalLastKwh * currency.rate;
  const costDeltaPercent =
    totalLastCost === 0 ? 0 : ((totalCost - totalLastCost) / totalLastCost) * 100;
  // Cost down from last week reads as a saving; cost up reads as a loss.
  const isSaving = costDeltaPercent <= 0;

  return (
    <Card className="widget-card widget-energy-cost !p-3 !rounded-none !ring-0 !shadow-none !bg-transparent h-full">
      <div className="widget-title">
        <span>Energy Consumption / Cost</span>
        <AttachMoneyIcon className="widget-title-icon" fontSize="small" />
      </div>

      <div
        className={`energy-cost-body ${
          isLarge ? "energy-cost-body--large" : "energy-cost-body--compact"
        }`}
      >
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
          <BadgeDelta
            className="mt-1 self-center"
            size="xs"
            deltaType={isSaving ? "moderateDecrease" : "moderateIncrease"}
            isIncreasePositive={false}
          >
            {Math.abs(costDeltaPercent).toFixed(1)}% {isSaving ? "saved" : "more"} vs
            last week
          </BadgeDelta>
        </div>

        {isLarge && (
          <div className="energy-cost-chart">
            <LineChart
              className="h-full w-full"
              data={chartData}
              index="day"
              categories={["This week", "Last week"]}
              colors={["orange", "gray"]}
              valueFormatter={(v) => `${v} kWh`}
              showLegend
              showAnimation
              curveType="monotone"
              yAxisWidth={40}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
