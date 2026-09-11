import type { ReactNode } from "react";
import {
  Fan,
  CalendarCheck,
  PoundSterling,
  Thermometer,
  TriangleAlert,
  Cloud,
  Store,
  ThermometerSnowflake,
  Table as TableIcon,
  Zap,
} from "lucide-react";

// One line per dashboard widget — same title/icon as the widget's own header
// — shown in the widgets-panel beacon's tooltip so a viewer can see what
// every tile does without opening each one.
const WIDGET_LEGEND: { title: string; icon: ReactNode; description: string }[] = [
  {
    title: "Fan Life",
    icon: <Fan />,
    description: "Cooling-fan wear across your fleet, flags units nearing end of life.",
  },
  {
    title: "Schedule Compliance",
    icon: <CalendarCheck />,
    description: "How closely each store is following its holding schedule.",
  },
  {
    title: "Energy Consumption / Cost",
    icon: <PoundSterling />,
    description: "Energy spend trend, and whether cost is rising or falling.",
  },
  {
    title: "Element Life",
    icon: <Thermometer />,
    description: "Cumulative heating-element run hours.",
  },
  {
    title: "Active Alarms",
    icon: <TriangleAlert />,
    description: "Alarms currently open across your stores.",
  },
  {
    title: "Offline Devices",
    icon: <TriangleAlert />,
    description: "Gateways, commanders and sensors currently offline.",
  },
  {
    title: "Cloud Connected",
    icon: <Cloud />,
    description: "How many devices are connected to the cloud right now.",
  },
  {
    title: "Stores Online",
    icon: <Store />,
    description: "How many stores are online right now.",
  },
  {
    title: "Temperature Alarms",
    icon: <ThermometerSnowflake />,
    description: "High and low temperature alarms raised today.",
  },
  {
    title: "Alarm Summary",
    icon: <TableIcon />,
    description: "A detailed log of recent alarms — location, type and status.",
  },
  {
    title: "Temperature",
    icon: <Thermometer />,
    description: "Cabinet temperature over time, with dips from door-open events.",
  },
  {
    title: "Energy",
    icon: <Zap />,
    description: "Average cabinet temperature over the last 24 hours.",
  },
];

export default function WidgetPanelTooltip() {
  return (
    <div className="max-h-[26rem] w-full overflow-y-auto pr-1">
      <div className="space-y-2.5">
        {WIDGET_LEGEND.map((w) => (
          <div key={w.title} className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-accent [&_svg]:size-4">
              {w.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight text-ink">
                {w.title}
              </p>
              <p className="text-[11px] leading-snug text-ink-muted">
                {w.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
