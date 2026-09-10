import { useMemo } from "react";
import { Thermometer } from "lucide-react";
import { WidgetShell, WidgetMetric } from "./WidgetShell";
import { seededInt } from "../../lib/seededRandom";

type ElementLifeWidgetProps = {
  storeIds?: string[];
};

// Per-store cumulative element-operating hours, summed the same way as
// FanLifeWidget: rolls up across the current scope, native at a single store.
export default function ElementLifeWidget({ storeIds = ["root"] }: ElementLifeWidgetProps) {
  const hours = useMemo(
    () =>
      storeIds.reduce((sum, id) => sum + seededInt(`${id}:element-life`, 5, 22), 0),
    [storeIds],
  );

  return (
    <WidgetShell title="Element Life" icon={<Thermometer />}>
      <WidgetMetric value={hours} unit="hrs" />
    </WidgetShell>
  );
}
