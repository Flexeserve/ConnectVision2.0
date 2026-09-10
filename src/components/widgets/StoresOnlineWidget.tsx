import { useMemo } from "react";
import { Store } from "lucide-react";
import { Widget, RingView, StoreList, Alternator } from "./Widget";
import { seededInt } from "../../lib/seededRandom";

type StoresOnlineWidgetProps = {
  storeIds?: string[];
  /** Real store names, parallel to storeIds. */
  names?: string[];
};

// Almost every store reads online; each store independently has a small
// seeded chance of reading offline.
const isOnline = (id: string) => seededInt(`${id}:store-online-roll`, 0, 99) >= 6;

export default function StoresOnlineWidget({
  storeIds = ["root"],
  names = [],
}: StoresOnlineWidgetProps) {
  const perStore = useMemo(
    () =>
      storeIds
        .map((id, i) => ({ id, name: names[i] ?? id, online: isOnline(id) }))
        // offline first so problems surface at the top
        .sort((a, b) => Number(a.online) - Number(b.online)),
    [storeIds, names],
  );
  const online = perStore.filter((s) => s.online).length;
  const offline = perStore.length - online;

  const ring = (
    <RingView
      centerValue={online}
      centerLabel="Online"
      segments={[
        { name: "Online", value: online, color: "emerald" },
        { name: "Offline", value: offline, color: "gray" },
      ]}
    />
  );

  return (
    <Widget title="Stores Online" icon={<Store />}>
      {(expanded) =>
        expanded ? (
          <Alternator
            panes={[
              {
                key: "by-store",
                label: "By store",
                node: (
                  <StoreList
                    rows={perStore.map((s) => ({
                      key: s.id,
                      name: s.name,
                      value: s.online ? "Online" : "Offline",
                      tone: s.online ? "success" : "danger",
                    }))}
                  />
                ),
              },
              { key: "ring", label: "Online vs offline", node: ring },
            ]}
          />
        ) : (
          ring
        )
      }
    </Widget>
  );
}
