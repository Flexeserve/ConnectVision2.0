import BoltIcon from "@mui/icons-material/Bolt";
import {
  GaugeContainer,
  GaugeValueArc,
  GaugeReferenceArc,
  useGaugeState,
} from "@mui/x-charts/Gauge";
import "./WidgetBase.css";
import "./EnergyUsageWidget.css";

function GaugePointer() {
  const { valueAngle, outerRadius, cx, cy } = useGaugeState();

  if (valueAngle === null) {
    return null;
  }

  const target = {
    x: cx + outerRadius * Math.sin(valueAngle),
    y: cy - outerRadius * Math.cos(valueAngle),
  };

  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#333333" />
      <path
        d={`M ${cx} ${cy} L ${target.x} ${target.y}`}
        stroke="#333333"
        strokeWidth={3}
      />
    </g>
  );
}

export default function EnergyUsageWidget() {
  return (
    <div className="widget-card widget-energy">
      <div className="widget-title">
        <BoltIcon fontSize="small" />
        Energy Usage
      </div>

      <div className="energy-gauge">
        <GaugeContainer
          width={200}
          height={130}
          startAngle={-90}
          endAngle={90}
          value={80}
        >
          <defs>
            <linearGradient id="energyArcGradient" cx="50%" cy="100%" r="120%">
              <stop offset="0%" stopColor="#17ff4f" />
              <stop offset="60%" stopColor="#9a9a9a" />
              <stop offset="100%" stopColor="#ff2d2d" />
            </linearGradient>
          </defs>
          <GaugeReferenceArc style={{ fill: "url(#energyArcGradient)" }} />
          <GaugeValueArc style={{ fill: "rgba(255, 255, 255, 0.75)" }} />
          <GaugePointer />
        </GaugeContainer>
      </div>

      <div className="energy-label">Avg. usage: Optimal</div>
      <div className="energy-legend">
        <span className="energy-dot low" />
        Low
        <span className="energy-dot optimal" />
        Optimal
        <span className="energy-dot high" />
        High
      </div>
    </div>
  );
}
