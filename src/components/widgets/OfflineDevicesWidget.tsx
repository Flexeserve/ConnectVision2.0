import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { Widget } from "./Widget";
import { seededInt } from "../../lib/seededRandom";

type OfflineDevicesWidgetProps = {
  storeIds?: string[];
  commanderOffline?: number;
};

// Each store contributes its own gateway error count; a region/root scope
// sums across its stores, a single-store scope shows that store's count.
export default function OfflineDevicesWidget({
  storeIds = ["root"],
  commanderOffline = 0,
}: OfflineDevicesWidgetProps) {
  const gatewayErrors = useMemo(
    () =>
      storeIds.reduce((sum, id) => sum + seededInt(`${id}:gateway-error`, 0, 2), 0),
    [storeIds],
  );
  const total = gatewayErrors + commanderOffline;

  return (
    <Widget title="Offline Devices" icon={<TriangleAlert />}>
      {() => (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="text-center">
            <div
              className={`text-4xl font-bold leading-none tabular-nums ${
                total > 0 ? "text-danger" : "text-ink"
              }`}
            >
              {total}
            </div>
            <div className="mt-1 text-xs text-ink-muted">Total offline</div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold tabular-nums text-ink">
                {gatewayErrors}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-ink-subtle">
                Gateway
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold tabular-nums text-ink">
                {commanderOffline}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-ink-subtle">
                Commander
              </div>
            </div>
          </div>
        </div>
      )}
    </Widget>
  );
}
