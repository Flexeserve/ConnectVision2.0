import { useEffect, useMemo, useRef, useState } from "react";
import "./WidgetBase.css";
import "./AlarmSummaryWidget.css";
import { createSeededRandom, seededPick } from "../../lib/seededRandom";

type AlarmRow = {
  id: string;
  location: string;
  alarm: string;
  status: string;
  time: string;
};

const ALARM_TYPES = [
  "High Temp",
  "Door Open",
  "Sensor Fault",
  "Power Loss",
  "Low Humidity",
  "Overload",
  "Comms Lost",
];

const STATUSES = ["Active", "Active", "Warning", "Resolved"];

const buildRows = (seed: string, locations: string[]): AlarmRow[] => {
  const rand = createSeededRandom(`${seed}:alarm-summary`);
  const pool = locations.length ? locations : ["Central - 01"];
  const count = Math.min(12, Math.max(6, pool.length * 2));

  const rows = Array.from({ length: count }).map((_, index) => {
    const hour = 6 + Math.floor(rand() * 3);
    const minute = Math.floor(rand() * 60);
    return {
      id: `${seed}-${index}`,
      location: seededPick(rand, pool),
      alarm: seededPick(rand, ALARM_TYPES),
      status: seededPick(rand, STATUSES),
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  });

  return rows.sort((a, b) => (a.time < b.time ? 1 : -1));
};

const PAGE_SIZE = 5;

// Below this, the table's columns and pagination controls can't fit
// legibly — fall back to just an active-alarm count instead.
const MIN_TABLE_HEIGHT = 160;
const MIN_TABLE_WIDTH = 260;

type AlarmSummaryWidgetProps = {
  seed?: string;
  locations?: string[];
};

export default function AlarmSummaryWidget({
  seed = "root",
  locations = [],
}: AlarmSummaryWidgetProps) {
  const rows = useMemo(() => buildRows(seed, locations), [seed, locations]);
  const [page, setPage] = useState(0);
  const [isCompact, setIsCompact] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const activeCount = useMemo(
    () => rows.filter((row) => row.status === "Active").length,
    [rows],
  );

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const goPrev = () => setPage((prev) => Math.max(prev - 1, 0));
  const goNext = () => setPage((prev) => Math.min(prev + 1, totalPages - 1));

  useEffect(() => {
    if (!widgetRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsCompact(height < MIN_TABLE_HEIGHT || width < MIN_TABLE_WIDTH);
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={widgetRef} className="widget-card widget-alarm-summary">
      <div className="widget-title">
        <span>Alarm Summary</span>
      </div>

      {isCompact ? (
        <div className="alarm-summary-compact">
          <span className="alarm-summary-compact-value">{activeCount}</span>
          <span className="alarm-summary-compact-label">Active alarms</span>
        </div>
      ) : (
        <>
          <div className="alarm-summary-table-wrap" role="region" aria-label="Alarm summary table">
            <table className="alarm-summary-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Alarm</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.location}</td>
                    <td>{row.alarm}</td>
                    <td>
                      <span className={`alarm-status alarm-status--${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="alarm-summary-footer">
            <button
              type="button"
              className="alarm-page-btn"
              onClick={goPrev}
              disabled={page === 0}
            >
              Prev
            </button>
            <span className="alarm-page-indicator">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="alarm-page-btn"
              onClick={goNext}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
