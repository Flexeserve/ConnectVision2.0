import { useMemo } from "react";
import { Fan } from "lucide-react";
import { ProgressBar } from "@tremor/react";
import { Widget, RingView, Alternator } from "./Widget";
import { seededInt } from "../../lib/seededRandom";

type FanLifeWidgetProps = {
  storeIds?: string[];
  /** Real store names, parallel to storeIds. */
  names?: string[];
};

type FanEntry = { id: string; name: string; percentUsed: number };

const buildFanEntries = (storeIds: string[], names: string[]): FanEntry[] =>
  storeIds.map((id, i) => ({
    id,
    name: names[i] ?? id,
    percentUsed: seededInt(`${id}:fan-life-percent`, 20, 99),
  }));

const NEAR_END_OF_LIFE_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 95;

export default function FanLifeWidget({
  storeIds = ["root"],
  names = [],
}: FanLifeWidgetProps) {
  const entries = useMemo(
    () => buildFanEntries(storeIds, names),
    [storeIds, names],
  );
  const nearingEndOfLife = useMemo(
    () =>
      entries
        .filter((e) => e.percentUsed >= NEAR_END_OF_LIFE_THRESHOLD)
        .sort((a, b) => b.percentUsed - a.percentUsed),
    [entries],
  );
  const count = nearingEndOfLife.length;
  const healthy = entries.length - count;

  const ring = (
    <RingView
      centerValue={count}
      centerLabel="Fans near EOL"
      segments={
        count === 0
          ? [{ name: "All healthy", value: 0, color: "emerald" }]
          : [
              { name: "Near end of life", value: count, color: "amber" },
              { name: "Healthy", value: healthy, color: "emerald" },
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
              { key: "ring", label: "Fleet health", node: ring },
            ]}
          />
        ) : (
          ring
        )
      }
    </Widget>
  );
}
