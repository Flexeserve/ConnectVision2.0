import { PieChart } from "@mui/x-charts/PieChart";
import "./WidgetBase.css";
import "./CloudConnectedWidget.css";
import cloudConnectLogo from "../../assets/CloudConnect.svg";
import useElementSize from "../../hooks/useElementSize";

const CONNECTED_COUNT = 937;
const TOTAL_UNITS = 1000;
const OFFLINE_COUNT = TOTAL_UNITS - CONNECTED_COUNT;
const AVAILABILITY = Math.round((CONNECTED_COUNT / TOTAL_UNITS) * 100);

const gaugeSlices = [
  { id: 0, value: CONNECTED_COUNT, color: "#205ffd", label: "Connected" },
  {
    id: 1,
    value: OFFLINE_COUNT,
    color: "#f14734",
    label: "No connection",
  },
];

export default function CloudConnectedWidget() {
  const [gaugeRef, gaugeSize] = useElementSize<HTMLDivElement>();
  const measuredWidth = gaugeSize.width || 220;
  const gaugeWidth = Math.max(Math.min(measuredWidth, 240), 160);
  const gaugeHeight = Math.max(gaugeWidth * 0.7, 140);
  const gaugeCy = gaugeHeight - Math.min(gaugeHeight * 0.35, 52);

  const pieSettings = {
    width: gaugeWidth,
    height: gaugeHeight,
    slotProps: {
      legend: { hidden: true },
      root: {
        sx: {
          width: "100%",
          display: "flex",
          justifyContent: "center",
        },
      },
    },
  } as const;

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
          <div className="cloud-status">
            <span className="status-label">Network uptime</span>
            <span className="status-value">
              <span
                className={`status-dot ${
                  AVAILABILITY >= 95 ? "is-online" : "is-warning"
                }`}
                aria-hidden
              />
              {AVAILABILITY}% available
            </span>
          </div>
          <div className="cloud-summary">
            <div className="cloud-summary-item">
              <span className="summary-label">Connected</span>
              <span className="summary-value">{CONNECTED_COUNT}</span>
            </div>
            <div className="cloud-summary-item">
              <span className="summary-label">Offline</span>
              <span className="summary-value summary-value--alert">
                {OFFLINE_COUNT}
              </span>
            </div>
            <div className="cloud-summary-item">
              <span className="summary-label">Last sync</span>
              <span className="summary-value summary-value--muted">
                2 mins ago
              </span>
            </div>
          </div>
        </div>

        <div className="cloud-widget-right">
          <div className="cloud-gauge">
            <div className="cloud-pie-wrapper" ref={gaugeRef}>
              <PieChart
                series={[
                  {
                    data: gaugeSlices,
                    innerRadius: 48,
                    outerRadius: 70,
                    startAngle: 90,
                    endAngle: -90,
                    cornerRadius: 3,
                    paddingAngle: 1,
                    cx: gaugeWidth / 2,
                    cy: gaugeCy,
                  },
                ]}
                {...pieSettings}
              />
            </div>
            <div className="cloud-gauge-value">
              <span className="cloud-gauge-number">{CONNECTED_COUNT}</span>
              <span className="cloud-gauge-label">Connected devices</span>
            </div>
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
