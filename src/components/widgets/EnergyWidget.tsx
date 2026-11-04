import { useMemo } from "react";
import { Zap } from "lucide-react";
import { LineChart } from "@tremor/react";
import { Widget, Metric } from "./Widget";
import { createSeededRandom, seededFloat } from "../../lib/seededRandom";
import { useLocale, type Locale } from "../../lib/locale";

const HOURS = [0, 4, 8, 12, 16, 20, 24];

const buildStoreTemp = (storeId: string) => {
  const rand = createSeededRandom(`${storeId}:cabinet-temp`);
  const baseline = seededFloat(`${storeId}:cabinet-temp-base`, 2.9, 4.1, 1);
  return HOURS.map(() => baseline + (rand() - 0.5) * 0.8);
};

// Cabinet temperature is a sensor reading — the scope's trend is the
// pointwise average of its stores' own readings.
// Readings are generated in °C and converted to the viewer's unit.
const buildAvgTemp = (storeIds: string[], locale: Locale) => {
  const perStore = storeIds.map(buildStoreTemp);
  return HOURS.map((hour, i) => ({
    hour: locale.formatHour(hour),
    avg: locale.toTemp(
      perStore.reduce((sum, s) => sum + s[i], 0) / perStore.length,
      1,
    ),
  }));
};

type EnergyWidgetProps = {
  storeIds?: string[];
};

export default function EnergyWidget({ storeIds = ["root"] }: EnergyWidgetProps) {
  const locale = useLocale();
  const { tempSymbol } = locale;
  const seriesName = `Avg ${tempSymbol}`;
  const data = useMemo(
    () =>
      buildAvgTemp(storeIds, locale).map(({ hour, avg }) => ({
        hour,
        [seriesName]: avg,
      })),
    [storeIds, locale, seriesName],
  );
  const mean =
    Math.round(
      (data.reduce((sum, d) => sum + Number(d[seriesName]), 0) / data.length) *
        10,
    ) / 10;

  return (
    <Widget title="Energy" icon={<Zap />}>
      {(expanded) =>
        expanded ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="text-center">
              <div className="text-3xl font-bold leading-none tabular-nums text-ink">
                {mean}
                <span className="ml-1 text-base font-semibold text-ink-muted">
                  {tempSymbol}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-ink-muted">
                Avg cabinet temp · last 24h
              </div>
            </div>
            <LineChart
              className="min-h-0 flex-1"
              data={data}
              index="hour"
              categories={[seriesName]}
              colors={["orange"]}
              valueFormatter={(v) => `${v}${tempSymbol}`}
              showLegend={false}
              minValue={locale.toTemp(2.2, 1)}
              maxValue={locale.toTemp(4.8, 1)}
              curveType="monotone"
              yAxisWidth={36}
            />
          </div>
        ) : (
          <Metric value={mean} unit={tempSymbol} caption="Avg cabinet temp" />
        )
      }
    </Widget>
  );
}
