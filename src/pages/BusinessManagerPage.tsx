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
import GatewayErrorWidget from "../components/widgets/GatewayErrorWidget";
import CommanderOfflineWidget from "../components/widgets/CommanderOfflineWidget";
import CloudConnectedWidget from "../components/widgets/CloudConnectedWidget";
import AlarmSummaryWidget from "../components/widgets/AlarmSummaryWidget";
import DoorOpenedAlarmsWidget from "../components/widgets/DoorOpenedAlarmsWidget";
import offlineIcon from "../assets/OfflineIcon.svg";
import warningIcon from "../assets/WarningIcon.svg";
import Beacon, { type BeaconOffset } from "../components/Beacon";
import RGL, { WidthProvider, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  createBusinessManagerTour,
  createBusinessManagerBeaconTour,
} from "../utils/businessManagerTour";

const ReactGridLayout = WidthProvider(RGL);

// Grid configuration constants
const GRID_COLS = 12; // Increased from 6 for finer horizontal positioning
const GRID_ROW_HEIGHT = 40; // Halved from 80px for finer vertical positioning
const GRID_MARGIN: [number, number] = [16, 16];
const LAYOUT_COOKIE_NAME = "cv_widget_layout";
const LAYOUT_STORAGE_KEY = "cv_widget_layout_json";
const LAYOUT_VERSION = "v2";
const LAYOUT_VERSION_KEY = "cv_widget_layout_version";
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days
const ENABLE_TOUR = false;
const LAYOUT_SYNC_EVENT = "cv_widget_layout_updated";
const BEACON_OFFSETS_KEY = "cv_beacon_offsets";

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

