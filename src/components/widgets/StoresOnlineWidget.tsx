import { useEffect, useMemo, useRef, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import "./WidgetBase.css";
import "./StoresOnlineWidget.css";
import { seededInt } from "../../lib/seededRandom";

type StoresOnlineWidgetProps = {
  storeIds?: string[];
};

// Almost every store reads online; each store independently has a small
// seeded chance of reading offline, so a region/root scope's ratio reflects
// how many stores it covers, while a single-store scope reads all-or-nothing.
const buildStoresOnline = (storeIds: string[]) => {
  const total = storeIds.length || 1;
  const offline = storeIds.reduce(
    (sum, id) => sum + (seededInt(`${id}:store-online-roll`, 0, 99) < 6 ? 1 : 0),
    0,
  );
  return { total, online: total - offline, offline };
};

// Below this, the ring plus its legend can't render without clipping —
// fall back to just the headline number instead.
const MIN_RING_HEIGHT = 120;
const MIN_RING_WIDTH = 110;

export default function StoresOnlineWidget({
  storeIds = ["root"],
}: StoresOnlineWidgetProps) {
  const { online, offline } = useMemo(() => buildStoresOnline(storeIds), [storeIds]);
  const slices = useMemo(
    () => [
      { id: 0, value: online, color: "#1fb05c", label: "Online" },
      { id: 1, value: offline, color: "#adadad", label: "Offline" },
    ],
    [online, offline],
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const [ringSize, setRingSize] = useState(120);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (!panelRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsCompact(height < MIN_RING_HEIGHT || width < MIN_RING_WIDTH);
        const available = Math.min(width, height - 32);
        setRingSize(Math.max(72, Math.min(available, 176)));
      }
    });

    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="widget-card widget-stores-online">
      <div className="widget-title">Stores Online</div>
      <div className="stores-online-body">
        <div className="stores-online-icon" aria-hidden>
          <StorefrontOutlinedIcon className="stores-online-icon-back" />
          <StorefrontOutlinedIcon className="stores-online-icon-front" />
        </div>

        <div className="stores-online-panel" ref={panelRef}>
          {isCompact ? (
            <div className="stores-online-value stores-online-value--compact">
              {online}
            </div>
          ) : (
            <>
              <div
                className="stores-online-ring-wrap"
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
                <div className="stores-online-value">{online}</div>
              </div>
              <div className="stores-online-legend">
                <span className="stores-online-legend-item">
                  <span className="stores-online-dot stores-online-dot--online" />
                  Online
                </span>
                <span className="stores-online-legend-item">
                  <span className="stores-online-dot stores-online-dot--offline" />
                  Offline
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
