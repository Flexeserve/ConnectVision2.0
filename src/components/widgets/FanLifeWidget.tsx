import { useMemo } from "react";
import Card from "@mui/material/Card";
import "./WidgetBase.css";
import "./FanLifeWidget.css";
import { seededInt } from "../../lib/seededRandom";

type FanLifeWidgetProps = {
  storeIds?: string[];
};

// Per-store cumulative fan-operating hours: each store's fan contributes its
// own hours, so a region/root scope sums to the total across its stores
// while a single-store scope shows that store's own reading.
export default function FanLifeWidget({ storeIds = ["root"] }: FanLifeWidgetProps) {
  const hours = useMemo(
    () =>
      storeIds.reduce((sum, id) => sum + seededInt(`${id}:fan-life`, 40, 170), 0),
    [storeIds],
  );

  return (
    <Card className="widget-card widget-fan">
      <div className="widget-title">Fan Life</div>
      <div className="widget-value">
        {hours} <span>hrs</span>
      </div>
    </Card>
  );
}
