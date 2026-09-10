import React from "react";
import { Search } from "lucide-react";
import connectLogo from "../assets/connect_flexeserve.svg";
import connectLogoInversed from "../assets/connect_flexeserve_inversed.svg";
import viewAllBUsLogo from "../assets/ViewAllBUsLogo.svg";
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
import { GridStack, type GridStackOptions, type GridStackWidget } from "gridstack/dist/react";
import "gridstack/dist/gridstack.css";
import { createBusinessManagerBeaconTour } from "../utils/businessManagerTour";
import {
  GRID_COLS,
  GRID_ROW_HEIGHT,
  GRID_MARGIN,
  WIDGET_SIZE_SMALL,
  WIDGET_SIZE_LARGE,
} from "../lib/widgetSizing";
import { WidgetSizeContext, type WidgetSize } from "../components/widgets/WidgetSizeContext";

// Own layout-item shape (react-grid-layout's `Layout` type is gone) — kept
// deliberately small and grid-library-agnostic, with `i` as the item key
// (matching the persisted cookie/localStorage format from before, so
// existing saved layouts keep working). Mapped to/from GridStack's own
// `id`-keyed shape only at the two boundary points (building `children` for
// <GridStack>, and reading nodes back from its onChange). No min/max/free
// resize fields any more — every widget's w/h is always exactly
// WIDGET_SIZE_SMALL or WIDGET_SIZE_LARGE, switched via a toggle button
// rather than a drag handle (see WidgetSlot below), so there's no range to
// express.
type LayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const widgetSizeOf = (item: Pick<LayoutItem, "w" | "h">): WidgetSize =>
  item.h > item.w ? "large" : "small";

// One React Context supplies the current widget elements (which carry
// scope-specific props like storeIds that change as the user drills in) to
// a single stable WidgetSlot component, which is what GridStack's
// "component mode" actually instantiates per grid item. This indirection
// exists because GridStack's `components` map needs a fixed component type
// per widget kind, not a pre-built element with its own already-bound props.
const WidgetElementsContext = React.createContext<Map<string, React.ReactElement> | null>(
  null,
);

