import React from "react";
import { Search } from "lucide-react";
import connectLogo from "../assets/connect_flexeserve.svg";
import connectLogoInversed from "../assets/connect_flexeserve_inversed.svg";
import Header from "../components/Header";
import "./BusinessManagerPage.css";
import "../styles/tour.css";
import FanLifeWidget from "../components/widgets/FanLifeWidget";
import EnergyUsageWidget from "../components/widgets/EnergyUsageWidget";
import EnergyCostWidget from "../components/widgets/EnergyCostWidget";
import ElementLifeWidget from "../components/widgets/ElementLifeWidget";
import AlarmsWidget from "../components/widgets/AlarmsWidget";
import OfflineDevicesWidget from "../components/widgets/OfflineDevicesWidget";
import CloudConnectedWidget from "../components/widgets/CloudConnectedWidget";
import StoresOnlineWidget from "../components/widgets/StoresOnlineWidget";
import TemperatureAlarmsWidget from "../components/widgets/TemperatureAlarmsWidget";
import AlarmSummaryWidget from "../components/widgets/AlarmSummaryWidget";
import DoorOpenedAlarmsWidget from "../components/widgets/DoorOpenedAlarmsWidget";
import EnergyWidget from "../components/widgets/EnergyWidget";
import onlineStatusIcon from "../assets/OnlineStatus.svg";
import Beacon, { type BeaconOffset } from "../components/Beacon";
import TypewriterText from "../components/TypewriterText";
import { WidgetGrid } from "../components/widgets/Widget";
import { WidgetSpanContext, type WidgetSpan } from "../components/widgets/widgetSpan";
import { useCityName } from "../hooks/useCityName";
import { createBusinessManagerBeaconTour } from "../utils/businessManagerTour";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BEACON_OFFSETS_KEY = "cv_beacon_offsets";
const WIDGET_ORDER_KEY = "cv_widget_order";
const WIDGET_SPANS_KEY = "cv_widget_spans";
const BEACONS_HIDDEN_KEY = "cv_beacons_hidden";
const BEACONS_VISIBILITY_EVENT = "cv_beacons_visibility_updated";
const HEADER_BRAND_KEY = "cv_header_brand";
const HEADER_BRAND_EVENT = "cv_header_brand_updated";
const HIDDEN_WIDGETS_KEY = "cv_hidden_widgets";
const SHOW_DEV_MENU = false;

// Manual widget resizing (drag the corner in edit mode to change how many
// grid cells a widget spans). Flip to false to disable — the expand button
// still works, widgets just can't be free-resized.
const ENABLE_WIDGET_RESIZE = true;

const GRID_GAP_PX = 12; // matches WidgetGrid's gap-3
const GRID_ROW_PX = 240; // matches WidgetGrid's auto-rows-[15rem]
const MAX_SPAN = 3;

