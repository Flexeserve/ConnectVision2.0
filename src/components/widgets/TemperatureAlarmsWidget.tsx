import { useMemo } from "react";
import { ThermometerSnowflake } from "lucide-react";
import { BarChart } from "@tremor/react";
import { Widget, RingView, StoreList, Alternator } from "./Widget";
import { seededInt, storeName } from "../../lib/seededRandom";

const DAYS = 7;
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const buildDayLabels = () => {
  const today = new Date();
  return Array.from({ length: DAYS }, (_, i) => {
    const off = DAYS - 1 - i;
    if (off === 0) return "Today";
    const d = new Date(today);
    d.setDate(d.getDate() - off);
    return WEEKDAY_NAMES[d.getDay()];
  });
};
const DAY_LABELS = buildDayLabels();

const dailyCounts = (storeIds: string[], seedKey: string) =>
  Array.from({ length: DAYS }, (_, day) =>
    storeIds.reduce((sum, id) => {
      const raised = seededInt(`${id}:${seedKey}:day${day}:roll`, 0, 99) < 12;
      return sum + (raised ? seededInt(`${id}:${seedKey}:day${day}:count`, 1, 3) : 0);
    }, 0),
  );

const alarmsToday = (id: string, seedKey: string) => {
  const raised = seededInt(`${id}:${seedKey}:day6:roll`, 0, 99) < 12;
  return raised ? seededInt(`${id}:${seedKey}:day6:count`, 1, 3) : 0;
};

type TemperatureAlarmsWidgetProps = {
  storeIds?: string[];
  locations?: string[];
};

export default function TemperatureAlarmsWidget({
  storeIds = ["root"],
  locations = [],
}: TemperatureAlarmsWidgetProps) {
  const perStore = useMemo(
    () =>
      storeIds
        .map((id) => {
          const high = alarmsToday(id, "temp-alarm-high");
          const low = alarmsToday(id, "temp-alarm-low");
          return { id, name: storeName(id, locations), high, low, total: high + low };
        })
        .sort((a, b) => b.total - a.total),
    [storeIds, locations],
  );
  const highDaily = useMemo(() => dailyCounts(storeIds, "temp-alarm-high"), [storeIds]);
  const lowDaily = useMemo(() => dailyCounts(storeIds, "temp-alarm-low"), [storeIds]);
  const barData = DAY_LABELS.map((day, i) => ({
    day,
    High: highDaily[i],
    Low: lowDaily[i],
  }));

  const highCount = perStore.reduce((s, r) => s + r.high, 0);
  const lowCount = perStore.reduce((s, r) => s + r.low, 0);
  const totalCount = highCount + lowCount;

  return (
    <Widget title="Temperature Alarms" icon={<ThermometerSnowflake />}>
      {(expanded) =>
        expanded ? (
          <Alternator
            panes={[
              {
                key: "7d",
                label: "Last 7 days",
                node: (
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
                ),
              },
              {
                key: "by-store",
                label: "By store",
                node: (
                  <StoreList
                    rows={perStore.map((r) => ({
                      key: r.id,
                      name: r.name,
                      value: r.total === 0 ? 0 : `${r.high} high · ${r.low} low`,
                      tone: r.total > 0 ? "danger" : "success",
                    }))}
                  />
                ),
              },
            ]}
          />
        ) : (
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
        )
      }
    </Widget>
  );
}
