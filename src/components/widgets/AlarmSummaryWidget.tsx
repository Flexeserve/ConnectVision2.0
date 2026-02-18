import { useMemo, useState } from "react";
import "./WidgetBase.css";
import "./AlarmSummaryWidget.css";

type AlarmRow = {
  id: string;
  location: string;
  alarm: string;
  status: string;
  time: string;
};

const DEFAULT_ROWS: AlarmRow[] = [
  { id: "1", location: "Central - 12", alarm: "High Temp", status: "Active", time: "08:14" },
  { id: "2", location: "Central - 03", alarm: "Door Open", status: "Active", time: "08:02" },
  { id: "3", location: "North - 07", alarm: "Sensor Fault", status: "Warning", time: "07:51" },
  { id: "4", location: "South - 02", alarm: "Power Loss", status: "Active", time: "07:44" },
  { id: "5", location: "South - 09", alarm: "Low Humidity", status: "Warning", time: "07:29" },
  { id: "6", location: "Transport - 01", alarm: "Overload", status: "Active", time: "07:10" },
  { id: "7", location: "Central - 05", alarm: "Comms Lost", status: "Active", time: "06:58" },
  { id: "8", location: "North - 11", alarm: "Door Open", status: "Resolved", time: "06:42" },
  { id: "9", location: "South - 04", alarm: "High Temp", status: "Resolved", time: "06:20" },
];

const PAGE_SIZE = 5;

export default function AlarmSummaryWidget() {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(Math.ceil(DEFAULT_ROWS.length / PAGE_SIZE), 1);

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return DEFAULT_ROWS.slice(start, start + PAGE_SIZE);
  }, [page]);

  const goPrev = () => setPage((prev) => Math.max(prev - 1, 0));
  const goNext = () => setPage((prev) => Math.min(prev + 1, totalPages - 1));

  return (
    <div className="widget-card widget-alarm-summary">
      <div className="widget-title">
        <span>Alarm Summary</span>
      </div>

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
        <button type="button" className="alarm-page-btn" onClick={goPrev} disabled={page === 0}>
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
    </div>
  );
}
