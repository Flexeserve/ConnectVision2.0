import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { Widget, Metric, RingView, StoreList, Alternator } from "./Widget";
import { seededInt } from "../../lib/seededRandom";

type AlarmsWidgetProps = {
  storeIds?: string[];
  /** Real store names, parallel to storeIds. */
  names?: string[];
  /** Fallback headline when no storeIds are supplied. */
  value?: number;
};

const alarmsFor = (id: string) => seededInt(`${id}:active-alarms`, 0, 6);

export default function AlarmsWidget({
  storeIds,
  names = [],
  value = 12,
}: AlarmsWidgetProps) {
  const perStore = useMemo(
    () =>
      (storeIds ?? [])
        .map((id, i) => ({ id, name: names[i] ?? id, count: alarmsFor(id) }))
        .sort((a, b) => b.count - a.count),
    [storeIds, names],
  );
  const total = storeIds ? perStore.reduce((s, r) => s + r.count, 0) : value;
  const withAlarms = perStore.filter((r) => r.count > 0).length;
  const clear = perStore.length - withAlarms;

  const ring = (
    <RingView
      centerValue={total}
      centerLabel="Alarms"
      segments={
        total === 0
          ? [{ name: "All clear", value: 1, color: "emerald" }]
          : [
              { name: "Stores with alarms", value: withAlarms, color: "red" },
              { name: "Clear", value: clear, color: "emerald" },
            ]
      }
    />
  );

  return (
    <Widget title="Active Alarms" icon={<TriangleAlert />}>
      {(expanded) =>
        expanded && perStore.length ? (
          <Alternator
            panes={[
              { key: "ring", label: "Alarm spread", node: ring },
              {
                key: "by-store",
                label: "By store",
                node: (
                  <StoreList
                    rows={perStore.map((r) => ({
                      key: r.id,
                      name: r.name,
                      value: r.count,
                      tone: r.count > 0 ? "danger" : "success",
                    }))}
                  />
                ),
              },
            ]}
          />
        ) : perStore.length ? (
          ring
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
