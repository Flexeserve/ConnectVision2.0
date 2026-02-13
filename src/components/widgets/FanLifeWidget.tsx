import AirIcon from "@mui/icons-material/Air";
import "./WidgetBase.css";
import "./FanLifeWidget.css";

export default function FanLifeWidget() {
  return (
    <div className="widget-card widget-fan">
      <div className="widget-title">
        <AirIcon fontSize="small" />
        Fan Life
      </div>
      <div className="widget-value">
        460 <span>hrs</span>
      </div>
      
    </div>
  );
}
