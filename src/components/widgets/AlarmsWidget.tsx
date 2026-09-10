import { TriangleAlert } from "lucide-react";
import { Widget, Metric } from "./Widget";

type AlarmsWidgetProps = {
  value?: number;
};

export default function AlarmsWidget({ value = 12 }: AlarmsWidgetProps) {
  return (
    <Widget title="Active Alarms" icon={<TriangleAlert />}>
      {(expanded) => (
        <Metric
          value={value}
          tone={value > 0 ? "danger" : "success"}
          expanded={expanded}
        />
      )}
    </Widget>
  );
}
