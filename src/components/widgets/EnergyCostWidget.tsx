import { useMemo, useState } from "react";
import { PoundSterling } from "lucide-react";
import { LineChart, BadgeDelta } from "@tremor/react";
import { WidgetShell } from "./WidgetShell";
import { useWidgetSize } from "./WidgetSizeContext";
import { seededInt } from "../../lib/seededRandom";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CURRENCY_OPTIONS = [
  { code: "GBP", symbol: "£", rate: 0.18 },
  { code: "EUR", symbol: "€", rate: 0.21 },
  { code: "USD", symbol: "$", rate: 0.23 },
];

// Each store contributes its own daily kWh usage; the scope's dataset is the
// sum across its stores.
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
  const size = useWidgetSize();
  const isLarge = size === "large";
  const chartData = useMemo(() => buildDataset(storeIds), [storeIds]);
  const [currency, setCurrency] = useState(CURRENCY_OPTIONS[0]);

  const totalKwh = chartData.reduce((s, v) => s + v["This week"], 0);
  const totalLastKwh = chartData.reduce((s, v) => s + v["Last week"], 0);
  const totalCost = totalKwh * currency.rate;
  const lastCost = totalLastKwh * currency.rate;
  const deltaPct = lastCost === 0 ? 0 : ((totalCost - lastCost) / lastCost) * 100;
  const isSaving = deltaPct <= 0;

  return (
    <WidgetShell title="Energy Consumption / Cost" icon={<PoundSterling />}>
      <div
        className={`flex min-h-0 flex-1 ${
          isLarge ? "flex-col gap-3" : "flex-col items-center justify-center gap-2"
        }`}
      >
        <div
          className={`flex flex-col ${
            isLarge ? "items-start" : "items-center"
          } gap-1`}
        >
          <span className="text-[11px] uppercase tracking-wide text-ink-subtle">
            Cost
          </span>
          <span className="text-4xl font-bold leading-none tabular-nums text-ink">
            {currency.symbol}
            {totalCost.toFixed(1)}
          </span>
          <span className="text-xs text-ink-muted">{totalKwh} kWh</span>
          {isLarge && (
            <select
              value={currency.code}
              onChange={(e) =>
                setCurrency(
                  CURRENCY_OPTIONS.find((o) => o.code === e.target.value) ??
                    CURRENCY_OPTIONS[0],
                )
              }
              aria-label="Currency"
              className="mt-1 rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-ink"
            >
              {CURRENCY_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.code}
                </option>
              ))}
            </select>
          )}
          <BadgeDelta
            className="mt-1"
            size="xs"
            deltaType={isSaving ? "moderateDecrease" : "moderateIncrease"}
            isIncreasePositive={false}
          >
            {Math.abs(deltaPct).toFixed(1)}% {isSaving ? "saved" : "more"} vs last week
          </BadgeDelta>
        </div>

        {isLarge && (
          <LineChart
            className="min-h-0 flex-1"
            data={chartData}
            index="day"
            categories={["This week", "Last week"]}
            colors={["orange", "gray"]}
            valueFormatter={(v) => `${v} kWh`}
            showLegend
            curveType="monotone"
            yAxisWidth={40}
          />
        )}
      </div>
    </WidgetShell>
  );
}
