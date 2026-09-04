import { useMemo } from "react";
import Card from "@mui/material/Card";
import "./WidgetBase.css";
import "./OfflineDevicesWidget.css";
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
    <Card className="widget-card widget-offline-devices">
      <div className="widget-title">Offline Devices</div>
      <div className="offline-devices-body">
        <div className="offline-devices-total">
          <span className="offline-devices-total-value">{total}</span>
          <span className="offline-devices-total-label">Total offline</span>
        </div>
        <div className="offline-devices-breakdown">
          <div className="offline-devices-stat">
            <span className="offline-devices-stat-value">{gatewayErrors}</span>
            <span className="offline-devices-stat-label">Gateway</span>
          </div>
          <div className="offline-devices-stat">
            <span className="offline-devices-stat-value">{commanderOffline}</span>
            <span className="offline-devices-stat-label">Commander</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
