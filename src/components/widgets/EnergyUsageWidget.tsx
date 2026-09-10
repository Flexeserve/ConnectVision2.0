import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { BarChart } from "@tremor/react";
import { Widget, RingView, StoreList, Alternator } from "./Widget";
import { seededInt } from "../../lib/seededRandom";

type EnergyUsageWidgetProps = {
  storeIds?: string[];
  /** Real store names, parallel to storeIds. */
  names?: string[];
};

const rateFor = (id: string) => seededInt(`${id}:compliance-rate`, 55, 96);

export default function EnergyUsageWidget({
  storeIds = ["root"],
  names = [],
}: EnergyUsageWidgetProps) {
  const perStore = useMemo(
    () =>
      storeIds
        .map((id, i) => ({ id, name: names[i] ?? id, rate: rateFor(id) }))
        .sort((a, b) => a.rate - b.rate),
    [storeIds, names],
  );
  const compliantRate = perStore.length
    ? Math.round(perStore.reduce((s, r) => s + r.rate, 0) / perStore.length)
    : 100;

  return (
    <Widget title="Schedule Compliance" icon={<CalendarCheck />}>
      {(expanded) =>
        expanded ? (
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
                      value: `${r.rate}%`,
                      tone:
                        r.rate >= 90 ? "success" : r.rate >= 75 ? "default" : "warning",
                    }))}
                  />
                ),
              },
              {
                key: "chart",
                label: "Compliance %",
                node: (
                  <BarChart
                    className="h-full"
                    data={perStore.map((r) => ({ store: r.name, "%": r.rate }))}
                    index="store"
                    categories={["%"]}
                    colors={["emerald"]}
                    showLegend={false}
                    minValue={0}
                    maxValue={100}
                    yAxisWidth={32}
                  />
                ),
              },
            ]}
          />
        ) : (
          <RingView
            centerValue={`${compliantRate}%`}
            centerLabel="Compliant"
            segments={[
              { name: "Compliant", value: compliantRate, color: "emerald" },
              { name: "Not compliant", value: 100 - compliantRate, color: "amber" },
            ]}
          />
        )
      }
    </Widget>
  );
}
