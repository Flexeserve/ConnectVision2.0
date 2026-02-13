import { useState, useEffect, useRef } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import "./WidgetBase.css";
import "./CloudConnectedWidget.css";
import cloudConnectLogo from "../../assets/CloudConnect.svg";

const CONNECTED_COUNT = 937;
const TOTAL_UNITS = 1000;
const OFFLINE_COUNT = TOTAL_UNITS - CONNECTED_COUNT;

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
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState(100);
  const [innerRadius, setInnerRadius] = useState(30);
  const [outerRadius, setOuterRadius] = useState(50);

  useEffect(() => {
    if (!widgetRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const containerHeight = entry.contentRect.height;

        // Calculate chart size based on container dimensions
        // Use smaller dimension and scale appropriately
        const baseSize = Math.min(containerWidth * 0.35, containerHeight * 0.5);
        const size = Math.max(60, Math.min(baseSize, 140));

        setChartSize(size);
        setInnerRadius(size * 0.3);
        setOuterRadius(size * 0.5);
      }
    });

    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={widgetRef} className="widget-card widget-cloud">
      <div className="widget-title">
        <img
          src={cloudConnectLogo}
          alt="Cloud Connect"
          className="cloud-title-icon"
        />
        <span>Cloud Connected</span>
      </div>
      <div className="cloud-body">
        <div className="cloud-visual">
          <div className="cloud-gauge">
            <div className="cloud-gauge-value">
              <span className="cloud-gauge-number">{CONNECTED_COUNT}</span>
              <span className="cloud-gauge-label">Connected</span>
            </div>

            <div className="cloud-pie-wrapper">
              <PieChart
                series={[
                  {
                    data: gaugeSlices,
                    innerRadius: innerRadius,
                    outerRadius: outerRadius,
                    cornerRadius: 3,
                  },
                ]}
                width={chartSize}
                height={chartSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
