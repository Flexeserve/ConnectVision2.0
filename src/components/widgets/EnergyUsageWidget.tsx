import { useEffect, useMemo, useRef, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import Card from "@mui/material/Card";
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
const buildComplianceRate = (storeIds: string[]) =>
  Math.round(
    storeIds.reduce((sum, id) => sum + seededInt(`${id}:compliance-rate`, 55, 96), 0) /
      storeIds.length,
  );

// Below this, the ring plus its legend can't render without clipping —
// fall back to just the headline number instead.
const MIN_RING_HEIGHT = 120;
const MIN_RING_WIDTH = 110;

export default function EnergyUsageWidget({
  storeIds = ["root"],
}: EnergyUsageWidgetProps) {
  const compliantRate = useMemo(() => buildComplianceRate(storeIds), [storeIds]);
  const nonCompliantRate = 100 - compliantRate;
  const slices = useMemo(
    () => [
      { id: 0, value: compliantRate, color: "#1fb05c", label: "Compliant" },
      { id: 1, value: nonCompliantRate, color: "#f0c419", label: "Not compliant" },
    ],
    [compliantRate, nonCompliantRate],
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const [ringSize, setRingSize] = useState(120);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (!panelRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsCompact(height < MIN_RING_HEIGHT || width < MIN_RING_WIDTH);
        const available = Math.min(width, height - 32);
        setRingSize(Math.max(72, Math.min(available, 176)));
      }
    });

    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Card className="widget-card widget-energy">
      <div className="widget-title">
        <span>Schedule Compliance</span>
        <img src={scheduleIcon} alt="" className="widget-title-icon-img" />
      </div>
      <div className="schedule-compliance-body">
        <div className="schedule-compliance-panel" ref={panelRef}>
          {isCompact ? (
            <div className="schedule-compliance-value schedule-compliance-value--compact">
              {compliantRate}%
            </div>
          ) : (
            <>
              <div
                className="schedule-compliance-ring-wrap"
                style={{ width: ringSize, height: ringSize }}
              >
                <PieChart
                  series={[
                    {
                      data: slices,
                      innerRadius: ringSize * 0.36,
                      outerRadius: ringSize * 0.48,
                      cornerRadius: 2,
                    },
                  ]}
                  hideLegend
                  width={ringSize}
                  height={ringSize}
                />
                <div className="schedule-compliance-value">{compliantRate}%</div>
              </div>
              <div className="schedule-compliance-legend">
                <span className="schedule-compliance-legend-item">
                  <span className="schedule-compliance-dot schedule-compliance-dot--compliant" />
                  Compliant
                </span>
                <span className="schedule-compliance-legend-item">
                  <span className="schedule-compliance-dot schedule-compliance-dot--not-compliant" />
                  Not compliant
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
