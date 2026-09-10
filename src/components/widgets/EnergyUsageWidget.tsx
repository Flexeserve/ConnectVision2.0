import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { Widget, RingView } from "./Widget";
import { seededInt } from "../../lib/seededRandom";

type EnergyUsageWidgetProps = {
  storeIds?: string[];
};

// A percentage can't be summed across stores, so the scope's rate is the
// average of each store's own compliance rate.
const buildComplianceRate = (storeIds: string[]) =>
  Math.round(
    storeIds.reduce((sum, id) => sum + seededInt(`${id}:compliance-rate`, 55, 96), 0) /
      storeIds.length,
  );

export default function EnergyUsageWidget({
  storeIds = ["root"],
}: EnergyUsageWidgetProps) {
  const compliantRate = useMemo(() => buildComplianceRate(storeIds), [storeIds]);

  return (
    <Widget title="Schedule Compliance" icon={<CalendarCheck />}>
      {(expanded) => (
        <RingView
          expanded={expanded}
          centerValue={`${compliantRate}%`}
          centerLabel="Compliant"
          segments={[
            { name: "Compliant", value: compliantRate, color: "emerald" },
            { name: "Not compliant", value: 100 - compliantRate, color: "amber" },
          ]}
        />
      )}
    </Widget>
  );
}
