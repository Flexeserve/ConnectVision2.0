import { useMemo, useState } from "react";
import { Table as TableIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { WidgetShell, WidgetMetric } from "./WidgetShell";
import { useWidgetSize } from "./WidgetSizeContext";
import { createSeededRandom, seededPick } from "../../lib/seededRandom";

type AlarmRow = {
  id: string;
  location: string;
  alarm: string;
  status: "Active" | "Warning" | "Resolved";
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
const STATUSES: AlarmRow["status"][] = ["Active", "Active", "Warning", "Resolved"];

const buildRows = (seed: string, locations: string[]): AlarmRow[] => {
  const rand = createSeededRandom(`${seed}:alarm-summary`);
  const pool = locations.length ? locations : ["Central - 01"];
  const count = Math.min(12, Math.max(6, pool.length * 2));
  return Array.from({ length: count })
    .map((_, index) => {
      const hour = 6 + Math.floor(rand() * 3);
      const minute = Math.floor(rand() * 60);
      return {
        id: `${seed}-${index}`,
        location: seededPick(rand, pool),
        alarm: seededPick(rand, ALARM_TYPES),
        status: seededPick(rand, STATUSES),
        time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      };
    })
    .sort((a, b) => (a.time < b.time ? 1 : -1));
};

const PAGE_SIZE = 6;

const STATUS_STYLES: Record<AlarmRow["status"], string> = {
  Active: "bg-danger/10 text-danger",
  Warning: "bg-warning/10 text-warning",
  Resolved: "bg-success/10 text-success",
};

type AlarmSummaryWidgetProps = {
  seed?: string;
  locations?: string[];
};

export default function AlarmSummaryWidget({
  seed = "root",
  locations = [],
}: AlarmSummaryWidgetProps) {
  const size = useWidgetSize();
  const rows = useMemo(() => buildRows(seed, locations), [seed, locations]);
  const [page, setPage] = useState(0);
  const totalPages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const activeCount = rows.filter((r) => r.status === "Active").length;
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (size !== "large") {
    return (
      <WidgetShell title="Alarm Summary" icon={<TableIcon />}>
        <WidgetMetric
          value={activeCount}
          tone={activeCount > 0 ? "danger" : "success"}
        />
        <div className="text-center text-xs text-ink-muted">Active alarms</div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell title="Alarm Summary" icon={<TableIcon />}>
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="!py-1.5 !text-[11px]">Location</TableHeaderCell>
              <TableHeaderCell className="!py-1.5 !text-[11px]">Alarm</TableHeaderCell>
              <TableHeaderCell className="!py-1.5 !text-[11px]">Status</TableHeaderCell>
              <TableHeaderCell className="!py-1.5 !text-[11px]">Time</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="!py-1.5 !text-xs">{row.location}</TableCell>
                <TableCell className="!py-1.5 !text-xs">{row.alarm}</TableCell>
                <TableCell className="!py-1.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[row.status]}`}
                  >
                    {row.status}
                  </span>
                </TableCell>
                <TableCell className="!py-1.5 !text-xs tabular-nums">{row.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex shrink-0 items-center justify-between pt-2 text-xs text-ink-muted">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="rounded-md border border-line px-2.5 py-1 font-medium disabled:opacity-40"
        >
          Prev
        </button>
        <span className="font-medium">
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={page >= totalPages - 1}
          className="rounded-md border border-line px-2.5 py-1 font-medium disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </WidgetShell>
  );
}
