import { useMemo } from "react";
import Card from "@mui/material/Card";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import "./WidgetBase.css";
import "./ElementLifeWidget.css";
import { seededInt } from "../../lib/seededRandom";

type ElementLifeWidgetProps = {
  storeIds?: string[];
};

// Per-store cumulative element-operating hours, summed the same way as
// FanLifeWidget: rolls up across the current scope, native at a single store.
export default function ElementLifeWidget({ storeIds = ["root"] }: ElementLifeWidgetProps) {
  const hours = useMemo(
    () =>
      storeIds.reduce((sum, id) => sum + seededInt(`${id}:element-life`, 5, 22), 0),
    [storeIds],
  );

  return (
    <Card className="widget-card widget-element">
      <div className="widget-title">
        <span>Element Life</span>
        <DeviceThermostatIcon className="widget-title-icon" fontSize="small" />
      </div>
      <div className="widget-value">
        {hours} <span>hrs</span>
      </div>
    </Card>
  );
}
