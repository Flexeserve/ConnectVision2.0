import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { Widget, Metric, StoreList } from "./Widget";
import { seededInt, storeName } from "../../lib/seededRandom";

type AlarmsWidgetProps = {
  storeIds?: string[];
  locations?: string[];
  /** Fallback headline when no storeIds are supplied. */
  value?: number;
};

const alarmsFor = (id: string) => seededInt(`${id}:active-alarms`, 0, 6);

export default function AlarmsWidget({
  storeIds,
  locations = [],
  value = 12,
}: AlarmsWidgetProps) {
  const perStore = useMemo(
    () =>
      (storeIds ?? [])
        .map((id) => ({ id, name: storeName(id, locations), count: alarmsFor(id) }))
        .sort((a, b) => b.count - a.count),
    [storeIds, locations],
  );
  const total = storeIds ? perStore.reduce((s, r) => s + r.count, 0) : value;

  return (
    <Widget title="Active Alarms" icon={<TriangleAlert />}>
      {(expanded) =>
        expanded && perStore.length ? (
          <StoreList
            rows={perStore.map((r) => ({
              key: r.id,
              name: r.name,
              value: r.count,
              tone: r.count > 0 ? "danger" : "success",
            }))}
          />
        ) : (
          <Metric
            value={total}
            tone={total > 0 ? "danger" : "success"}
            expanded={expanded}
          />
        )
      }
    </Widget>
  );
}
