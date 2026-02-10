import { PieChart } from "@mui/x-charts/PieChart";
import "./WidgetBase.css";
import "./EnergyUsageWidget.css";
import scheduleIcon from "../../assets/ScheduleEnergyIcon.svg";
import useElementSize from "../../hooks/useElementSize";

const complianceData = [
  { id: 0, value: 52, color: "#1fb05c", label: "Below" },
  { id: 1, value: 34, color: "#f0c419", label: "Expected" },
  { id: 2, value: 14, color: "#f14734", label: "Above" },
];

const belowRate = complianceData[0]?.value ?? 0;

export default function EnergyUsageWidget() {
  const [gaugeRef, gaugeSize] = useElementSize<HTMLDivElement>();
  const measuredWidth = gaugeSize.width || 210;
  const chartWidth = Math.max(Math.min(measuredWidth, 300), 160);
  const chartHeight = Math.max(chartWidth * 0.85, 150);
  const chartCy = chartHeight - Math.min(chartHeight * 0.3, 60);

  return (
    <div className="widget-card widget-energy">
      <div className="widget-title">
        <img
          src={scheduleIcon}
          alt=""
          className="schedule-icon"
          aria-hidden
        />
        Schedule compliance
      </div>

      <div className="schedule-content">
        <div className="energy-insights">
          <div className="energy-label">
            Below threshold{" "}
            <span className="energy-highlight">{belowRate}%</span>
          </div>
          <div className="energy-legend">
            {complianceData.map((slice) => (
              <span key={slice.id} className="energy-legend-item">
                <span
                  className="energy-dot"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
            ))}
          </div>
        </div>

        <div className="energy-gauge" ref={gaugeRef}>
          <PieChart
            series={[
              {
                data: complianceData,
                innerRadius: 42,
                outerRadius: 70,
                startAngle: 90,
                endAngle: -90,
                paddingAngle: 1,
                cornerRadius: 2,
                cx: chartWidth / 2,
                cy: chartCy,
              },
            ]}
            width={chartWidth}
            height={chartHeight}
            slotProps={{
              legend: { hidden: true },
              root: {
                sx: {
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
