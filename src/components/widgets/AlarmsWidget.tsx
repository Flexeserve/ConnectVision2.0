import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { BarChart } from "@tremor/react";
import { Widget, Metric, StoreList, Alternator } from "./Widget";
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

  return (
    <Widget title="Active Alarms" icon={<TriangleAlert />}>
      {(expanded) =>
        expanded && perStore.length ? (
          <Alternator
            panes={[
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
              {
                key: "chart",
                label: "Alarms per store",
                node: (
                  <BarChart
                    className="h-full"
                    data={perStore.map((r) => ({ store: r.name, Alarms: r.count }))}
                    index="store"
                    categories={["Alarms"]}
                    colors={["red"]}
                    showLegend={false}
                    yAxisWidth={28}
                  />
                ),
              },
            ]}
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
