import { useEffect, useMemo, useRef, useState } from "react";
import Card from "@mui/material/Card";
import AirIcon from "@mui/icons-material/Air";
import "./WidgetBase.css";
import "./FanLifeWidget.css";
import { createSeededRandom, seededInt, seededPick } from "../../lib/seededRandom";

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

// Past this width, there's room to list every nearing-end-of-life fan with
// its own progress bar instead of just the headline count. Matches the
// other widgets' MIN_CHART_WIDTH/MIN_TABLE_WIDTH (500) — the list itself is
// a single stacked column (percent/bar/name) that doesn't need much more
// room than that, and a higher value risked never being reachable at all
// on narrower browser windows, since it's well above what doubling the
// shared default width (state 1) actually produces there.
const EXPAND_WIDTH = 500;

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

  const widgetRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!widgetRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsExpanded(entry.contentRect.width >= EXPAND_WIDTH);
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Card ref={widgetRef} className="widget-card widget-fan">
      <div className="widget-title">
        <span>Fan Life</span>
        <AirIcon className="widget-title-icon" fontSize="small" />
      </div>

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
        <div className="widget-value">
          <span style={{ color: count === 0 ? "#1fb05c" : "#d94d14" }}>{count}</span>
        </div>
      )}
      {!isExpanded && <div className="widget-sub fan-life-sub">Nearing end of life</div>}
    </Card>
  );
}
