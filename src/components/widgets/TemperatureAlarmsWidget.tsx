import { useEffect, useMemo, useState } from "react";
import { ThermometerSnowflake } from "lucide-react";
import { BarChart, DonutChart } from "@tremor/react";
import { WidgetShell } from "./WidgetShell";
import { useWidgetSize } from "./WidgetSizeContext";
import { seededInt } from "../../lib/seededRandom";

const DAYS = 7;
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildDayLabels = (): string[] => {
  const today = new Date();
  return Array.from({ length: DAYS }, (_, i) => {
    const offset = DAYS - 1 - i;
    if (offset === 0) return "Today";
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return WEEKDAY_NAMES[d.getDay()];
  });
};
const DAY_LABELS = buildDayLabels();

// Most days a store raises no temperature alarms; each store independently
// has a small seeded chance of raising 1-3 on a given day.
const buildDailyCounts = (storeIds: string[], seedKey: string) =>
  Array.from({ length: DAYS }, (_, day) =>
    storeIds.reduce((sum, id) => {
      const raised = seededInt(`${id}:${seedKey}:day${day}:roll`, 0, 99) < 12;
      return sum + (raised ? seededInt(`${id}:${seedKey}:day${day}:count`, 1, 3) : 0);
    }, 0),
  );

const ALTERNATE_INTERVAL_MS = 6000;

type TemperatureAlarmsWidgetProps = {
  storeIds?: string[];
};

export default function TemperatureAlarmsWidget({
  storeIds = ["root"],
}: TemperatureAlarmsWidgetProps) {
  const size = useWidgetSize();
  const isLarge = size === "large";

  const highDaily = useMemo(
    () => buildDailyCounts(storeIds, "temp-alarm-high"),
    [storeIds],
  );
  const lowDaily = useMemo(
    () => buildDailyCounts(storeIds, "temp-alarm-low"),
    [storeIds],
  );
  const highCount = highDaily[highDaily.length - 1] ?? 0;
  const lowCount = lowDaily[lowDaily.length - 1] ?? 0;
  const totalCount = highCount + lowCount;

  const barData = useMemo(
    () =>
      DAY_LABELS.map((day, i) => ({
        day,
        High: highDaily[i],
        Low: lowDaily[i],
      })),
    [highDaily, lowDaily],
  );

  const [showBars, setShowBars] = useState(false);
  useEffect(() => {
    if (!isLarge) return;
    const id = setInterval(() => setShowBars((p) => !p), ALTERNATE_INTERVAL_MS);
    return () => {
      clearInterval(id);
      setShowBars(false); // back to the ring when leaving LARGE
    };
  }, [isLarge]);

  const ring = (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <div className="relative">
        <DonutChart
          data={
            totalCount === 0
              ? [{ name: "None", value: 1 }]
              : [
                  { name: "High", value: highCount },
                  { name: "Low", value: lowCount },
                ]
          }
          category="value"
          index="name"
          colors={totalCount === 0 ? ["gray"] : ["red", "blue"]}
          showLabel={false}
          showTooltip={false}
          className={isLarge ? "h-40 w-40" : "h-28 w-28"}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className={`text-3xl font-bold tabular-nums ${
              totalCount === 0 ? "text-success" : "text-ink"
            }`}
          >
            {totalCount}
          </span>
        </div>
      </div>
      <div className="flex gap-4">
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="size-2 rounded-full bg-red-500" />
          High
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="size-2 rounded-full bg-blue-500" />
          Low
        </span>
      </div>
    </div>
  );

  return (
    <WidgetShell title="Temperature Alarms" icon={<ThermometerSnowflake />}>
      {!isLarge ? (
        ring
      ) : (
        <div className="relative min-h-0 flex-1">
          <div
            className={`absolute inset-0 flex transition-opacity duration-500 ${
              showBars ? "opacity-0" : "opacity-100"
            }`}
          >
            {ring}
          </div>
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              showBars ? "opacity-100" : "opacity-0"
            }`}
          >
            <BarChart
              className="h-full"
              data={barData}
              index="day"
              categories={["High", "Low"]}
              colors={["red", "blue"]}
              stack
              showLegend
              yAxisWidth={28}
            />
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