// Typed as Record<string, unknown> (rather than the actual props shape)
// because GridStack's ComponentMap requires every registered component to
// accept arbitrary widget props.
function WidgetSlot(props: Record<string, unknown>) {
  const widgetId = typeof props.widgetId === "string" ? props.widgetId : undefined;
  const isEditing = props.isEditing === true;
  const size: WidgetSize = props.size === "large" ? "large" : "small";
  const onToggleSize =
    typeof props.onToggleSize === "function"
      ? (props.onToggleSize as (id: string) => void)
      : undefined;
  const elements = React.useContext(WidgetElementsContext);
  const element = widgetId ? elements?.get(widgetId) : undefined;
  if (!element || !widgetId) return null;
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-widget border bg-surface shadow-widget dark:shadow-widget-dark ${
        isEditing ? "cursor-move border-dashed border-accent" : "border-line"
      }`}
    >
      {isEditing && (
        <>
          {/* keep the class name — gridstack's `handle` selector targets it */}
          <span className="widget-drag-handle absolute right-2 top-2 z-10 flex size-5 cursor-move items-center justify-center rounded bg-accent/90 text-xs font-bold text-white">
            ≡
          </span>
          <button
            type="button"
            onClick={() => onToggleSize?.(widgetId)}
            aria-label={size === "large" ? "Shrink widget" : "Expand widget"}
            title={size === "large" ? "Shrink" : "Expand"}
            className="absolute left-2 top-2 z-10 flex size-5 items-center justify-center rounded bg-info/90 text-xs text-white hover:bg-info"
          >
            {size === "large" ? "⤡" : "⤢"}
          </button>
        </>
      )}
      <WidgetSizeContext.Provider value={size}>{element}</WidgetSizeContext.Provider>
    </div>
  );
}

const GRID_COMPONENTS = { WidgetSlot };

const LAYOUT_COOKIE_NAME = "cv_widget_layout";
const LAYOUT_STORAGE_KEY = "cv_widget_layout_json";
// v4: dropped free-resize (minW/minH/maxW/maxH) in favor of two fixed sizes
// — bumped so pre-v4 saved layouts (which may have any w/h) reset to
// DEFAULT_LAYOUT rather than trying to reinterpret arbitrary old dimensions.
const LAYOUT_VERSION = "v4";
const LAYOUT_VERSION_KEY = "cv_widget_layout_version";
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days
const LAYOUT_SYNC_EVENT = "cv_widget_layout_updated";
const BEACON_OFFSETS_KEY = "cv_beacon_offsets";
const BEACONS_HIDDEN_KEY = "cv_beacons_hidden";
const BEACONS_VISIBILITY_EVENT = "cv_beacons_visibility_updated";
const HEADER_BRAND_KEY = "cv_header_brand";
const HEADER_BRAND_EVENT = "cv_header_brand_updated";
const HIDDEN_WIDGETS_KEY = "cv_hidden_widgets";
const SHOW_DEV_MENU = false;

const clampNumber = (value: number | undefined, min: number, max: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.min(Math.max(value, min), max);
};

const loadLayoutCookie = (): LayoutItem[] | null => {
  if (typeof document === "undefined") return null;
  if (typeof window !== "undefined") {
    const storedVersion = window.localStorage.getItem(LAYOUT_VERSION_KEY);
    if (storedVersion === LAYOUT_VERSION) {
      const storedLayout = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (storedLayout) {
        try {
          const parsed = JSON.parse(storedLayout);
          if (Array.isArray(parsed)) return parsed as LayoutItem[];
        } catch {
          // Ignore malformed localStorage
        }
      }
    } else {
      window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
    }
  }
  const cookies = document.cookie?.split(";").map((c) => c.trim()) ?? [];
  const target = cookies.find((c) => c.startsWith(`${LAYOUT_COOKIE_NAME}=`));
  if (!target) return null;
  try {
    const value = target.substring(LAYOUT_COOKIE_NAME.length + 1);
    const parsed = JSON.parse(decodeURIComponent(value));
    if (Array.isArray(parsed)) {
      return parsed as LayoutItem[];
    }
  } catch {
    // Ignore malformed cookies
  }
  return null;
};

const saveLayoutCookie = (layout: LayoutItem[]) => {
  if (typeof document === "undefined") return;
  try {
    const encoded = encodeURIComponent(JSON.stringify(layout));
    document.cookie = `${LAYOUT_COOKIE_NAME}=${encoded}; max-age=${LAYOUT_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAYOUT_VERSION_KEY, LAYOUT_VERSION);
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    }
  } catch {
    // Ignore storage failures
  }
};

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
        element: <EnergyUsageWidget storeIds={scopeStoreIds} />,
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
        element: <AlarmsWidget value={totalActiveAlarms} />,
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
        element: <StoresOnlineWidget storeIds={scopeStoreIds} />,
      },
      {
        id: "temp-alarms",
        label: "Temperature Alarms",
        element: <TemperatureAlarmsWidget storeIds={scopeStoreIds} />,
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

  const DEFAULT_LAYOUT: LayoutItem[] = React.useMemo(
    () => [
      // Two fixed sizes only: SMALL (w:10 h:10, a square tile — half the
      // 20-column grid wide) and LARGE (w:10 h:20, twice as tall as it is
      // wide — same width as SMALL, so toggling a widget's size never
      // reflows its neighbors horizontally). Packed two per row (x:0/x:10)
      // like a masonry layout — each column's own running y position, not a
      // fixed row grid, so a LARGE widget in one column doesn't force gaps
      // in the other. Every widget defaults to SMALL except Fan Life, whose
      // progress-bar list needs the extra room; everything else is one
      // toggle-button click away from LARGE.
      { i: "fan-life", x: 0, y: 0, ...WIDGET_SIZE_LARGE },
      { i: "door-opened", x: 0, y: 20, ...WIDGET_SIZE_SMALL },
      { i: "element", x: 0, y: 30, ...WIDGET_SIZE_SMALL },
      { i: "alarm-summary", x: 0, y: 40, ...WIDGET_SIZE_SMALL },
      { i: "energy-widget", x: 0, y: 50, ...WIDGET_SIZE_SMALL },
      { i: "stores-online", x: 0, y: 60, ...WIDGET_SIZE_SMALL },
      { i: "offline-devices", x: 10, y: 0, ...WIDGET_SIZE_SMALL },
      { i: "alarms", x: 10, y: 10, ...WIDGET_SIZE_SMALL },
      { i: "energy", x: 10, y: 20, ...WIDGET_SIZE_SMALL },
      { i: "cloud", x: 10, y: 30, ...WIDGET_SIZE_SMALL },
      { i: "energy-cost", x: 10, y: 40, ...WIDGET_SIZE_SMALL },
      { i: "temp-alarms", x: 10, y: 50, ...WIDGET_SIZE_SMALL },
    ],
    [],
  );


  const mergeLayoutWithDefaults = React.useCallback(
    (persisted?: LayoutItem[] | null) => {
      if (!persisted?.length) return DEFAULT_LAYOUT;
      const persistedMap = new Map<string, LayoutItem>();
      persisted.forEach((item) => {
        if (item && typeof item.i === "string") {
          persistedMap.set(item.i, item);
        }
      });

      return DEFAULT_LAYOUT.map((base) => {
        const incoming = persistedMap.get(base.i);
        if (!incoming) return base;

        // Snap to whichever of the two valid sizes the persisted height is
        // closer to — defensive against any stale/malformed saved value,
        // since there's no longer a continuous range to clamp into.
        const incomingHeight = typeof incoming.h === "number" ? incoming.h : base.h;
        const { w: width, h: height } =
          Math.abs(incomingHeight - WIDGET_SIZE_LARGE.h) <
          Math.abs(incomingHeight - WIDGET_SIZE_SMALL.h)
            ? WIDGET_SIZE_LARGE
            : WIDGET_SIZE_SMALL;
        const maxX = Math.max(GRID_COLS - width, 0);
        const x = clampNumber(incoming.x, 0, maxX) ?? base.x;
        const y = clampNumber(incoming.y, 0, Number.MAX_SAFE_INTEGER) ?? base.y;

        return {
          ...base,
          ...incoming,
          w: width,
          h: height,
          x,
          y,
        };
      });
    },
    [DEFAULT_LAYOUT],
  );

  const [widgetLayout, setWidgetLayout] = React.useState<LayoutItem[]>(() =>
    mergeLayoutWithDefaults(loadLayoutCookie()),
  );

  React.useEffect(() => {
    setWidgetLayout((prev) => mergeLayoutWithDefaults(prev));
  }, [mergeLayoutWithDefaults]);

  // GridStack's onChange fires with the *changed* nodes only (its own
  // id/x/y/w/h shape), not the full layout — merge by id into the full
  // widgetLayout rather than replacing it, or hidden widgets would lose
  // their saved position/size.
  const handleGridChange = React.useCallback(
    (_event: Event, nodes: { id?: string; x?: number; y?: number; w?: number; h?: number }[]) => {
      if (!nodes?.length) return;
      setWidgetLayout((prev) => {
        const changedById = new Map(
          nodes
            .filter((node): node is typeof node & { id: string } => typeof node.id === "string")
            .map((node) => [node.id, node]),
        );
        const merged = prev.map((item) => {
          const changed = changedById.get(item.i);
          if (!changed) return item;
          return {
            ...item,
            x: changed.x ?? item.x,
            y: changed.y ?? item.y,
            w: changed.w ?? item.w,
            h: changed.h ?? item.h,
          };
        });
        saveLayoutCookie(merged);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(LAYOUT_SYNC_EVENT, { detail: merged }));
        }
        return merged;
      });
    },
    [],
  );

  // Flips one widget between SMALL and LARGE. Doesn't call GridStack's own
  // API directly — updating widgetLayout is enough, since the <GridStack>
  // wrapper reactively diffs `options` each render and calls
  // grid.updateOptions() itself (see gridStackOptions below), the same path
  // hide/show and persistence already go through.
  const handleToggleWidgetSize = React.useCallback((id: string) => {
    setWidgetLayout((prev) => {
      const merged = prev.map((item) => {
        if (item.i !== id) return item;
        const next = widgetSizeOf(item) === "large" ? WIDGET_SIZE_SMALL : WIDGET_SIZE_LARGE;
        return { ...item, w: next.w, h: next.h };
      });
      saveLayoutCookie(merged);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(LAYOUT_SYNC_EVENT, { detail: merged }));
      }
      return merged;
    });
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let lastSerialized = JSON.stringify(widgetLayout);

    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<LayoutItem[]>;
      const next = customEvent.detail;
      if (!Array.isArray(next)) return;
      const nextSerialized = JSON.stringify(next);
      if (nextSerialized === lastSerialized) return;
      lastSerialized = nextSerialized;
      setWidgetLayout(next);
    };

    window.addEventListener(LAYOUT_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(LAYOUT_SYNC_EVENT, handleSync);
  }, [widgetLayout]);

  const visibleWidgetLayout = React.useMemo(
    () => widgetLayout.filter((item) => !hiddenWidgetIds.includes(item.i)),
    [widgetLayout, hiddenWidgetIds],
  );

  const dynamicBottomPadding = React.useMemo(() => {
    const maxRow = visibleWidgetLayout.reduce((max, item) => {
      const bottom = (item.y ?? 0) + (item.h ?? 0);
      return Math.max(max, bottom);
    }, 0);
    const gridHeight =
      maxRow * GRID_ROW_HEIGHT + Math.max(0, maxRow - 1) * GRID_MARGIN[1];
    // Small headroom so a widget can be dragged past the last row while
    // editing — not a multiple of the whole grid's height.
    return Math.max(100, Math.ceil(gridHeight * 0.08) + 40);
  }, [visibleWidgetLayout]);

  // Feeds WidgetSlot via WidgetElementsContext — see the comment on that
  // context above for why GridStack's component-mode needs this indirection
  // instead of just handing it pre-built elements directly.
  const widgetElementsMap = React.useMemo(
    () => new Map(widgetComponents.map((widget) => [widget.id, widget.element])),
    [widgetComponents],
  );

  const gridStackOptions: GridStackOptions = React.useMemo(
    () => ({
      column: GRID_COLS,
      cellHeight: GRID_ROW_HEIGHT,
      margin: GRID_MARGIN[0],
      float: false,
      staticGrid: !isEditing,
      handle: ".widget-drag-handle",
      children: visibleWidgetLayout.map(
        (item): GridStackWidget => ({
          id: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          // Size is fixed to one of two presets, switched only via the
          // toggle button — not a drag handle — so GridStack's own resize
          // interaction is disabled entirely.
          noResize: true,
          component: "WidgetSlot",
          props: {
            widgetId: item.i,
            isEditing,
            size: widgetSizeOf(item),
            onToggleSize: handleToggleWidgetSize,
          },
        }),
      ),
    }),
    [visibleWidgetLayout, isEditing, handleToggleWidgetSize],
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
          <div className="w-full basis-full px-6 pt-4 text-left text-4xl font-extrabold text-accent sm:px-12 sm:text-[45px]">
            <TypewriterText text="Good Morning, London" />
          </div>

          <div className="flex min-w-0 basis-[30%] flex-col items-center max-lg:basis-auto lg:animate-shrink-left-panel">
            <div className="my-4 flex w-full items-center px-6 sm:px-12">
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
              <div className="relative mb-6 flex items-center gap-8">
                <img
                  src={viewAllBUsLogo}
                  alt="View All Markets"
                  className="h-16 dark:brightness-110 dark:invert"
                />
                <span className="text-lg font-semibold text-ink">
                  {heading ?? "View All Markets"}
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
              style={{
                maxHeight: "calc(100vh - 120px)",
                paddingBottom: `${dynamicBottomPadding}px`,
              }}
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
              <div className="flex-1 pb-12 pr-3 pt-2">
                <WidgetElementsContext.Provider value={widgetElementsMap}>
                  <GridStack
                    options={gridStackOptions}
                    components={GRID_COMPONENTS}
                    className={`widgets-grid ${isEditing ? "widgets-grid--editing" : ""}`}
                    onChange={handleGridChange}
                  />
                </WidgetElementsContext.Provider>
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
