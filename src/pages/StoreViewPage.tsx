import React from "react";
import { Search } from "lucide-react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import Header from "../components/Header";
import Beacon, { type BeaconOffset } from "../components/Beacon";
import storeIcon from "../assets/StoreIcon.svg";
import "./StoreViewPage.css";
import "../styles/tour.css";

type StoreViewPageProps = {
  onBack?: () => void;
  title?: string;
  rows?: Array<{ id: string; title: string }>;
  onOpen?: (id: string) => void;
};

const STORE_BEACON_OFFSETS_KEY = "cv_store_beacon_offsets";
const BEACONS_HIDDEN_KEY = "cv_beacons_hidden";

const storeViewTourSteps: DriveStep[] = [
  {
    element: ".store-view-container-target",
    popover: {
      title: "Store View",
      description:
        "At store level you see a detailed view of the connected devices",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: ".store-device-row-target",
    popover: {
      title: "Device Rows",
      description: "Each device shows performance related data",
      side: "top",
      align: "start",
    },
  },
  {
    element: ".store-device-selected-target",
    popover: {
      title: "Schedules",
      description:
        "Select a schedule that automates the ON, OFF and daypart settings",
      side: "top",
      align: "start",
    },
  },
  {
    element: ".store-status-dot-target",
    popover: {
      title: "Status Dots",
      description:
        "These dots show if a zone or device is switched ON and working, has a fault or alarm or if it is switched OFF",
      side: "left",
      align: "center",
    },
  },
];

const FLEX_VARIANTS = [2, 3, 4, 5];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededRandom = (seed: number) => {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const buildStoreDevices = (storeTitle: string) => {
  const rand = seededRandom(hashString(storeTitle));
  const pickVariant = () =>
    FLEX_VARIANTS[Math.floor(rand() * FLEX_VARIANTS.length)];

  const leftVariant = pickVariant();
  const rightVariant = pickVariant();
  const rows = [
    {
      id: "left-flexeserve",
      device: "Flexeserve - LEFT",
      model: `Flexeserve ${leftVariant}T 1000`,
      schedule: `Flexeserve ${leftVariant} - Standard`,
      statusDots: leftVariant,
    },
    {
      id: "right-flexeserve",
      device: "Flexeserve - RIGHT*",
      model: `Flexeserve ${rightVariant}T 1000`,
      schedule: `Flexeserve ${rightVariant} - Standard`,
      statusDots: rightVariant,
    },
  ];

  const includePizza = rand() > 0.45;
  const includeRoller = rand() > 0.55;

  if (includePizza) {
    rows.push({
      id: "pizza-spinner",
      device: "Pizza Spinner",
      model: "Pizza Spinner",
      schedule: "Pizza Spinner - Standard",
      statusDots: 1,
    });
  }

  if (includeRoller) {
    rows.push({
      id: "roller-grill",
      device: "Roller Grill",
      model: "Roller Grill",
      schedule: "Roller Grill - Standard",
      statusDots: 1,
    });
  }

  return rows;
};

export default function StoreViewPage({
  onBack,
  title,
  rows = [],
  onOpen,
}: StoreViewPageProps) {
  const deviceRows = React.useMemo(
    () => buildStoreDevices(title ?? "Store View"),
    [title],
  );
  const [isBeaconDevMode, setIsBeaconDevMode] = React.useState(false);
  const [isBeaconsHidden, setIsBeaconsHidden] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(BEACONS_HIDDEN_KEY) !== "0";
  });
  const [beaconOffsets, setBeaconOffsets] = React.useState<
    Record<string, BeaconOffset>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORE_BEACON_OFFSETS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, BeaconOffset>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORE_BEACON_OFFSETS_KEY,
      JSON.stringify(beaconOffsets),
    );
  }, [beaconOffsets]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("beacons-hidden", isBeaconsHidden);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BEACONS_HIDDEN_KEY, isBeaconsHidden ? "1" : "0");
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

  const handleBeaconOffsetChange = React.useCallback(
    (beaconId: string, next: BeaconOffset) => {
      setBeaconOffsets((prev) => ({
        ...prev,
        [beaconId]: next,
      }));
    },
    [],
  );

  const startStoreTourFrom = React.useCallback((stepIndex: number) => {
    const step = storeViewTourSteps[stepIndex];
    if (!step) return;
    const beaconTour = driver({
      showProgress: false,
      steps: [step],
      showButtons: ["close"],
      smoothScroll: true,
      animate: true,
      popoverClass: "business-manager-tour-popover",
    });
    beaconTour.drive();
  }, []);

  return (
    <div className="store-view-page">
      <Header onBack={onBack} title={title ?? "Store View"} />

      <div className="store-view-container store-view-container-target beacon-host beacon-host--store-container">
        <Beacon
          label="Store view tour"
          beaconId="store-container"
          onClick={() => startStoreTourFrom(0)}
          devMode={isBeaconDevMode}
          offset={beaconOffsets["store-container"]}
          onOffsetChange={(next) =>
            handleBeaconOffsetChange("store-container", next)
          }
        />
        <div className="greetings">Good morning</div>

        <div className="store-view-main">
          <div className="store-view-left">
            <div className="mx-auto mt-2 w-full max-w-5xl">
              <div className="mb-6 flex items-center gap-4">
                <img src={storeIcon} alt="Store Icon" className="h-16" />
                <span className="text-lg font-semibold text-ink">
                  {title ?? "View All Markets"}
                </span>
              </div>
              {rows.length > 0 && (
                <div className="store-list">
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="store-row"
                      onClick={() => onOpen?.(row.id)}
                      role={onOpen ? "button" : undefined}
                      tabIndex={onOpen ? 0 : -1}
                      onKeyDown={(event) => {
                        if (!onOpen) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpen(row.id);
                        }
                      }}
                    >
                      <span className="text-[0.98rem] font-semibold text-ink">
                        {row.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="store-view-right">
            <div className="greetings-search">
              <div className="relative flex w-full max-w-[500px] sm:w-[460px]">
                <input
                  type="text"
                  placeholder="Write to start search"
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
          </div>
        </div>
        <div className="store-view-bottom">
          <div className="store-device-container w-full">
            <div className="store-device-header">
              <span>Device</span>
              <span>Model</span>
              <span>Schedule</span>
              <span>Status</span>
            </div>
            <div className="store-device-list">
              {deviceRows.map((row, index) => (
                <div
                  className={`store-device-row ${index === 0 ? "store-device-row-target beacon-host beacon-host--store-row" : ""}`}
                  key={row.id}
                >
                  {index === 0 ? (
                    <Beacon
                      label="Device row tour"
                      beaconId="store-device-row"
                      onClick={() => startStoreTourFrom(1)}
                      devMode={isBeaconDevMode}
                      offset={beaconOffsets["store-device-row"]}
                      onOffsetChange={(next) =>
                        handleBeaconOffsetChange("store-device-row", next)
                      }
                    />
                  ) : null}
                  <span className="store-device-cell">{row.device}</span>
                  <span className="store-device-cell">{row.model}</span>
                  <div
                    className={`store-device-cell ${index === 0 ? "beacon-host beacon-host--schedule" : ""}`}
                  >
                    {index === 0 ? (
                      <Beacon
                        label="Schedule tour"
                        beaconId="store-device-selected"
                        onClick={() => startStoreTourFrom(2)}
                        devMode={isBeaconDevMode}
                        offset={beaconOffsets["store-device-selected"]}
                        onOffsetChange={(next) =>
                          handleBeaconOffsetChange("store-device-selected", next)
                        }
                      />
                    ) : null}
                    <select
                      defaultValue={row.schedule}
                      className={`store-device-select ${index === 0 ? "store-device-selected-target" : ""}`}
                    >
                      <option>{row.schedule}</option>
                      <option>{row.model} - Weekend</option>
                      <option>{row.model} - Off-Peak</option>
                    </select>
                  </div>
                  <div
                    className={`store-device-status ${index === 0 ? "store-status-dot-target beacon-host beacon-host--status-dots" : ""}`}
                  >
                    {index === 0 ? (
                      <Beacon
                        label="Status dots tour"
                        beaconId="store-status-dot"
                        onClick={() => startStoreTourFrom(3)}
                        devMode={isBeaconDevMode}
                        offset={beaconOffsets["store-status-dot"]}
                        onOffsetChange={(next) =>
                          handleBeaconOffsetChange("store-status-dot", next)
                        }
                      />
                    ) : null}
                    {Array.from({ length: row.statusDots }).map((_, index) => (
                      <span
                        key={`${row.id}-status-${index}`}
                        className="store-status-dot"
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
