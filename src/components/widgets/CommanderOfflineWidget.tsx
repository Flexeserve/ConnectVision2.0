import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./WidgetBase.css";
import "./CommanderOfflineWidget.css";

export default function CommanderOfflineWidget() {
  return (
    <div className="widget-card widget-alarm-commander">
      <div className="widget-title">
        <WarningAmberIcon fontSize="small" />
        Commander Box Offline
      </div>
      <div className="widget-value alarm-value-commander">7</div>
      
    </div>
  );
}
