import { TriangleAlert } from "lucide-react";
import { WidgetShell, WidgetMetric } from "./WidgetShell";

type AlarmsWidgetProps = {
  value?: number;
};

export default function AlarmsWidget({ value = 12 }: AlarmsWidgetProps) {
  return (
    <WidgetShell title="Active Alarms" icon={<TriangleAlert />}>
      <WidgetMetric value={value} tone={value > 0 ? "danger" : "success"} />
    </WidgetShell>
  );
}