// One grid cell — sortable (drag to reorder) and, when ENABLE_WIDGET_RESIZE,
// resizable (drag the SE corner) while editing. A manual span overrides the
// inner <Widget>'s expand-to-2x2 :has() rule via inline style.
function SortableWidget({
  id,
  isEditing,
  span,
  onResize,
  children,
}: {
  id: string;
  isEditing: boolean;
  span?: WidgetSpan;
  onResize?: (id: string, span: WidgetSpan) => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !isEditing });
  const elRef = React.useRef<HTMLDivElement | null>(null);
  const [resizing, setResizing] = React.useState(false);

  const setRefs = (node: HTMLDivElement | null) => {
    elRef.current = node;
    setNodeRef(node);
  };

  // Live pixel-follow while dragging, then a short ease into the snapped
  // grid cell on release — so it doesn't feel like it just jumps.
  const startResize = (e: React.PointerEvent) => {
    const el = elRef.current;
    if (!onResize || !el) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = el.getBoundingClientRect();
    const startC = span?.c ?? 1;
    const startR = span?.r ?? 1;
    const cellW = (rect.width - (startC - 1) * GRID_GAP_PX) / startC;
    const rowStride = GRID_ROW_PX + GRID_GAP_PX;
    const snapC = (w: number) =>
      Math.min(MAX_SPAN, Math.max(1, Math.round((w + GRID_GAP_PX) / (cellW + GRID_GAP_PX))));
    const snapR = (h: number) =>
      Math.min(MAX_SPAN, Math.max(1, Math.round((h + GRID_GAP_PX) / rowStride)));
    const pxForC = (c: number) => c * cellW + (c - 1) * GRID_GAP_PX;
    const pxForR = (r: number) => r * GRID_ROW_PX + (r - 1) * GRID_GAP_PX;

    let next = { c: startC, r: startR };
    setResizing(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    el.style.transition = "none";
    el.style.zIndex = "40";

    const move = (ev: PointerEvent) => {
      const w = Math.max(cellW * 0.7, rect.width + (ev.clientX - e.clientX));
      const h = Math.max(GRID_ROW_PX * 0.7, rect.height + (ev.clientY - e.clientY));
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      next = { c: snapC(w), r: snapR(h) };
    };

    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      // ease from the free size to the exact snapped cell size…
      el.style.transition = "width 160ms ease, height 160ms ease";
      el.style.width = `${pxForC(next.c)}px`;
      el.style.height = `${pxForR(next.r)}px`;
      window.setTimeout(() => {
        // …then hand sizing back to the grid via the committed span
        el.style.transition = "";
        el.style.width = "";
        el.style.height = "";
        el.style.zIndex = "";
        setResizing(false);
        onResize(id, next);
      }, 170);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
  };

  const spanStyle: React.CSSProperties = span
    ? {
        gridColumn: `span ${span.c} / span ${span.c}`,
        gridRow: `span ${span.r} / span ${span.r}`,
      }
    : {};

  return (
    <div
      ref={setRefs}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        ...(resizing ? {} : spanStyle),
      }}
      className={`sortable-widget relative ${isDragging ? "opacity-70" : ""} ${
        resizing ? "overflow-visible" : ""
      }`}
    >
      {isEditing && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="absolute left-2 top-2 z-10 flex size-6 cursor-grab touch-none items-center justify-center rounded-md bg-ink/70 text-surface active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      {isEditing && ENABLE_WIDGET_RESIZE && onResize && (
        <span
          onPointerDown={startResize}
          role="slider"
          aria-label="Resize widget"
          aria-valuetext={`${span?.c ?? 1} by ${span?.r ?? 1}`}
          tabIndex={0}
          className="absolute -bottom-0.5 -right-0.5 z-20 size-5 cursor-se-resize touch-none rounded-br-widget border-b-[3px] border-r-[3px] border-accent"
        />
      )}
      <WidgetSpanContext.Provider value={span ?? null}>
        {children}
      </WidgetSpanContext.Provider>
    </div>
  );
}

export type BURow = {
  id: string;
  title: string;
  subtitle?: string;
  alarms?: number;
  notices?: number;
};

const DEFAULT_BU_ROWS: BURow[] = [
  {
    id: "east",
    title: "Central China",
    subtitle: "3 Stores",
    alarms: 2,
    notices: 3,
  },
  {
    id: "gulf",
    title: "North China",
    subtitle: "2 Stores",
    alarms: 1368,
    notices: 135,
  },
  {
    id: "tx",
    title: "South China",
    subtitle: "2 Stores",
    alarms: 1564,
    notices: 93,
  },
  {
    id: "west",
    title: "Transport Hubs",
    subtitle: "2 Stores",
    alarms: 4,
    notices: 4,
  },
];

