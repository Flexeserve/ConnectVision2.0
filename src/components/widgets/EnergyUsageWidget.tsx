import { useState, useEffect, useRef } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import "./WidgetBase.css";
import "./EnergyUsageWidget.css";
import scheduleIcon from "../../assets/ScheduleEnergyIcon.svg";

const complianceData = [
  { id: 0, value: 52, color: "#1fb05c", label: "Below" },
  { id: 1, value: 34, color: "#f0c419", label: "Expected" },
  { id: 2, value: 14, color: "#f14734", label: "Above" },
];

const belowRate = complianceData[0]?.value ?? 0;

export default function EnergyUsageWidget() {
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
    <div ref={widgetRef} className="widget-card widget-energy">
      <div className="widget-title">
        <img src={scheduleIcon} alt="" className="schedule-icon" aria-hidden />
        <span>Schedule compliance</span>
      </div>

      <div className="energy-body">
        <div className="energy-info"></div>

        <div className="energy-visual">
          <div className="energy-gauge">
            <div className="energy-value">
              <span className="energy-gauge-number">{belowRate}%</span>
              <span className="energy-gauge-label">Below schedule</span>
            </div>

            <div className="energy-pie-wrapper">
              <PieChart
                series={[
                  {
                    data: complianceData,
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
