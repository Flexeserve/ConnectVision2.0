import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./WidgetBase.css";
import "./CommanderOfflineWidget.css";

type CommanderOfflineWidgetProps = {
  value?: number;
};

export default function CommanderOfflineWidget({
  value = 7,
}: CommanderOfflineWidgetProps) {
  return (
    <div className="widget-card widget-alarm-commander">
      <div className="widget-title">
        <WarningAmberIcon fontSize="small" />
        Commander Box Offline
      </div>
      <div className="widget-value alarm-value-commander">{value}</div>
      
    </div>
  );
}
