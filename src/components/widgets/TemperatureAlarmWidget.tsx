import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import DeviceThermostatOutlinedIcon from "@mui/icons-material/DeviceThermostatOutlined";
import WarningIcon from "@mui/icons-material/Warning";
import "./WidgetBase.css";
import "./TemperatureAlarmWidget.css";
import { seededInt } from "../../lib/seededRandom";

export type TemperatureAlarmVariant = "high" | "low";

type TemperatureAlarmWidgetProps = {
  storeIds?: string[];
  variant: TemperatureAlarmVariant;
};

const VARIANT_CONFIG: Record<
  TemperatureAlarmVariant,
  { title: string; seedKey: string; alertColor: string }
> = {
  high: { title: "High Temperature", seedKey: "temp-alarm-high", alertColor: "#f14734" },
  low: { title: "Low Temperature", seedKey: "temp-alarm-low", alertColor: "#205ffd" },
};

// The icon's warning badge is a universal "this reading has an alarm"
// indicator, independent of which direction (high/low) the alarm is for.
const ALERT_BADGE_COLOR = "#f14734";

const DAYS = 7;
const DAY_LABELS = ["D1", "D2", "D3", "D4", "D5", "D6", "Today"];

// Most days a store raises no temperature alarms; each store independently
// has a small seeded chance of raising 1-3 on a given day, so a region/root
// scope's daily count is the sum across however many stores it covers.
const buildDailyCounts = (storeIds: string[], seedKey: string) =>
  Array.from({ length: DAYS }, (_, dayIndex) =>
    storeIds.reduce((sum, id) => {
      const raised = seededInt(`${id}:${seedKey}:day${dayIndex}:roll`, 0, 99) < 12;
      return (
        sum + (raised ? seededInt(`${id}:${seedKey}:day${dayIndex}:count`, 1, 3) : 0)
      );
    }, 0),
  );

// Below this, the bar chart's axes and labels can't render legibly — show
// just today's headline count instead, expanding into the chart once the
// widget is resized larger.
const MIN_CHART_HEIGHT = 220;
const MIN_CHART_WIDTH = 340;

export default function TemperatureAlarmWidget({
  storeIds = ["root"],
  variant,
}: TemperatureAlarmWidgetProps) {
  const config = VARIANT_CONFIG[variant];
  const dailyCounts = useMemo(
    () => buildDailyCounts(storeIds, config.seedKey),
    [storeIds, config.seedKey],
  );
  const todayCount = dailyCounts[dailyCounts.length - 1] ?? 0;

  const panelRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 300, height: 180 });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!panelRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsExpanded(width >= MIN_CHART_WIDTH && height >= MIN_CHART_HEIGHT);
        setChartSize({
          width: Math.max(220, width - 16),
          height: Math.max(140, height - 16),
        });
      }
    });

    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`widget-card widget-temp-alarm widget-temp-alarm--${variant}`}>
      <div className="widget-title">{config.title}</div>
      <div className="temp-alarm-body">
        <div className="temp-alarm-icon" aria-hidden>
          <DeviceThermostatOutlinedIcon className="temp-alarm-icon-thermo" />
          <WarningIcon
            className="temp-alarm-icon-badge"
            style={{ color: ALERT_BADGE_COLOR }}
          />
        </div>

        <div className="temp-alarm-panel" ref={panelRef}>
          {isExpanded ? (
            <BarChart
              series={[
                {
                  data: dailyCounts,
                  color: config.alertColor,
                  label: `${config.title} alarms`,
                },
              ]}
              xAxis={[{ scaleType: "band", data: DAY_LABELS }]}
              hideLegend
              width={chartSize.width}
              height={chartSize.height}
              sx={{
                "& .MuiChartsAxis-tickLabel": { fill: "var(--widget-text-primary)" },
                "& .MuiChartsAxis-label": { fill: "var(--widget-text-primary)" },
                "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                  stroke: "var(--widget-text-primary)",
                },
                "& .MuiChartsGrid-line": { stroke: "rgba(0, 0, 0, 0.08)" },
                ".dark & .MuiChartsGrid-line": { stroke: "rgba(255, 255, 255, 0.12)" },
              }}
              grid={{ horizontal: true }}
            />
          ) : (
            <span
              className="temp-alarm-value"
              style={{ color: todayCount === 0 ? "#1fb05c" : config.alertColor }}
            >
              {todayCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
