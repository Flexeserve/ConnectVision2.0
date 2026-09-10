import { useMemo } from "react";
import { ThermometerSnowflake } from "lucide-react";
import { Widget, RingView, StoreList } from "./Widget";
import { seededInt, storeName } from "../../lib/seededRandom";

// Today's high/low temperature-alarm count for one store.
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

  const highCount = perStore.reduce((s, r) => s + r.high, 0);
  const lowCount = perStore.reduce((s, r) => s + r.low, 0);
  const totalCount = highCount + lowCount;

  return (
    <Widget title="Temperature Alarms" icon={<ThermometerSnowflake />}>
      {(expanded) =>
        expanded ? (
          <StoreList
            rows={perStore.map((r) => ({
              key: r.id,
              name: r.name,
              value:
                r.total === 0
                  ? 0
                  : `${r.high} high · ${r.low} low`,
              tone: r.total > 0 ? "danger" : "success",
            }))}
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