const WIDGET_DIMENSIONS: Record<string, Partial<Pick<Layout, "w" | "h">>> = {
  "fan-life": { h: 8, w: 6 }, // 6/12 = 50% width (same as 3/6), 8x40px = 320px height (same as 4x80px)
  energy: { h: 8, w: 6 }, // Scaled to maintain visual size with new grid
  element: { h: 8, w: 6 }, // Scaled to maintain visual size with new grid
  cloud: { h: 8, w: 6 }, // Scaled to maintain visual size with new grid
  alarms: { w: 2, h: 2 }, // 2/12 = 16.7% width (same as 1/6), 2x40px = 80px height (same as 1x80px)
  gateway: { h: 4, w: 4 }, // 4/12 = 33.3% width (same as 2/6), 4x40px = 160px height (same as 2x80px)
  commander: { h: 4, w: 4 },
  "alarm-summary": { h: 10, w: 12 }, // 4/12 = 33.3% width (same as 2/6), 4x40px = 160px height (same as 2x80px)
  "energy-cost": { h: 6, w: 12 },
  "door-opened": { h: 6, w: 12 },
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
    title: "Central",
    subtitle: "3 Stores",
    alarms: 2,
    notices: 3,
  },
  {
    id: "gulf",
    title: "North",
    subtitle: "2 Stores",
    alarms: 1368,
    notices: 135,
  },
  {
    id: "tx",
    title: "South",
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
}: {
  onBack?: () => void;
  onOpen?: (id: string) => void;
  rows?: BURow[];
  heading?: string;
}) {
  const buRows = rows ?? DEFAULT_BU_ROWS;
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
      { id: "fan-life", element: <FanLifeWidget /> },
      { id: "energy", element: <EnergyUsageWidget /> },
      { id: "energy-cost", element: <EnergyCostWidget /> },
      { id: "element", element: <ElementLifeWidget /> },
      { id: "alarms", element: <AlarmsWidget value={totalActiveAlarms} /> },
      { id: "gateway", element: <GatewayErrorWidget /> },
      {
        id: "commander",
        element: <CommanderOfflineWidget value={totalOfflineDevices} />,
      },
      { id: "cloud", element: <CloudConnectedWidget /> },
      { id: "alarm-summary", element: <AlarmSummaryWidget /> },
      { id: "door-opened", element: <DoorOpenedAlarmsWidget /> },
    ],
    [totalActiveAlarms, totalOfflineDevices],
  );

  const [isEditing, setIsEditing] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isWidgetsScrolled, setIsWidgetsScrolled] = React.useState(false);
  const [isBeaconDevMode, setIsBeaconDevMode] = React.useState(false);
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


  // Tour initialization
  const tour = React.useRef(createBusinessManagerTour());
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
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setIsBeaconDevMode((prev) => !prev);
      }
      if (event.ctrlKey && event.shiftKey && event.key === "0") {
        event.preventDefault();
        setBeaconOffsets({});
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // Auto-start tour every time (kiosk demo mode)
  React.useEffect(() => {
    if (!ENABLE_TOUR) return;
    const timer = setTimeout(() => {
      tour.current.drive();
    }, 1500); // Delay to let the page load completely

    return () => clearTimeout(timer);
  }, []);

  // Manual tour start function

  const DEFAULT_LAYOUT: Layout[] = React.useMemo(
    () => [
      { i: "fan-life", x: 0, y: 0, w: 6, h: 5 },
      { i: "energy", x: 4, y: 11, w: 8, h: 4 },
      { i: "element", x: 0, y: 11, w: 4, h: 7 },
      { i: "alarms", x: 4, y: 15, w: 4, h: 3 },
      { i: "gateway", x: 6, y: 0, w: 6, h: 5 },
      { i: "commander", x: 8, y: 15, w: 4, h: 7 },
      { i: "cloud", x: 0, y: 18, w: 8, h: 4 },
      { i: "alarm-summary", x: 0, y: 22, w: 12, h: 6 },
      { i: "door-opened", x: 0, y: 5, w: 12, h: 6 },
      { i: "energy-cost", x: 0, y: 28, w: 12, h: 6 },
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

        const width = clampNumber(incoming.w, 1, GRID_COLS) ?? base.w;
        const height =
          clampNumber(incoming.h, 1, Number.MAX_SAFE_INTEGER) ?? base.h;
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
    setWidgetLayout(next);
    saveLayoutCookie(next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(LAYOUT_SYNC_EVENT, { detail: next }),
      );
    }
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

  const dynamicBottomPadding = React.useMemo(() => {
    const maxRow = widgetLayout.reduce((max, item) => {
      const bottom = (item.y ?? 0) + (item.h ?? 0);
      return Math.max(max, bottom);
    }, 0);
    const gridHeight =
      maxRow * GRID_ROW_HEIGHT + Math.max(0, maxRow - 1) * GRID_MARGIN[1];
    return Math.max(220, Math.ceil(gridHeight * 0.5));
  }, [widgetLayout]);

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
          Good morning, Düsseldorf
        </div>
        <div className="app-left">
          <Container maxWidth="lg" sx={{ mt: 2 }}>
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
                      className={`bu-row-text ${index === 0 ? "beacon-host beacon-host--bu-text region-alerts-text-target" : ""}`}
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

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      className={index === 0 ? "region-alerts-stack-target" : undefined}
                    >
                      <div
                        className={`icon-border ${r.id === "east" ? "offline-beacon-target beacon-host beacon-host--icon" : ""}`}
                      >
                        <img
                          src={offlineIcon}
                          alt=""
                          className="offline-icon"
                          aria-hidden
                        />
                        <span className="icon-separator" aria-hidden />
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                          }}
                        >
                          {r.alarms ?? 0}
                        </Typography>
                        {r.id === "east" ? (
                          <Beacon
                            label="Offline count tour"
                            beaconId="offline"
                            onClick={() => startTourFrom(4)}
                            devMode={isBeaconDevMode}
                            offset={beaconOffsets.offline}
                            onOffsetChange={(next) => handleBeaconOffsetChange("offline", next)}
                          />
                        ) : null}
                      </div>
                      <div
                        className={`icon-border ${r.id === "east" ? "alarms-beacon-target beacon-host beacon-host--icon" : ""}`}
                      >
                        <img
                          src={warningIcon}
                          alt=""
                          className="warning-icon"
                          aria-hidden
                        />
                        <span className="icon-separator" aria-hidden />
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                          }}
                        >
                          {r.notices ?? 0}
                        </Typography>
                        {r.id === "east" ? (
                          <Beacon
                            label="Active alarms tour"
                            beaconId="alarms"
                            onClick={() => startTourFrom(5)}
                            devMode={isBeaconDevMode}
                            offset={beaconOffsets.alarms}
                            onOffsetChange={(next) => handleBeaconOffsetChange("alarms", next)}
                          />
                        ) : null}
                      </div>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Container>
        </div>
        
        <div className="app-right">
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
            <Box
              sx={{
                flex: 1,
                padding: "8px 12px 48px 0",
                minHeight: "140vh",
              }}
            >
              <ReactGridLayout
                className={`widgets-grid ${isEditing ? "widgets-grid--editing" : ""}`}
                layout={widgetLayout}
                cols={GRID_COLS}
                rowHeight={GRID_ROW_HEIGHT}
                margin={GRID_MARGIN}
                onLayoutChange={handleLayoutChange}
                onDragStop={handleLayoutChange}
                onResizeStop={handleLayoutChange}
                isDraggable={isEditing}
                isResizable={isEditing}
                draggableHandle=".widget-drag-handle"
                compactType={null}
                measureBeforeMount={false}
                autoSize
              >
                {widgetComponents.map((widget) => (
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
