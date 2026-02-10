import React from "react";
import {
  Container,
  Box,
  Typography,
  Stack,
  TextField,
  InputAdornment,
} from "@mui/material";
import connectLogo from "../assets/connect_flexeserve.svg";
import Header from "../components/Header";
import "./BusinessManagerPage.css";
import SearchIcon from "@mui/icons-material/Search";
import FanLifeWidget from "../components/widgets/FanLifeWidget";
import EnergyUsageWidget from "../components/widgets/EnergyUsageWidget";
import ElementLifeWidget from "../components/widgets/ElementLifeWidget";
import AlarmsWidget from "../components/widgets/AlarmsWidget";
import GatewayErrorWidget from "../components/widgets/GatewayErrorWidget";
import CommanderOfflineWidget from "../components/widgets/CommanderOfflineWidget";
import CloudConnectedWidget from "../components/widgets/CloudConnectedWidget";
import offlineIcon from "../assets/OfflineIcon.svg";
import warningIcon from "../assets/WarningIcon.svg";
import Beacon from "../components/Beacon";
import GuidedBeacon, {
  type GuidedBeaconHandle,
} from "../components/GuidedBeacon";
import RGL, { WidthProvider, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ReactGridLayout = WidthProvider(RGL);
const GRID_COLS = 6;
const LAYOUT_COOKIE_NAME = "cv_widget_layout";
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

const clampNumber = (value: number | undefined, min: number, max: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.min(Math.max(value, min), max);
};

const loadLayoutCookie = (): Layout[] | null => {
  if (typeof document === "undefined") return null;
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
  } catch {
    // Ignore storage failures
  }
};

const WIDGET_DIMENSIONS: Record<string, Partial<Pick<Layout, "w" | "h">>> = {
  "fan-life": { h: 4, w: 3 },
  energy: { h: 4, w: 3 },
  element: { h: 4, w: 3 },
  cloud: { h: 4, w: 3 },
  alarms: { w: 1, h: 1 },
  gateway: { h: 2, w: 2 },
  commander: { h: 2, w: 2 },
};

const BU_ROWS = [
  {
    id: "east",
    title: "BU Eastern Canada",
    subtitle: "5 stores inside",
    alarms: 2,
    notices: 3,
  },
  {
    id: "gulf",
    title: "BU Gulf Coast",
    subtitle: "489 stores inside",
    alarms: 1368,
    notices: 135,
  },
  {
    id: "tx",
    title: "BU Texas",
    subtitle: "489 stores inside",
    alarms: 1564,
    notices: 93,
  },
  {
    id: "west",
    title: "BU Western Canada",
    subtitle: "5 stores inside",
    alarms: 4,
    notices: 4,
  },
];