export default function BusinessManagerPage({
  onBack,
  onOpen,
  rows,
  heading,
  levelKey,
  storeIds,
}: {
  onBack?: () => void;
  onOpen?: (id: string) => void;
  rows?: BURow[];
  heading?: string;
  levelKey?: string;
  storeIds?: string[];
}) {
  const buRows = rows ?? DEFAULT_BU_ROWS;
  const scopeSeed = levelKey ?? heading ?? "root";
  const city = useCityName("London");
  // The stores that make up the current scope. Metrics below are computed
  // per-store and summed/averaged upward, so a region shows the cumulative
  // of its stores while a single-store scope shows that store's own reading.
  const scopeStoreIds = React.useMemo(
    () => (storeIds?.length ? storeIds : [scopeSeed]),
    [storeIds, scopeSeed],
  );
  const scopeLocations = React.useMemo(
    () => buRows.map((row) => row.title),
    [buRows],
  );
  const totalOfflineDevices = React.useMemo(
    () => buRows.reduce((sum, row) => sum + (row.alarms ?? 0), 0),
    [buRows],
  );
  const totalActiveAlarms = React.useMemo(
    () => buRows.reduce((sum, row) => sum + (row.notices ?? 0), 0),
    [buRows],
  );
  const widgetComponents = React.useMemo(
    () => [
      {
        id: "fan-life",
        label: "Fan Life",
        element: <FanLifeWidget storeIds={scopeStoreIds} locations={scopeLocations} />,
      },
      {
        id: "energy",
        label: "Schedule Compliance",
        element: (
          <EnergyUsageWidget storeIds={scopeStoreIds} locations={scopeLocations} />
        ),
      },
      {
        id: "energy-cost",
        label: "Energy Consumption / Cost",
        element: <EnergyCostWidget storeIds={scopeStoreIds} />,
      },
      {
        id: "element",
        label: "Element Life",
        element: <ElementLifeWidget storeIds={scopeStoreIds} />,
      },
      {
        id: "alarms",
        label: "Active Alarms",
        element: (
          <AlarmsWidget
            storeIds={scopeStoreIds}
            locations={scopeLocations}
            value={totalActiveAlarms}
          />
        ),
      },
      {
        id: "offline-devices",
        label: "Offline Devices",
        element: (
          <OfflineDevicesWidget storeIds={scopeStoreIds} commanderOffline={totalOfflineDevices} />
        ),
      },
      {
        id: "cloud",
        label: "Cloud Connected",
        element: <CloudConnectedWidget storeIds={scopeStoreIds} />,
      },
      {
        id: "stores-online",
        label: "Stores Online",
        element: (
          <StoresOnlineWidget storeIds={scopeStoreIds} locations={scopeLocations} />
        ),
      },
      {
        id: "temp-alarms",
        label: "Temperature Alarms",
        element: (
          <TemperatureAlarmsWidget
            storeIds={scopeStoreIds}
            locations={scopeLocations}
          />
        ),
      },
      {
        id: "alarm-summary",
        label: "Alarm Summary",
        element: (
          <AlarmSummaryWidget key={scopeSeed} seed={scopeSeed} locations={scopeLocations} />
        ),
      },
      {
        id: "door-opened",
        label: "Temperature",
        element: <DoorOpenedAlarmsWidget storeIds={scopeStoreIds} />,
      },
      {
        id: "energy-widget",
        label: "Energy Widget",
        element: <EnergyWidget storeIds={scopeStoreIds} />,
      },
    ],
    [totalActiveAlarms, totalOfflineDevices, scopeSeed, scopeStoreIds, scopeLocations],
  );

  const [searchQuery, setSearchQuery] = React.useState("");

  // Drilling into a different region/store shouldn't leave a stale filter
  // silently hiding rows at the new level.
  React.useEffect(() => {
    setSearchQuery("");
  }, [levelKey, heading]);

  const visibleBuRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return buRows;
    return buRows.filter(
      (row) =>
        row.title.toLowerCase().includes(query) ||
        (row.subtitle ?? "").toLowerCase().includes(query),
    );
  }, [buRows, searchQuery]);

  // "Edit mode" now just reveals the widget show/hide panel — no drag/resize.
  const [isEditing, setIsEditing] = React.useState(false);
  const [hiddenWidgetIds, setHiddenWidgetIds] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(HIDDEN_WIDGETS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
    } catch {
      return [];
    }
  });
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isWidgetsScrolled, setIsWidgetsScrolled] = React.useState(false);
  const [isBeaconDevMode, setIsBeaconDevMode] = React.useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = React.useState(false);
  const [isHebHeader, setIsHebHeader] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(HEADER_BRAND_KEY) === "heb";
  });
  const [isBeaconsHidden, setIsBeaconsHidden] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(BEACONS_HIDDEN_KEY) !== "0";
  });
  const [beaconOffsets, setBeaconOffsets] = React.useState<Record<string, BeaconOffset>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(BEACON_OFFSETS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, BeaconOffset>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const widgetsPanelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.body.classList.contains("dark"));
    };
    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const syncHeaderBrand = () => {
      setIsHebHeader(window.localStorage.getItem(HEADER_BRAND_KEY) === "heb");
    };
    syncHeaderBrand();
    window.addEventListener("storage", syncHeaderBrand);
    window.addEventListener(HEADER_BRAND_EVENT, syncHeaderBrand);
    return () => {
      window.removeEventListener("storage", syncHeaderBrand);
      window.removeEventListener(HEADER_BRAND_EVENT, syncHeaderBrand);
    };
  }, []);

  const startTourFrom = React.useCallback((stepIndex: number) => {
    const beaconTour = createBusinessManagerBeaconTour(stepIndex);
    if (!beaconTour) return;
    beaconTour.drive();
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BEACON_OFFSETS_KEY, JSON.stringify(beaconOffsets));
  }, [beaconOffsets]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HIDDEN_WIDGETS_KEY, JSON.stringify(hiddenWidgetIds));
  }, [hiddenWidgetIds]);

  const toggleWidgetVisibility = React.useCallback((id: string) => {
    setHiddenWidgetIds((prev) =>
      prev.includes(id) ? prev.filter((hiddenId) => hiddenId !== id) : [...prev, id],
    );
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("beacons-hidden", isBeaconsHidden);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BEACONS_HIDDEN_KEY, isBeaconsHidden ? "1" : "0");
      window.dispatchEvent(new Event(BEACONS_VISIBILITY_EVENT));
    }
  }, [isBeaconsHidden]);

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setIsBeaconDevMode((prev) => !prev);
      }
      if (event.ctrlKey && event.shiftKey && event.key === "0") {
        event.preventDefault();
        setBeaconOffsets({});
      }
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "h") {
        event.preventDefault();
        setIsBeaconsHidden((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // Widget order — persisted; drag-and-drop (edit mode) reorders it. New
  // widgets added to the registry that aren't in the saved order just get
  // appended in registry order.
  const [widgetOrder, setWidgetOrder] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(WIDGET_ORDER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  // Manual per-widget grid spans (from corner-resizing). { [id]: {c, r} }.
  const [widgetSpans, setWidgetSpans] = React.useState<Record<string, WidgetSpan>>(
    () => {
      if (typeof window === "undefined" || !ENABLE_WIDGET_RESIZE) return {};
      try {
        const raw = window.localStorage.getItem(WIDGET_SPANS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    },
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WIDGET_SPANS_KEY, JSON.stringify(widgetSpans));
  }, [widgetSpans]);

  const handleWidgetResize = React.useCallback((id: string, span: WidgetSpan) => {
    setWidgetSpans((prev) => {
      // 1x1 is the default — don't store it
      if (span.c === 1 && span.r === 1) {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      const cur = prev[id];
      if (cur && cur.c === span.c && cur.r === span.r) return prev;
      return { ...prev, [id]: span };
    });
  }, []);

  const orderedWidgets = React.useMemo(() => {
    const registryIds = widgetComponents.map((w) => w.id);
    const rank = new Map(widgetOrder.map((id, i) => [id, i]));
    return [...widgetComponents]
      .sort(
        (a, b) =>
          (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) ||
          registryIds.indexOf(a.id) - registryIds.indexOf(b.id),
      )
      .filter((w) => !hiddenWidgetIds.includes(w.id));
  }, [widgetComponents, widgetOrder, hiddenWidgetIds]);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleWidgetDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setWidgetOrder((prev) => {
        const base = prev.length
          ? prev
          : widgetComponents.map((w) => w.id);
        const withMissing = [
          ...base,
          ...widgetComponents.map((w) => w.id).filter((id) => !base.includes(id)),
        ];
        const from = withMissing.indexOf(String(active.id));
        const to = withMissing.indexOf(String(over.id));
        if (from < 0 || to < 0) return prev;
        return arrayMove(withMissing, from, to);
      });
    },
    [widgetComponents],
  );

  const handleBeaconOffsetChange = React.useCallback(
    (beaconId: string, next: BeaconOffset) => {
      setBeaconOffsets((prev) => ({
        ...prev,
        [beaconId]: next,
      }));
    },
    [],
  );


  return (
    <div className="relative flex min-h-screen flex-col pb-24 text-ink">
      <Header onBack={onBack} title="Manager View" />
      <div className="relative">
        <div
          className="flex flex-1 flex-wrap bg-canvas px-4 text-ink sm:px-8 lg:px-12 max-lg:flex-col"
          style={{ minHeight: "calc(100vh - 64px)" }}
        >
          <div className="flex min-h-[150px] w-full basis-full items-center justify-left px-6 text-center text-5xl font-extrabold text-accent sm:px-12 sm:text-6xl">
            <TypewriterText text={`Good Morning, ${city}`} />
          </div>

          <div className="flex min-w-0 basis-[30%] flex-col items-center max-lg:basis-auto lg:animate-shrink-left-panel">
            <div className="my-4 flex w-full items-center justify-center px-6 sm:px-12">
              <div className="relative flex w-full max-w-[500px] sm:w-[460px]">
                <Beacon
                  label="Search tour"
                  beaconId="search"
                  onClick={() => startTourFrom(6)}
                  devMode={isBeaconDevMode}
                  offset={beaconOffsets.search}
                  onOffsetChange={(next) => handleBeaconOffsetChange("search", next)}
                />
                <input
                  type="text"
                  placeholder="Write to start search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-9 w-full rounded-l-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-muted hover:border-ink focus:border-ink focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Search"
                  className="flex h-9 w-16 shrink-0 items-center justify-center rounded-r-md bg-gradient-to-br from-accent to-[#f06a24] text-white"
                >
                  <Search className="size-4" />
                </button>
              </div>
            </div>

            <div
              key={levelKey ?? heading ?? "root"}
              className="mx-auto w-full max-w-5xl animate-fade-in-up px-4 pt-2"
            >
              <div className="relative mb-6 flex items-center">
                <span className="font-sans text-4xl font-bold text-ink">
                  Markets
                </span>
              </div>
              <div className="relative flex flex-col items-stretch gap-3">
                <Beacon
                  label="Business units tour"
                  beaconId="bu-list"
                  onClick={() => startTourFrom(3)}
                  devMode={isBeaconDevMode}
                  offset={beaconOffsets["bu-list"]}
                  onOffsetChange={(next) => handleBeaconOffsetChange("bu-list", next)}
                />
                {visibleBuRows.length === 0 && (
                  <p className="px-1 py-3 text-sm text-ink-muted">
                    No matches for "{searchQuery}"
                  </p>
                )}
                {visibleBuRows.map((r, index) => (
                  <div
                    key={r.id}
                    className="w-full cursor-pointer self-stretch border-l-4 border-ink"
                    onClick={() => onOpen?.(r.id)}
                    role={onOpen ? "button" : undefined}
                    tabIndex={onOpen ? 0 : -1}
                    onKeyDown={(event) => {
                      if (!onOpen) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpen(r.id);
                      }
                    }}
                  >
                    <div className="bu-row-content flex min-h-[42px] items-center justify-between bg-surface px-[18px] py-2 transition-colors hover:bg-surface-hover">
                      <div className="relative flex flex-col gap-1.5">
                        {index === 0 ? (
                          <Beacon
                            label="Region alarms tour"
                            beaconId="region-alarms"
                            onClick={() => startTourFrom(9)}
                            devMode={isBeaconDevMode}
                            offset={beaconOffsets["region-alarms"]}
                            onOffsetChange={(next) =>
                              handleBeaconOffsetChange("region-alarms", next)
                            }
                          />
                        ) : null}
                        <span className="text-sm text-ink">{r.title}</span>
                        {r.subtitle ? (
                          <span className="text-xs font-medium text-ink-muted">
                            {r.subtitle}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded border border-line-strong px-2.5 py-1.5">
                          <img
                            src={onlineStatusIcon}
                            alt="Online status"
                            className="size-6"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6 min-w-0 basis-[70%] max-lg:basis-auto lg:animate-expand-widgets-panel">
            <div
              className="widgets-scroll flex w-full animate-fade-in flex-col gap-4 overflow-y-auto border-l border-line bg-canvas py-5 pl-4 pr-10 text-ink-muted [animation-delay:150ms]"
              ref={widgetsPanelRef}
              onScroll={(event) =>
                setIsWidgetsScrolled(event.currentTarget.scrollTop > 8)
              }
              style={{ maxHeight: "calc(100dvh - 200px)" }}
            >
              <Beacon
                label="Widgets panel tour"
                beaconId="widgets"
                onClick={() => startTourFrom(7)}
                devMode={isBeaconDevMode}
                offset={beaconOffsets.widgets}
                onOffsetChange={(next) => handleBeaconOffsetChange("widgets", next)}
              />
              <div
                className={`pointer-events-none sticky top-3 z-[5] flex justify-end transition-opacity ${
                  isWidgetsScrolled ? "pointer-events-auto opacity-100" : "opacity-0"
                }`}
              >
                <button
                  type="button"
                  aria-label="Edit dashboard layout"
                  aria-pressed={isEditing}
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="flex size-[42px] items-center justify-center rounded-full border border-line-strong bg-surface text-sm text-ink shadow-lg hover:bg-ink hover:text-surface"
                >
                  {isEditing ? "✓" : "✎"}
                </button>
              </div>

              <div className="flex w-full items-center gap-1.5 text-[0.95rem] font-semibold uppercase tracking-wider text-ink">
                <span>Overview dashboard</span>
                <span className="h-px flex-1 bg-line" aria-hidden />
                <button
                  type="button"
                  aria-label="Edit dashboard layout"
                  aria-pressed={isEditing}
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="flex size-8 items-center justify-center rounded-md border border-line-strong bg-surface text-sm text-ink transition-colors hover:bg-ink hover:text-surface"
                >
                  {isEditing ? "✓" : "✎"}
                </button>
              </div>
              {isEditing && (
                <div
                  className="-mt-2 flex w-full flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-3 animate-fade-in-scale"
                  role="group"
                  aria-label="Show or hide widgets"
                >
                  <span className="mr-1 text-[0.7rem] font-bold uppercase tracking-wider text-ink-muted">
                    Widgets
                  </span>
                  {widgetComponents.map((widget) => {
                    const isHidden = hiddenWidgetIds.includes(widget.id);
                    return (
                      <button
                        key={widget.id}
                        type="button"
                        className={`inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-canvas px-3 py-[5px] text-xs font-semibold text-ink transition-colors hover:border-ink ${
                          isHidden ? "opacity-60 !text-ink-muted" : ""
                        }`}
                        aria-pressed={!isHidden}
                        onClick={() => toggleWidgetVisibility(widget.id)}
                      >
                        <span
                          className={`size-[7px] shrink-0 rounded-full ${
                            isHidden ? "bg-ink-muted" : "bg-success"
                          }`}
                          aria-hidden
                        />
                        {widget.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* extra bottom padding so the last row clears the fixed footer */}
              <div className="flex-1 pb-28 pr-3 pt-2">
                <DndContext
                  sensors={dndSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleWidgetDragEnd}
                >
                  <SortableContext
                    items={orderedWidgets.map((w) => w.id)}
                    strategy={rectSortingStrategy}
                  >
                    <WidgetGrid>
                      {orderedWidgets.map((w) => (
                        <SortableWidget
                          key={w.id}
                          id={w.id}
                          isEditing={isEditing}
                          span={widgetSpans[w.id]}
                          onResize={handleWidgetResize}
                        >
                          {w.element}
                        </SortableWidget>
                      ))}
                    </WidgetGrid>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
        <Beacon
          label="Settings tour"
          beaconId="settings"
          onClick={() => startTourFrom(2)}
          devMode={isBeaconDevMode}
          offset={beaconOffsets.settings}
          onOffsetChange={(next) => handleBeaconOffsetChange("settings", next)}
        />
        {SHOW_DEV_MENU && (
          <div
            className={`dev-radial-menu ${isDevMenuOpen ? "is-open" : ""}`}
            aria-label="Developer controls"
          >
            <button
              type="button"
              className="dev-radial-main"
              onClick={() => setIsDevMenuOpen((prev) => !prev)}
              aria-label="Toggle dev menu"
            >
              Dev
            </button>
            <button
              type="button"
              className="dev-radial-item dev-radial-item--left"
              onClick={() => setIsBeaconsHidden((prev) => !prev)}
              aria-label="Toggle beacons visibility"
            >
              {isBeaconsHidden ? "Beacons Off" : "Beacons On"}
            </button>
            <button
              type="button"
              className="dev-radial-item dev-radial-item--top"
              onClick={() => setIsBeaconDevMode((prev) => !prev)}
              aria-label="Toggle beacon drag mode"
            >
              {isBeaconDevMode ? "Drag On" : "Drag Off"}
            </button>
            <button
              type="button"
              className="dev-radial-item dev-radial-item--right"
              onClick={() => setBeaconOffsets({})}
              aria-label="Reset beacon offsets"
            >
              Reset
            </button>
            <button
              type="button"
              className="dev-radial-item dev-radial-item--bottom"
              onClick={() => {
                const nextIsHeb = !isHebHeader;
                setIsHebHeader(nextIsHeb);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(
                    HEADER_BRAND_KEY,
                    nextIsHeb ? "heb" : "default",
                  );
                  window.dispatchEvent(new Event(HEADER_BRAND_EVENT));
                }
              }}
              aria-label="Toggle HEB header"
            >
              {isHebHeader ? "HEB On" : "HEB Off"}
            </button>
          </div>
        )}
      </div>
      <footer className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-line bg-surface px-6 py-3 text-ink shadow-[0_-2px_6px_rgba(0,0,0,0.15)] sm:px-12">
        <span>© {new Date().getFullYear()} Flexeserve Connect</span>
        <img
          src={isDarkMode ? connectLogoInversed : connectLogo}
          alt="Connect by Flexeserve"
          className="h-[42px] opacity-95"
        />
      </footer>
    </div>
  );
}
