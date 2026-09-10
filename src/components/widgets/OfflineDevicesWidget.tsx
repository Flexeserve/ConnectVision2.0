import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { ProgressCircle } from "@tremor/react";
import { Widget } from "./Widget";
import { seededInt } from "../../lib/seededRandom";
import useElementSize from "../../hooks/useElementSize";

type OfflineDevicesWidgetProps = {
  storeIds?: string[];
  commanderOffline?: number;
};

type Category = {
  key: string;
  label: string;
  offline: number;
  total: number;
  color: "red" | "amber" | "blue";
};

// A single radial gauge — offline share of a device category. The circle
// sizes itself to whatever space the widget hands each column.
function Gauge({ cat }: { cat: Category }) {
  const pct = cat.total > 0 ? Math.round((cat.offline / cat.total) * 100) : 0;
  const [fitRef, { width, height }] = useElementSize<HTMLDivElement>();
  const side = Math.min(width, height);
  const radius = Math.max(24, Math.min(72, Math.floor(side / 2) - 10));
  const strokeWidth = Math.max(6, Math.round(radius / 6));
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 text-center">
      <div
        ref={fitRef}
        className="flex min-h-[3.5rem] w-full flex-1 items-center justify-center"
      >
        <ProgressCircle
          value={pct}
          radius={radius}
          strokeWidth={strokeWidth}
          color={pct === 0 ? "gray" : cat.color}
        >
          <span
            className={`text-lg font-bold tabular-nums ${
              cat.offline > 0 ? "text-danger" : "text-ink"
            }`}
          >
            {cat.offline}
          </span>
        </ProgressCircle>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {cat.label}
      </div>
      <div className="text-[10px] text-ink-subtle">of {cat.total}</div>
    </div>
  );
}

export default function OfflineDevicesWidget({
  storeIds = ["root"],
  commanderOffline = 0,
}: OfflineDevicesWidgetProps) {
  const categories = useMemo<Category[]>(() => {
    const n = storeIds.length || 1;
    const gatewayOffline = storeIds.reduce(
      (s, id) => s + seededInt(`${id}:gateway-error`, 0, 2),
      0,
    );
    const commanderSeeded = storeIds.reduce(
      (s, id) => s + (seededInt(`${id}:commander-offline`, 0, 9) < 2 ? 1 : 0),
      0,
    );
    const sensorOffline = storeIds.reduce(
      (s, id) => s + seededInt(`${id}:sensor-offline`, 0, 3),
      0,
    );
    return [
      {
        key: "gateway",
        label: "Gateways",
        offline: Math.min(gatewayOffline, n),
        total: n,
        color: "red",
      },
      {
        key: "commander",
        label: "Commanders",
        offline: Math.min(commanderOffline || commanderSeeded, n),
        total: n,
        color: "amber",
      },
      {
        key: "sensor",
        label: "Sensors",
        offline: sensorOffline,
        total: n * 4,
        color: "blue",
      },
    ];
  }, [storeIds, commanderOffline]);

  const total = categories.reduce((s, c) => s + c.offline, 0);

  return (
    <Widget title="Offline Devices" icon={<TriangleAlert />}>
      {(expanded) =>
        expanded ? (
          <div className="flex min-h-0 flex-1 items-stretch justify-around gap-2">
            {categories.map((cat) => (
              <Gauge key={cat.key} cat={cat} />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="text-center">
              <div
                className={`text-4xl font-bold leading-none tabular-nums ${
                  total > 0 ? "text-danger" : "text-ink"
                }`}
              >
                {total}
              </div>
              <div className="mt-1 text-xs text-ink-muted">Total offline</div>
            </div>
            <div className="flex gap-5">
              {categories.map((cat) => (
                <div key={cat.key} className="text-center">
                  <div className="text-lg font-semibold tabular-nums text-ink">
                    {cat.offline}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-subtle">
                    {cat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
    </Widget>
  );
}
