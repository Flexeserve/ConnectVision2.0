import Card from "@mui/material/Card";
import "./WidgetBase.css";
import "./AlarmsWidget.css";

type AlarmsWidgetProps = {
  value?: number;
};

export default function AlarmsWidget({ value = 12 }: AlarmsWidgetProps) {
  return (
    <Card className="widget-card widget-alarms">
      <div className="widget-title">Active Alarms</div>
      <div className="widget-value">{value}</div>
    </Card>
  );
}
