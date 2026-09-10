import { useMemo } from "react";
import { Zap } from "lucide-react";
import { LineChart } from "@tremor/react";
import { WidgetShell, WidgetMetric } from "./WidgetShell";
import { useWidgetSize } from "./WidgetSizeContext";
import { createSeededRandom, seededFloat } from "../../lib/seededRandom";

const HOURS = ["00", "04", "08", "12", "16", "20", "24"];

const buildStoreTemp = (storeId: string) => {
  const rand = createSeededRandom(`${storeId}:cabinet-temp`);
  const baseline = seededFloat(`${storeId}:cabinet-temp-base`, 2.9, 4.1, 1);
  return HOURS.map(() => baseline + (rand() - 0.5) * 0.8);
};

// Cabinet temperature is a sensor reading, not a countable quantity, so the
// scope's trend is the pointwise average of its stores' own readings.
const buildAvgTemp = (storeIds: string[]) => {
  const perStore = storeIds.map(buildStoreTemp);
  return HOURS.map((hour, i) => ({
    hour,
    "Avg °C":
      Math.round(
        (perStore.reduce((sum, s) => sum + s[i], 0) / perStore.length) * 10,
      ) / 10,
  }));
};

type EnergyWidgetProps = {
  storeIds?: string[];
};

export default function EnergyWidget({ storeIds = ["root"] }: EnergyWidgetProps) {
  const size = useWidgetSize();
  const data = useMemo(() => buildAvgTemp(storeIds), [storeIds]);
  const mean =
    Math.round(
      (data.reduce((sum, d) => sum + d["Avg °C"], 0) / data.length) * 10,
    ) / 10;

  return (
    <WidgetShell title="Energy" icon={<Zap />}>
      {size === "large" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="text-center">
            <div className="text-3xl font-bold leading-none tabular-nums text-ink">
              {mean}
              <span className="ml-1 text-base font-semibold text-ink-muted">°C</span>
            </div>
            <div className="mt-0.5 text-xs text-ink-muted">
              Avg cabinet temp · last 24h
            </div>
          </div>
          <LineChart
            className="min-h-0 flex-1"
            data={data}
            index="hour"
            categories={["Avg °C"]}
            colors={["orange"]}
            valueFormatter={(v) => `${v}°C`}
            showLegend={false}
            minValue={2.2}
            maxValue={4.8}
            curveType="monotone"
            yAxisWidth={36}
          />
        </div>
      ) : (
        <>
          <WidgetMetric value={mean} unit="°C" />
          <div className="text-center text-xs text-ink-muted">Avg cabinet temp</div>
        </>
      )}
    </WidgetShell>
  );
}
