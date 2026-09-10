import { useMemo, useState } from "react";
import { Thermometer } from "lucide-react";
import { AreaChart } from "@tremor/react";
import { Widget, Metric } from "./Widget";
import { createSeededRandom } from "../../lib/seededRandom";

const TIME_SLOTS = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "00:00", "03:00"];

const buildLabels = (days: number) =>
  Array.from({ length: days }).flatMap((_, d) =>
    TIME_SLOTS.map((slot) => `D${d + 1} ${slot}`),
  );

// A door-open event drops cabinet temperature sharply, then it recovers.
const generateStoreSeries = (days: number, storeId: string) => {
  const rand = createSeededRandom(`${storeId}:temperature`);
  const perDay = TIME_SLOTS.length;
  const values: number[] = [];
  const base = 80;
  for (let day = 0; day < days; day += 1) {
    const dayStart = values.length;
    const doorIndex = dayStart + 2 + Math.floor(rand() * 3);
    const dropDepth = 10 + Math.floor(rand() * 6);
    const recoverySteps = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < perDay; i += 1) {
      const idx = dayStart + i;
      const noise = Math.floor(rand() * 3) - 1;
      let value = base + noise;
      if (idx === doorIndex) value = base - dropDepth;
      else if (idx > doorIndex && idx <= doorIndex + recoverySteps) {
        const step = idx - doorIndex;
        value = base - dropDepth + (dropDepth * step) / recoverySteps + noise;
      }
      values.push(Math.round(Math.max(60, Math.min(92, value))));
    }
  }
  return values;
};

// Temperature is a sensor reading — the scope's series is the pointwise
// average of its stores' own series.
const buildAggregate = (days: number, storeIds: string[]) => {
  const per = storeIds.map((id) => generateStoreSeries(days, id));
  const len = per[0]?.length ?? 0;
  const labels = buildLabels(days);
  return Array.from({ length: len }, (_, i) => ({
    t: labels[i],
    "°C": Math.round(per.reduce((sum, s) => sum + s[i], 0) / per.length),
  }));
};

type DoorOpenedAlarmsWidgetProps = {
  storeIds?: string[];
};

export default function DoorOpenedAlarmsWidget({
  storeIds = ["root"],
}: DoorOpenedAlarmsWidgetProps) {
  const [days, setDays] = useState(7);
  const data = useMemo(() => buildAggregate(days, storeIds), [days, storeIds]);
  const latest = data[data.length - 1]?.["°C"] ?? 0;

  return (
    <Widget title="Temperature" icon={<Thermometer />}>
      {(expanded) =>
        expanded ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold tabular-nums text-ink">
                {latest}
                <span className="ml-1 text-sm font-semibold text-ink-muted">
                  °C
                </span>
              </div>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                aria-label="Time range"
                className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-ink"
              >
                <option value={3}>Last 3 days</option>
                <option value={7}>Last week</option>
              </select>
            </div>
            <AreaChart
              className="min-h-0 flex-1"
              data={data}
              index="t"
              categories={["°C"]}
              colors={["orange"]}
              valueFormatter={(v) => `${v}°C`}
              showLegend={false}
              showXAxis={false}
              curveType="monotone"
              yAxisWidth={36}
            />
          </div>
        ) : (
          <Metric value={latest} unit="°C" caption="Latest reading" />
        )
      }
    </Widget>
  );
}
