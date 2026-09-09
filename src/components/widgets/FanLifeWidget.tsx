import { useEffect, useRef, useState, useMemo } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import Card from "@mui/material/Card";
import AirIcon from "@mui/icons-material/Air";
import "./WidgetBase.css";
import "./FanLifeWidget.css";
import { createSeededRandom, seededInt, seededPick } from "../../lib/seededRandom";
import { useWidgetSize } from "./WidgetSizeContext";

type FanLifeWidgetProps = {
  storeIds?: string[];
  // Friendly names for the current scope (region/sub-region/store titles).
  // Not guaranteed to line up 1:1 with storeIds — at region/root scope
  // there are far fewer of these than individual stores — so each store
  // just picks a stable (seeded) name from the pool, same approach the
  // Alarm Summary table already uses for the same mismatch.
  locations?: string[];
};

type FanEntry = {
  id: string;
  name: string;
  percentUsed: number;
};

// A fan's rated-life usage, as a percentage. Most sit comfortably below the
// "nearing end of life" line; each store independently has a small chance
// of running hot.
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
const NONE_COLOR = "#adadad";
const WARNING_COLOR = "#e28e04";
const CRITICAL_COLOR = "#a4130e";

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
        .filter((entry) => entry.percentUsed >= NEAR_END_OF_LIFE_THRESHOLD)
        .sort((a, b) => b.percentUsed - a.percentUsed),
    [entries],
  );
  const count = nearingEndOfLife.length;
  const criticalCount = useMemo(
    () => nearingEndOfLife.filter((entry) => entry.percentUsed >= CRITICAL_THRESHOLD).length,
    [nearingEndOfLife],
  );
  const warningCount = count - criticalCount;

  // Same ring structure as Stores Online: a 2-slice PieChart with the
  // headline count in the center. A single neutral slice stands in when
  // nothing is nearing end of life, so the ring never has to render with
  // zero total value.
  const slices = useMemo(
    () =>
      count === 0
        ? [{ id: 0, value: 1, color: NONE_COLOR, label: "None nearing end of life" }]
        : [
            { id: 0, value: criticalCount, color: CRITICAL_COLOR, label: "Critical" },
            { id: 1, value: warningCount, color: WARNING_COLOR, label: "Warning" },
          ],
    [count, criticalCount, warningCount],
  );

  const size = useWidgetSize();
  const isExpanded = size === "large";
  const panelRef = useRef<HTMLDivElement>(null);
  const [ringSize, setRingSize] = useState(120);

  // Ring pixel size still needs measuring (rather than a fixed constant per
  // size) since the grid's column width is fluid with viewport width, not
  // just with which of the two widget sizes is picked.
  useEffect(() => {
    if (!panelRef.current || isExpanded) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const available = Math.min(width, height - 32);
        // Capped higher than Stores Online's 176 — Fan Life's LARGE size
        // gives it more headroom to grow into, and the old cap left a
        // visible band of empty space below the ring once the card grew
        // past it.
        setRingSize(Math.max(72, Math.min(available, 260)));
      }
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [isExpanded]);

  return (
    <Card className="widget-card widget-fan">
      <div className="widget-title">
        <span>Fan Life</span>
        <AirIcon className="widget-title-icon" fontSize="small" />
      </div>

      <div className="fan-life-body">
        <div className="fan-life-panel" ref={panelRef}>
          {isExpanded ? (
            count === 0 ? (
              <div className="fan-life-empty">
                <span className="fan-life-empty-value">0</span>
                <span className="fan-life-empty-label">Fans nearing end of life</span>
              </div>
            ) : (
              <div className="fan-life-eol-list">
                {nearingEndOfLife.map((entry) => (
                  <div key={entry.id} className="fan-life-eol-item">
                    <div className="fan-life-eol-header">
                      <span className="fan-life-eol-percent">{entry.percentUsed}%</span>
                    </div>
                    <div className="fan-life-eol-bar-track">
                      <div
                        className={`fan-life-eol-bar-fill ${
                          entry.percentUsed >= CRITICAL_THRESHOLD ? "is-critical" : "is-warning"
                        }`}
                        style={{ width: `${entry.percentUsed}%` }}
                      />
                    </div>
                    <span className="fan-life-eol-name">{entry.name}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <>
              <div
                className="fan-life-ring-wrap"
                style={{ width: ringSize, height: ringSize }}
              >
                <PieChart
                  series={[
                    {
                      data: slices,
                      innerRadius: ringSize * 0.36,
                      outerRadius: ringSize * 0.48,
                      cornerRadius: 2,
                    },
                  ]}
                  hideLegend
                  width={ringSize}
                  height={ringSize}
                />
                <div className="fan-life-value">{count}</div>
              </div>
              <div className="fan-life-legend">
                <span className="fan-life-legend-item">
                  <span className="fan-life-dot fan-life-dot--critical" />
                  Critical
                </span>
                <span className="fan-life-legend-item">
                  <span className="fan-life-dot fan-life-dot--warning" />
                  Warning
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
