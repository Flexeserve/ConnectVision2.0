import { useMemo } from "react";
import { Fan } from "lucide-react";
import { DonutChart, ProgressBar } from "@tremor/react";
import { WidgetShell } from "./WidgetShell";
import { useWidgetSize } from "./WidgetSizeContext";
import { createSeededRandom, seededInt, seededPick } from "../../lib/seededRandom";

type FanLifeWidgetProps = {
  storeIds?: string[];
  // Friendly names for the current scope (region/sub-region/store titles).
  // Not guaranteed to line up 1:1 with storeIds — each store picks a stable
  // (seeded) name from the pool, same approach Alarm Summary uses.
  locations?: string[];
};

type FanEntry = { id: string; name: string; percentUsed: number };

const buildFanEntries = (storeIds: string[], locations: string[]): FanEntry[] => {
  const pool = locations.length ? locations : storeIds;
  return storeIds.map((id) => {
    const nameRand = createSeededRandom(`${id}:fan-life-store-name`);
    return {
      id,
      name: seededPick(nameRand, pool),
      percentUsed: seededInt(`${id}:fan-life-percent`, 20, 99),
    };
  });
};

const NEAR_END_OF_LIFE_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 95;

export default function FanLifeWidget({
  storeIds = ["root"],
  locations = [],
}: FanLifeWidgetProps) {
  const size = useWidgetSize();
  const entries = useMemo(
    () => buildFanEntries(storeIds, locations),
    [storeIds, locations],
  );
  const nearingEndOfLife = useMemo(
    () =>
      entries
        .filter((e) => e.percentUsed >= NEAR_END_OF_LIFE_THRESHOLD)
        .sort((a, b) => b.percentUsed - a.percentUsed),
    [entries],
  );
  const count = nearingEndOfLife.length;
  const criticalCount = nearingEndOfLife.filter(
    (e) => e.percentUsed >= CRITICAL_THRESHOLD,
  ).length;
  const warningCount = count - criticalCount;

  return (
    <WidgetShell title="Fan Life" icon={<Fan />}>
      {size === "large" ? (
        count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <span className="text-5xl font-bold leading-none text-success">0</span>
            <span className="text-xs text-ink-muted">Fans nearing end of life</span>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {nearingEndOfLife.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="truncate text-xs text-ink-muted">{entry.name}</span>
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {entry.percentUsed}%
                  </span>
                </div>
                <ProgressBar
                  value={entry.percentUsed}
                  color={entry.percentUsed >= CRITICAL_THRESHOLD ? "red" : "amber"}
                  className="[&>*]:!h-1.5"
                />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="relative">
            <DonutChart
              data={
                count === 0
                  ? [{ name: "None", value: 1 }]
                  : [
                      { name: "Critical", value: criticalCount },
                      { name: "Warning", value: warningCount },
                    ]
              }
              category="value"
              index="name"
              colors={count === 0 ? ["gray"] : ["red", "amber"]}
              showLabel={false}
              showTooltip={false}
              className="h-28 w-28"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-ink">{count}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="size-2 rounded-full bg-red-500" />
              Critical
            </span>
            <span className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="size-2 rounded-full bg-amber-500" />
              Warning
            </span>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
