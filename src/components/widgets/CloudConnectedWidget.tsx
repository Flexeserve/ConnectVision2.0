import { useMemo } from "react";
import { Cloud } from "lucide-react";
import { Widget, RingView } from "./Widget";
import { seededInt } from "../../lib/seededRandom";

type CloudConnectedWidgetProps = {
  storeIds?: string[];
};

// Each store contributes its own device count; connected/offline units are
// summed across the scope's stores.
const buildGauge = (storeIds: string[]) => {
  let totalUnits = 0;
  let offlineCount = 0;
  storeIds.forEach((id) => {
    const storeTotal = seededInt(`${id}:cloud-total`, 8, 22);
    const offlineRate = seededInt(`${id}:cloud-offline-rate`, 0, 12); // percent
    totalUnits += storeTotal;
    offlineCount += Math.round((storeTotal * offlineRate) / 100);
  });
  return { connected: totalUnits - offlineCount, offline: offlineCount };
};

export default function CloudConnectedWidget({
  storeIds = ["root"],
}: CloudConnectedWidgetProps) {
  const { connected, offline } = useMemo(() => buildGauge(storeIds), [storeIds]);

  return (
    <Widget title="Cloud Connected" icon={<Cloud />}>
      {(expanded) => (
        <RingView
          expanded={expanded}
          centerValue={connected}
          centerLabel="Connected"
          segments={[
            { name: "Connected", value: connected, color: "orange" },
            { name: "No connection", value: offline, color: "gray" },
          ]}
        />
      )}
    </Widget>
  );
}
