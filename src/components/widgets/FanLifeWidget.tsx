import { useMemo } from "react";
import { Fan } from "lucide-react";
import { BarChart, ProgressBar } from "@tremor/react";
import { Widget, RingView, Alternator } from "./Widget";
import { createSeededRandom, seededInt, seededPick } from "../../lib/seededRandom";

type FanLifeWidgetProps = {
  storeIds?: string[];
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

  const ring = (
    <RingView
      centerValue={count}
      segments={
        count === 0
          ? [{ name: "None", value: 1, color: "gray" }]
          : [
              { name: "Critical", value: criticalCount, color: "red" },
              { name: "Warning", value: warningCount, color: "amber" },
            ]
      }
    />
  );

  const list =
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
    );

  return (
    <Widget title="Fan Life" icon={<Fan />}>
      {(expanded) =>
        expanded ? (
          <Alternator
            panes={[
              { key: "list", label: "Nearing end of life", node: list },
              {
                key: "chart",
                label: "Wear % (all fans)",
                node: (
                  <BarChart
                    className="h-full"
                    data={[...entries]
                      .sort((a, b) => b.percentUsed - a.percentUsed)
                      .map((e) => ({ store: e.name, "Wear %": e.percentUsed }))}
                    index="store"
                    categories={["Wear %"]}
                    colors={["amber"]}
                    showLegend={false}
                    minValue={0}
                    maxValue={100}
                    yAxisWidth={32}
                  />
                ),
              },
              { key: "ring", label: "Critical vs warning", node: ring },
            ]}
          />
        ) : (
          ring
        )
      }
    </Widget>
  );
}
