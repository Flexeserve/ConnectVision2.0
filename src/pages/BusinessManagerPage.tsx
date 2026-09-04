import React from "react";
import {
  Container,
  Box,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  Alert,
} from "@mui/material";
import connectLogo from "../assets/connect_flexeserve.svg";
import connectLogoInversed from "../assets/connect_flexeserve_inversed.svg";
import viewAllBUsLogo from "../assets/ViewAllBUsLogo.svg";
import Header from "../components/Header";
import "./BusinessManagerPage.css";
import "../styles/tour.css";
import SearchIcon from "@mui/icons-material/Search";
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
import RGL, { WidthProvider, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { createBusinessManagerBeaconTour } from "../utils/businessManagerTour";

const ReactGridLayout = WidthProvider(RGL);

// Grid configuration constants
const GRID_COLS = 12; // Increased from 6 for finer horizontal positioning
const GRID_ROW_HEIGHT = 20; // Halved from 40px for tighter widget grid sizing
const GRID_MARGIN: [number, number] = [8, 8];
const LAYOUT_COOKIE_NAME = "cv_widget_layout";
const LAYOUT_STORAGE_KEY = "cv_widget_layout_json";
const LAYOUT_VERSION = "v3";
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

const loadLayoutCookie = (): Layout[] | null => {
  if (typeof document === "undefined") return null;
  if (typeof window !== "undefined") {
    const storedVersion = window.localStorage.getItem(LAYOUT_VERSION_KEY);
    if (storedVersion === LAYOUT_VERSION) {
      const storedLayout = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (storedLayout) {
        try {
          const parsed = JSON.parse(storedLayout);
          if (Array.isArray(parsed)) return parsed as Layout[];
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
      return parsed as Layout[];
    }
  } catch {
    // Ignore malformed cookies
  }
  return null;
};

const saveLayoutCookie = (layout: Layout[]) => {
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
      { id: "fan-life", label: "Fan Life", element: <FanLifeWidget storeIds={scopeStoreIds} /> },
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

  const visibleWidgetComponents = React.useMemo(
    () => widgetComponents.filter((widget) => !hiddenWidgetIds.includes(widget.id)),
    [widgetComponents, hiddenWidgetIds],
  );

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

  const DEFAULT_LAYOUT: Layout[] = React.useMemo(
    () => [
      // minW/minH are deliberately low: every chart/gauge widget has its own
      // compact-fallback view (a plain number) designed to hold up at small
      // sizes, so it's fine to let them shrink into that rather than locking
      // height at the default. Offline Devices is the one exception — it has
      // no such fallback and visibly overlaps below h6, verified empirically.
      // maxW/maxH still cap how far each can grow so nothing scales unbounded.
      { i: "fan-life", x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3, maxW: 8, maxH: 8 },
      { i: "offline-devices", x: 6, y: 0, w: 6, h: 6, minW: 3, minH: 6, maxW: 8, maxH: 9 },
      { i: "door-opened", x: 0, y: 6, w: 12, h: 8, minW: 4, minH: 4, maxW: 12, maxH: 11 },
      { i: "element", x: 0, y: 13, w: 6, h: 4, minW: 3, minH: 3, maxW: 8, maxH: 8 },
      { i: "alarms", x: 6, y: 13, w: 6, h: 4, minW: 3, minH: 3, maxW: 8, maxH: 8 },
      { i: "energy", x: 0, y: 17, w: 6, h: 8, minW: 3, minH: 4, maxW: 9, maxH: 11 },
      { i: "cloud", x: 6, y: 17, w: 6, h: 8, minW: 3, minH: 4, maxW: 9, maxH: 11 },
      { i: "alarm-summary", x: 0, y: 25, w: 12, h: 8, minW: 4, minH: 4, maxW: 12, maxH: 13 },
      { i: "energy-cost", x: 0, y: 33, w: 12, h: 9, minW: 4, minH: 4, maxW: 12, maxH: 14 },
      { i: "energy-widget", x: 0, y: 42, w: 12, h: 7, minW: 4, minH: 4, maxW: 12, maxH: 11 },
      { i: "stores-online", x: 0, y: 49, w: 6, h: 8, minW: 4, minH: 4, maxW: 8, maxH: 12 },
      { i: "temp-alarms", x: 6, y: 49, w: 5, h: 8, minW: 4, minH: 4, maxW: 8, maxH: 13 },
    ],
    [],
  );


  const mergeLayoutWithDefaults = React.useCallback(
    (persisted?: Layout[] | null) => {
      if (!persisted?.length) return DEFAULT_LAYOUT;
      const persistedMap = new Map<string, Layout>();
      persisted.forEach((item) => {
        if (item && typeof item.i === "string") {
          persistedMap.set(item.i, item);
        }
      });

      return DEFAULT_LAYOUT.map((base) => {
        const incoming = persistedMap.get(base.i);
        if (!incoming) return base;

        const width =
          clampNumber(incoming.w, base.minW ?? 1, base.maxW ?? GRID_COLS) ?? base.w;
        const height =
          clampNumber(incoming.h, base.minH ?? 1, base.maxH ?? Number.MAX_SAFE_INTEGER) ??
          base.h;
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

  const [widgetLayout, setWidgetLayout] = React.useState<Layout[]>(() =>
    mergeLayoutWithDefaults(loadLayoutCookie()),
  );

  React.useEffect(() => {
    setWidgetLayout((prev) => mergeLayoutWithDefaults(prev));
  }, [mergeLayoutWithDefaults]);

  const handleLayoutChange = React.useCallback((next: Layout[]) => {
    // `next` only covers currently-visible widgets (RGL only knows about the
    // children it's given), so merge into the full layout rather than
    // replacing it, or hidden widgets would lose their saved position/size.
    setWidgetLayout((prev) => {
      const nextById = new Map(next.map((item) => [item.i, item]));
      const merged = prev.map((item) => nextById.get(item.i) ?? item);
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
      const customEvent = event as CustomEvent<Layout[]>;
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
    <div className="business-manager-page">
      <Header onBack={onBack} title="Manager View" />
      <div className="beacon-host beacon-host--app">
      <div className="app-container bm-container-beacon">
        <div className="greetings">
          <TypewriterText text="Good Morning, London" />
        </div>
        <div className="app-left">
          <div className="greetings-search">
            <Box className="search-beacon-target beacon-host beacon-host--search">
              <Beacon
                label="Search tour"
                beaconId="search"
                onClick={() => startTourFrom(6)}
                devMode={isBeaconDevMode}
                offset={beaconOffsets.search}
                onOffsetChange={(next) => handleBeaconOffsetChange("search", next)}
              />
              <TextField
                variant="outlined"
                size="small"
                placeholder="Write to start search"
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      sx={{
                        m: 0,
                        height: "100%",
                        alignSelf: "stretch",
                        display: "flex",
                        alignItems: "center",
                        color: "#333333",
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Search"
                        className="search-button"
                      >
                        <SearchIcon fontSize="small" sx={{ color: "#fff" }} />
                      </button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: "100%", sm: 360, md: 460 },
                  maxWidth: { xs: "100%", sm: 420, md: 500 },
                  "& .MuiInputBase-root": {
                    color: "var(--text-primary)",
                    backgroundColor: "var(--panel-bg)",
                    paddingRight: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "var(--text-muted)",
                    opacity: 1,
                  },
                  "& .MuiOutlinedInput-root": {
                    paddingRight: 0,
                    height: 36,
                  },
                  "& .MuiOutlinedInput-input": {
                    paddingTop: 0,
                    paddingBottom: 0,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                  },
                  "& .MuiInputAdornment-positionEnd": {
                    marginRight: 0,
                    height: "100%",
                    alignSelf: "stretch",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--border-strong)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--text-primary)",
                  },
                }}
              />
            </Box>
          </div>
          <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Box key={levelKey ?? heading ?? "root"} className="bu-panel-transition">
            <Box
              className="beacon-host beacon-host--header"
              sx={{ display: "flex", alignItems: "center", gap: 4, mb: 3 }}
            >

              <Box
                component="img"
                src={viewAllBUsLogo}
                alt="View All Markets"
                className="view-all-logo"
                sx={{ height: 64 }}
              />
              <Typography
                sx={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {heading ?? "View All Markets"}
              </Typography>
            </Box>
            <Box className="bu-list burows-beacon-target beacon-host">
              <Beacon
                label="Business units tour"
                beaconId="bu-list"
                onClick={() => startTourFrom(3)}
                devMode={isBeaconDevMode}
                offset={beaconOffsets["bu-list"]}
                onOffsetChange={(next) => handleBeaconOffsetChange("bu-list", next)}
              />
              {buRows.map((r, index) => (
                <Box
                  key={r.id}
                  className="bu-row"
                  sx={{ borderLeft: "4px solid var(--text-primary)" }}
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
                  <Box className="bu-row-content">
                    <Box
                      className={`bu-row-text ${index === 0 ? "beacon-host beacon-host--bu-text" : ""}`}
                    >
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
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 400,
                          color: "var(--text-primary)",
                        }}
                      >
                        {r.title}
                      </Typography>
                      {r.subtitle ? (
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 500,
                            color: "var(--text-muted)",
                          }}
                        >
                          {r.subtitle}
                        </Typography>
                      ) : null}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <div className="icon-border">
                        <img
                          src={onlineStatusIcon}
                          alt="Online status"
                          className="offline-icon"
                        />
                      </div>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
            </Box>
          </Container>
        </div>
        
        <div className="app-right">
          <Box
            className="widgets-panel widgets-scroll widgets-beacon-target beacon-host"
            ref={widgetsPanelRef}
            onScroll={(event) => {
              const target = event.currentTarget;
              setIsWidgetsScrolled(target.scrollTop > 8);
            }}
            sx={{
              borderLeft: "1px solid var(--border-color)",
                height: "auto",
                maxHeight: "calc(100vh - 120px)",
              padding: "20px 16px 48px",
              paddingRight: "40px",
              paddingBottom: `${dynamicBottomPadding}px`,
              color: "var(--text-muted)",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%",
                overflowY: "auto",
              background: "var(--app-bg)",
              opacity: 0,
              animation: "fadeWidgets 0.9s ease forwards 0.15s",
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
              className={`dashboard-edit-fab ${
                isWidgetsScrolled ? "is-visible" : ""
              }`}
            >
              <button
                type="button"
                className="dashboard-edit-button dashboard-edit-button--fab"
                aria-label="Edit dashboard layout"
                aria-pressed={isEditing}
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? "✓" : "✎"}
              </button>
            </div>
            <Alert severity="info" variant="outlined" sx={{ mb: 2, color: "var(--text-primary)" }}>
              Data shown here is not sourced from any connected devices.
              Demonstration purposes only.
            </Alert>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                color: "var(--text-primary)",
                fontFamily: '"Inter", sans-serif',
                fontSize: "0.95rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              <span className="dashboard-title">Overview dashboard</span>
              <span className="dashboard-divider" aria-hidden />
              <button
                type="button"
                className="dashboard-edit-button"
                aria-label="Edit dashboard layout"
                aria-pressed={isEditing}
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? "✓" : "✎"}
              </button>
            </Box>
            {isEditing && (
              <Box className="widget-visibility-panel" role="group" aria-label="Show or hide widgets">
                <span className="widget-visibility-panel-label">Widgets</span>
                {widgetComponents.map((widget) => {
                  const isHidden = hiddenWidgetIds.includes(widget.id);
                  return (
                    <button
                      key={widget.id}
                      type="button"
                      className={`widget-visibility-chip ${isHidden ? "widget-visibility-chip--hidden" : ""}`}
                      aria-pressed={!isHidden}
                      onClick={() => toggleWidgetVisibility(widget.id)}
                    >
                      <span className="widget-visibility-chip-dot" aria-hidden />
                      {widget.label}
                    </button>
                  );
                })}
              </Box>
            )}
            <Box
              sx={{
                flex: 1,
                padding: "8px 12px 48px 0",
              }}
            >
              <ReactGridLayout
                className={`widgets-grid ${isEditing ? "widgets-grid--editing" : ""}`}
                layout={visibleWidgetLayout}
                cols={GRID_COLS}
                rowHeight={GRID_ROW_HEIGHT}
                margin={GRID_MARGIN}
                onLayoutChange={handleLayoutChange}
                onDragStop={handleLayoutChange}
                onResizeStop={handleLayoutChange}
                isDraggable={isEditing}
                isResizable={isEditing}
                draggableHandle=".widget-drag-handle"
                compactType="vertical"
                measureBeforeMount={false}
                autoSize
              >
                {visibleWidgetComponents.map((widget) => (
                  <div
                    key={widget.id}
                    className={`widget-cell ${isEditing ? "widget-cell--editing" : ""}`}
                  >
                    {isEditing && <span className="widget-drag-handle" />}
                    {widget.element}
                  </div>
                ))}
              </ReactGridLayout>
            </Box>
          </Box>
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
      <footer className="page-footer">
        <span>© {new Date().getFullYear()} Flexeserve Connect</span>
        <img
          src={isDarkMode ? connectLogoInversed : connectLogo}
          alt="Connect by Flexeserve"
          className="footer-logo"
        />
      </footer>
    </div>
  );
}
