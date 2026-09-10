import { useEffect, useMemo, useState } from "react";
import { ThermometerSnowflake } from "lucide-react";
import { BarChart } from "@tremor/react";
import { Widget, RingView } from "./Widget";
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

  const ring = (
    <RingView
      centerValue={totalCount}
      segments={
        totalCount === 0
          ? [{ name: "None", value: 1, color: "gray" }]
          : [
              { name: "High", value: highCount, color: "red" },
              { name: "Low", value: lowCount, color: "blue" },
            ]
      }
    />
  );

  return (
    <Widget title="Temperature Alarms" icon={<ThermometerSnowflake />}>
      {(expanded) =>
        expanded ? <Alternator ring={ring} barData={barData} /> : ring
      }
    </Widget>
  );
}

// Expanded view crossfades between the ring and a 7-day stacked bar chart.
function Alternator({
  ring,
  barData,
}: {
  ring: React.ReactNode;
  barData: { day: string; High: number; Low: number }[];
}) {
  const [showBars, setShowBars] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setShowBars((p) => !p), ALTERNATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
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
  );
}
