import { useMemo } from "react";
import { Store } from "lucide-react";
import { Widget, RingView } from "./Widget";
import { seededInt } from "../../lib/seededRandom";

type StoresOnlineWidgetProps = {
  storeIds?: string[];
};

// Almost every store reads online; each store independently has a small
// seeded chance of reading offline.
const buildStoresOnline = (storeIds: string[]) => {
  const total = storeIds.length || 1;
  const offline = storeIds.reduce(
    (sum, id) => sum + (seededInt(`${id}:store-online-roll`, 0, 99) < 6 ? 1 : 0),
    0,
  );
  return { total, online: total - offline, offline };
};

export default function StoresOnlineWidget({
  storeIds = ["root"],
}: StoresOnlineWidgetProps) {
  const { online, offline } = useMemo(
    () => buildStoresOnline(storeIds),
    [storeIds],
  );

  return (
    <Widget title="Stores Online" icon={<Store />}>
      {(expanded) => (
        <RingView
          expanded={expanded}
          centerValue={online}
          centerLabel="Online"
          segments={[
            { name: "Online", value: online, color: "emerald" },
            { name: "Offline", value: offline, color: "gray" },
          ]}
        />
      )}
    </Widget>
  );
}
