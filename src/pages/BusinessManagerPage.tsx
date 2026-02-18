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
import ElementLifeWidget from "../components/widgets/ElementLifeWidget";
import AlarmsWidget from "../components/widgets/AlarmsWidget";
import GatewayErrorWidget from "../components/widgets/GatewayErrorWidget";
import CommanderOfflineWidget from "../components/widgets/CommanderOfflineWidget";
import CloudConnectedWidget from "../components/widgets/CloudConnectedWidget";
import AlarmSummaryWidget from "../components/widgets/AlarmSummaryWidget";
import DoorOpenedAlarmsWidget from "../components/widgets/DoorOpenedAlarmsWidget";
import offlineIcon from "../assets/OfflineIcon.svg";
import warningIcon from "../assets/WarningIcon.svg";
import RGL, { WidthProvider, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { createBusinessManagerTour } from "../utils/businessManagerTour";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const ReactGridLayout = WidthProvider(RGL);

// Grid configuration constants
const GRID_COLS = 12; // Increased from 6 for finer horizontal positioning
const GRID_ROW_HEIGHT = 40; // Halved from 80px for finer vertical positioning
const GRID_MARGIN: [number, number] = [16, 16];
const LAYOUT_COOKIE_NAME = "cv_widget_layout";
const LAYOUT_VERSION = "v2";
const LAYOUT_VERSION_KEY = "cv_widget_layout_version";
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days
const ENABLE_TOUR = false;

const clampNumber = (value: number | undefined, min: number, max: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.min(Math.max(value, min), max);
};

const loadLayoutCookie = (): Layout[] | null => {
  if (typeof document === "undefined") return null;
  if (typeof window !== "undefined") {
    const storedVersion = window.localStorage.getItem(LAYOUT_VERSION_KEY);
    if (storedVersion !== LAYOUT_VERSION) {
      return null;
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
    }
  } catch {
    // Ignore storage failures
  }
};

const WIDGET_DIMENSIONS: Record<string, Partial<Pick<Layout, "w" | "h">>> = {
  "fan-life": { h: 8, w: 6 },    // 6/12 = 50% width (same as 3/6), 8×40px = 320px height (same as 4×80px)
  energy: { h: 8, w: 6 },        // Scaled to maintain visual size with new grid
  element: { h: 8, w: 6 },       // Scaled to maintain visual size with new grid
  cloud: { h: 8, w: 6 },         // Scaled to maintain visual size with new grid
  alarms: { w: 2, h: 2 },        // 2/12 = 16.7% width (same as 1/6), 2×40px = 80px height (same as 1×80px)
  gateway: { h: 4, w: 4 },       // 4/12 = 33.3% width (same as 2/6), 4×40px = 160px height (same as 2×80px)
  commander: { h: 4, w: 4 },
  "alarm-summary": { h: 10, w: 12 },     // 4/12 = 33.3% width (same as 2/6), 4×40px = 160px height (same as 2×80px)
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
  const [widgetsPanelHeight, setWidgetsPanelHeight] = React.useState<
    number | undefined
  >(undefined);
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
    if (!widgetsPanelRef.current) return;
    const panel = widgetsPanelRef.current;

    const updateHeight = () => {
      const contentHeight = panel.scrollHeight;
      const nextHeight = Math.ceil(contentHeight * 1.3);
      setWidgetsPanelHeight(nextHeight);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(panel);
    return () => resizeObserver.disconnect();
  }, [widgetComponents, isEditing]);

  // Tour initialization
  const tour = React.useRef(createBusinessManagerTour());

  // Auto-start tour every time (kiosk demo mode)
  React.useEffect(() => {
    if (!ENABLE_TOUR) return;
    const timer = setTimeout(() => {
      tour.current.drive();
    }, 1500); // Delay to let the page load completely

    return () => clearTimeout(timer);
  }, []);

  // Manual tour start function
  const startTour = React.useCallback(() => {
    if (!ENABLE_TOUR) return;
    tour.current.drive();
  }, []);

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
  }, []);

  const handleLogLayout = React.useCallback(() => {
    console.log("[WidgetLayout]", JSON.stringify(widgetLayout, null, 2));
  }, [widgetLayout]);

  return (
    <div className="business-manager-page">
      <Header onBack={onBack} title="Manager View" />
      <div className="app-container">
        <div className="greetings">
          Good Morning
        </div>
        <div className="app-left">
          <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 4, mb: 3 }}>
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
            <Box className="bu-list burows-beacon-target">
              {buRows.map((r) => (
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
                    <Box className="bu-row-text">
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
                      <div
                        className={`icon-border ${r.id === "east" ? "offline-beacon-target" : ""}`}
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
                      </div>
                      <div
                        className={`icon-border ${r.id === "east" ? "alarms-beacon-target" : ""}`}
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

            <Box className="search-beacon-target">
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
            className="widgets-panel widgets-scroll widgets-beacon-target"
            ref={widgetsPanelRef}
            onScroll={(event) => {
              const target = event.currentTarget;
              setIsWidgetsScrolled(target.scrollTop > 8);
            }}
            sx={{
              borderLeft: "1px solid var(--border-color)",
              height: widgetsPanelHeight ? `${widgetsPanelHeight}px` : "auto",
              maxHeight: "calc(100vh - 120px)",
              padding: "20px 16px 48px",
              paddingRight: "40px",
              paddingBottom: "280px",
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
                className="dashboard-tour-button"
                aria-label="Start guided tour"
                onClick={startTour}
                style={{
                  border: "1px solid var(--border-strong)",
                  borderRadius: "6px",
                  background: "var(--panel-bg)",
                  color: "var(--text-primary)",
                  width: "32px",
                  height: "32px",
                  fontSize: "0.85rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 150ms ease, color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "var(--text-primary)";
                  e.currentTarget.style.color = "var(--panel-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--panel-bg)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
              >
                <HelpOutlineIcon fontSize="small" />
              </button>
              <button
                type="button"
                className="dashboard-edit-button"
                aria-label="Edit dashboard layout"
                aria-pressed={isEditing}
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? "✓" : "✎"}
              </button>
              <button
                type="button"
                className="dashboard-edit-button"
                aria-label="Log widget layout"
                onClick={handleLogLayout}
              >
                {`{}`}
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
                isDraggable={isEditing}
                isResizable={isEditing}
                draggableHandle=".widget-drag-handle"
                compactType="vertical"
                measureBeforeMount={false}
                autoSize={false}
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
