import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import "./WidgetBase.css";
import "./ElementLifeWidget.css";

export default function ElementLifeWidget() {
  return (
    <div className="widget-card widget-element">
      <div className="widget-title">
        <DeviceThermostatIcon fontSize="small" />
        Element Life
      </div>
      <div className="widget-value">
        45 <span>hrs</span>
      </div>
      
      
    </div>
  );
}
