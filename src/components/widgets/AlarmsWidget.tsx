import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./WidgetBase.css";
import "./AlarmsWidget.css";

type AlarmsWidgetProps = {
  value?: number;
};

export default function AlarmsWidget({ value = 12 }: AlarmsWidgetProps) {
  return (
    <div className="widget-card widget-alarms">
      <div className="widget-title">
        <WarningAmberIcon fontSize="small" />
        Active Alarms
      </div>
      <div className="widget-value">{value}</div>
    </div>
  );
}
