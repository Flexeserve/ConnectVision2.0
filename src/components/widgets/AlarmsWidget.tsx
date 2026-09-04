import Card from "@mui/material/Card";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./WidgetBase.css";
import "./AlarmsWidget.css";

type AlarmsWidgetProps = {
  value?: number;
};

export default function AlarmsWidget({ value = 12 }: AlarmsWidgetProps) {
  return (
    <Card className="widget-card widget-alarms">
      <div className="widget-title">
        <span>Active Alarms</span>
        <WarningAmberIcon className="widget-title-icon" fontSize="small" />
      </div>
      <div className="widget-value">{value}</div>
    </Card>
  );
}
