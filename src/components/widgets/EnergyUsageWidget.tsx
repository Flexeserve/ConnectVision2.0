import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { Widget, RingView, StoreList } from "./Widget";
import { seededInt, storeName } from "../../lib/seededRandom";

type EnergyUsageWidgetProps = {
  storeIds?: string[];
  locations?: string[];
};

const rateFor = (id: string) => seededInt(`${id}:compliance-rate`, 55, 96);

export default function EnergyUsageWidget({
  storeIds = ["root"],
  locations = [],
}: EnergyUsageWidgetProps) {
  const perStore = useMemo(
    () =>
      storeIds
        .map((id) => ({ id, name: storeName(id, locations), rate: rateFor(id) }))
        .sort((a, b) => a.rate - b.rate),
    [storeIds, locations],
  );
  const compliantRate = perStore.length
    ? Math.round(perStore.reduce((s, r) => s + r.rate, 0) / perStore.length)
    : 100;

  return (
    <Widget title="Schedule Compliance" icon={<CalendarCheck />}>
      {(expanded) =>
        expanded ? (
          <StoreList
            rows={perStore.map((r) => ({
              key: r.id,
              name: r.name,
              value: `${r.rate}%`,
              tone: r.rate >= 90 ? "success" : r.rate >= 75 ? "default" : "warning",
            }))}
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
