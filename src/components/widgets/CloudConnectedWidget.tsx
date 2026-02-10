import { PieChart } from "@mui/x-charts/PieChart";
import "./WidgetBase.css";
import "./CloudConnectedWidget.css";
import cloudConnectLogo from "../../assets/CloudConnect.svg";

const CONNECTED_COUNT = 937;
const TOTAL_UNITS = 1000;

const gaugeSlices = [
  { id: 0, value: CONNECTED_COUNT, color: "#205ffd", label: "Connected" },
  {
    id: 1,
    value: TOTAL_UNITS - CONNECTED_COUNT,
    color: "#f14734",
    label: "No connection",
  },
];

const pieSettings = {
  width: 240,
  height: 140,
  slotProps: { legend: { hidden: true } },
};

export default function CloudConnectedWidget() {
  return (
    <div className="widget-card widget-cloud">
      <div className="cloud-widget">
        <div className="cloud-widget-left">
          <div className="cloud-labels">
            <span>CLOUD</span>
            <span>CONNECTED</span>
            <img
              src={cloudConnectLogo}
              alt="Cloud Connect"
              className="cloud-connect-logo"
            />
          </div>
          
        </div>

        <div className="cloud-widget-right">
          <div className="cloud-gauge">
            <div className="cloud-pie-wrapper">
              <PieChart
                series={[
                  {
                    data: gaugeSlices,
                    innerRadius: 58,
                    outerRadius: 90,
                    startAngle: 90,
                    endAngle: -90,
                    cornerRadius: 2,
                    paddingAngle: 1,
                  },
                ]}
                {...pieSettings}
              />
            </div>
            <div className="cloud-gauge-value">{CONNECTED_COUNT}</div>
            <div className="cloud-gauge-caption">Connected devices</div>
            <div className="cloud-gauge-legend">
              <span>
                <span className="legend-dot legend-dot--blue" />
                Connected
              </span>
              <span>
                <span className="legend-dot legend-dot--red" />
                No connection
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
