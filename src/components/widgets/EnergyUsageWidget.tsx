import { useState, useEffect, useRef, useMemo } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import "./WidgetBase.css";
import "./EnergyUsageWidget.css";
import scheduleIcon from "../../assets/ScheduleEnergyIcon.svg";
import { seededInt } from "../../lib/seededRandom";

type EnergyUsageWidgetProps = {
  storeIds?: string[];
};

// A percentage can't be summed across stores, so the scope's rate is the
// average of each store's own compliance rate — a single store shows its
// own native rate, a region/root shows the blended average of its stores.
const buildComplianceData = (storeIds: string[]) => {
  const below = Math.round(
    storeIds.reduce((sum, id) => sum + seededInt(`${id}:compliance-below`, 30, 68), 0) /
      storeIds.length,
  );
  const above = Math.round(
    storeIds.reduce((sum, id) => sum + seededInt(`${id}:compliance-above`, 5, 22), 0) /
      storeIds.length,
  );
  const expected = Math.max(0, 100 - below - above);
  return [
    { id: 0, value: below, color: "#1e7d3f", label: "Below" },
    { id: 1, value: expected, color: "#e28e04", label: "Expected" },
    { id: 2, value: above, color: "#a4130e", label: "Above" },
  ];
};

// Below this, a pie chart plus its legend can't render without clipping —
// fall back to just the headline number instead.
const MIN_CHART_HEIGHT = 165;
const MIN_CHART_WIDTH = 150;

export default function EnergyUsageWidget({ storeIds = ["root"] }: EnergyUsageWidgetProps) {
  const complianceData = useMemo(() => buildComplianceData(storeIds), [storeIds]);
  const belowRate = complianceData[0]?.value ?? 0;
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState(100);
  const [innerRadius, setInnerRadius] = useState(30);
  const [outerRadius, setOuterRadius] = useState(50);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (!widgetRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const containerHeight = entry.contentRect.height;

        setIsCompact(
          containerHeight < MIN_CHART_HEIGHT || containerWidth < MIN_CHART_WIDTH,
        );

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
        <div className={`energy-gauge ${isCompact ? "energy-gauge--compact" : ""}`}>
          <div className="energy-value">
            <span className="energy-gauge-number">{belowRate}%</span>
            <span className="energy-gauge-label">Below schedule</span>
          </div>

          {!isCompact && (
            <div className="energy-pie-wrapper">
              <PieChart
                series={[
                  {
                    data: complianceData,
                    innerRadius: innerRadius,
                    outerRadius: outerRadius,
                    cornerRadius: 1,
                  },
                ]}
                slotProps={{
                  legend: {
                    sx: {
                      color: "var(--text-primary)",
                    },
                  },
                }}
                width={chartSize}
                height={chartSize}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
