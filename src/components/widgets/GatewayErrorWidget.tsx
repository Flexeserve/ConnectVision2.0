import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./WidgetBase.css";
import "./GatewayErrorWidget.css";

export default function GatewayErrorWidget() {
  return (
    <div className="widget-card widget-alarm-gateway">
      <div className="widget-title">
        <WarningAmberIcon fontSize="small" />
        Gateway Error
      </div>
      <div className="widget-value alarm-value-gateway">4</div>
      
    </div>
  );
}
