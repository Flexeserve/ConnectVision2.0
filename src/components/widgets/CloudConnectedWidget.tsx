import { useState, useEffect, useRef, useMemo } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import Card from "@mui/material/Card";
import "./WidgetBase.css";
import "./CloudConnectedWidget.css";
import { seededInt } from "../../lib/seededRandom";

type CloudConnectedWidgetProps = {
  storeIds?: string[];
};

// Each store contributes its own device count; connected/offline units are
// summed across the scope's stores so a region/root rolls up its stores'
// totals while a single-store scope shows just that store's devices.
const buildGauge = (storeIds: string[]) => {
  let totalUnits = 0;
  let offlineCount = 0;
  storeIds.forEach((id) => {
    const storeTotal = seededInt(`${id}:cloud-total`, 8, 22);
    const offlineRate = seededInt(`${id}:cloud-offline-rate`, 0, 12); // percent
    totalUnits += storeTotal;
    offlineCount += Math.round((storeTotal * offlineRate) / 100);
  });
  const connectedCount = totalUnits - offlineCount;
  return [
    { id: 0, value: connectedCount, color: "#d94d14", label: "Connected" },
    {
      id: 1,
      value: offlineCount,
      color: "#adadadff",
      label: "No connection",
    },
  ];
};

// Below this, a pie chart plus its legend can't render without clipping —
// fall back to just the headline number instead.
const MIN_CHART_HEIGHT = 165;
const MIN_CHART_WIDTH = 150;

export default function CloudConnectedWidget({
  storeIds = ["root"],
}: CloudConnectedWidgetProps) {
  const gaugeSlices = useMemo(() => buildGauge(storeIds), [storeIds]);
  const connectedCount = gaugeSlices[0]?.value ?? 0;
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
    <Card ref={widgetRef} className="widget-card widget-cloud">
      <div className="widget-title">
        <span>Cloud Connected</span>
      </div>
      <div className="cloud-body">
        <div className={`cloud-gauge ${isCompact ? "cloud-gauge--compact" : ""}`}>
          <div className="cloud-gauge-value">
            <span className="cloud-gauge-number">{connectedCount}</span>
            <span className="cloud-gauge-label">Connected</span>
          </div>

          {!isCompact && (
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
    </Card>
  );
}