export default function BusinessManagerPage({
  onBack,
}: {
  onBack?: () => void;
  onOpen?: (id: string) => void;
}) {
  const [showTour, setShowTour] = React.useState(true);
  const searchBeaconRef = React.useRef<GuidedBeaconHandle | null>(null);
  const offlineBeaconRef = React.useRef<GuidedBeaconHandle | null>(null);
  const alarmsBeaconRef = React.useRef<GuidedBeaconHandle | null>(null);
  const rowsBeaconRef = React.useRef<GuidedBeaconHandle | null>(null);
  const widgetsBeaconRef = React.useRef<GuidedBeaconHandle | null>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setShowTour(false), 2400);
    return () => window.clearTimeout(timeout);
  }, []);

  const widgetComponents = React.useMemo(
    () => [
      { id: "fan-life", element: <FanLifeWidget /> },
      { id: "energy", element: <EnergyUsageWidget /> },
      { id: "element", element: <ElementLifeWidget /> },
      { id: "alarms", element: <AlarmsWidget /> },
      { id: "gateway", element: <GatewayErrorWidget /> },
      { id: "commander", element: <CommanderOfflineWidget /> },
      { id: "cloud", element: <CloudConnectedWidget /> },
    ],
    [],
  );

  const [isEditing, setIsEditing] = React.useState(false);
  const DEFAULT_LAYOUT: Layout[] = React.useMemo(() => {
    const columnHeights = Array(GRID_COLS).fill(0);

    return widgetComponents.map((widget) => {
      const { w = 3, h = 3 } = WIDGET_DIMENSIONS[widget.id] ?? {};
      const clampedWidth = Math.min(Math.max(w, 1), GRID_COLS);

      let bestX = 0;
      let minHeight = Number.POSITIVE_INFINITY;

      for (let x = 0; x <= GRID_COLS - clampedWidth; x += 1) {
        const slice = columnHeights.slice(x, x + clampedWidth);
        const sliceHeight = slice.length ? Math.max(...slice) : 0;
        if (sliceHeight < minHeight) {
          minHeight = sliceHeight;
          bestX = x;
        }
      }

      for (let i = bestX; i < bestX + clampedWidth; i += 1) {
        columnHeights[i] = minHeight + h;
      }

      return {
        i: widget.id,
        x: bestX,
        y: minHeight,
        w: clampedWidth,
        h,
      };
    });
  }, [widgetComponents]);

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
        const y =
          clampNumber(incoming.y, 0, Number.MAX_SAFE_INTEGER) ?? base.y;

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

  return (
    <div className="business-manager-page">
      <GuidedBeacon
        ref={searchBeaconRef}
        target=".search-beacon-target"
        content="Search by location name or number."
        delayMs={350}
      />
      <GuidedBeacon
        ref={offlineBeaconRef}
        target=".offline-beacon-target"
        content="Offline count for this BU."
        delayMs={350}
      />
      <GuidedBeacon
        ref={alarmsBeaconRef}
        target=".alarms-beacon-target"
        content="Active alarms for this BU."
        delayMs={350}
      />
      <GuidedBeacon
        ref={rowsBeaconRef}
        target=".burows-beacon-target"
        content="Business units overview."
        delayMs={350}
      />
      <GuidedBeacon
        ref={widgetsBeaconRef}
        target=".widgets-beacon-target"
        content="Operational widgets and analytics."
        delayMs={350}
      />
      <div
        className={`tour-overlay ${showTour ? "is-visible" : "is-hidden"}`}
        role="status"
        aria-live="polite"
      >
        <div className="tour-card">
          Click the pulsing beacons to learn about our platform.
          <div className="tour-beacon">
            <span className="tour-beacon-icon" aria-hidden />
          </div>
        </div>
      </div>
      <Header onBack={onBack} />
      <div className="app-container">
        <div className="app-left">
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box className="bu-list beacon-host burows-beacon-target">
              <Beacon
                onClick={() => rowsBeaconRef.current?.start()}
                label="BU rows beacon"
              />
              {BU_ROWS.map((r) => (
              <Box
                key={r.id}
                className="bu-row"
                sx={{ borderLeft: "4px solid #333333" }}
              >
                <Box className="bu-row-content">
                  <Box className="bu-row-text">
                    <span className="bu-row-pill" aria-hidden />
                    <span className="bu-row-pill bu-row-pill--small" aria-hidden />
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <div
                      className={`icon-border ${r.id === "east" ? "beacon-host offline-beacon-target" : ""}`}
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
                            color: "#000000ff",
                          }}
                        >
                          {r.alarms}
                        </Typography>
                        {r.id === "east" && (
                          <Beacon
                            onClick={() => offlineBeaconRef.current?.start()}
                            label="Offline beacon"
                          />
                        )}
                      </div>
                      <div
                        className={`icon-border ${r.id === "east" ? "beacon-host alarms-beacon-target" : ""}`}
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
                            color: "#000000ff",
                          }}
                        >
                          {r.notices}
                        </Typography>
                        {r.id === "east" && (
                          <Beacon
                            onClick={() => alarmsBeaconRef.current?.start()}
                            label="Alarms beacon"
                          />
                        )}
                      </div>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Container>

          <img src={connectLogo} alt="connect" className="footer-logo" />
        </div>
        <div className="app-right">
          <div className="greetings-search">
            <Box className="beacon-host search-beacon-target">
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
                    color: "#333333",
                    backgroundColor: "#ffffff",
                    paddingRight: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "#a1a1a1ff",
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
                    borderColor: "#4a4a4a",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#6a6a6a",
                  },
                }}
              />
              <Beacon
                onClick={() => searchBeaconRef.current?.start()}
                label="Search beacon"
              />
            </Box>
          </div>
          <div className="widgets-panel beacon-host widgets-beacon-target">
            <Beacon
              onClick={() => widgetsBeaconRef.current?.start()}
              label="Widgets beacon"
            />
            <div className="dashboard-header">
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
            </div>
            <div className="grid-scroll-container">
              <ReactGridLayout
                className={`widgets-grid ${isEditing ? "widgets-grid--editing" : ""}`}
                layout={widgetLayout}
                cols={GRID_COLS}
                rowHeight={80}
                margin={[16, 16]}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
