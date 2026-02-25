// src/App.tsx
import React from "react";
import "./App.css";
import HeroSlide from "./components/HeroSlide";
import type { Role } from "./components/RoleSelector";
import RoleSelector from "./components/RoleSelector";
import BusinessManagerPage, { type BURow } from "./pages/BusinessManagerPage";
import OperatorPage from "./pages/OperatorPage";
import StoreViewPage from "./pages/StoreViewPage";
import DevShortcutsHelp from "./components/DevShortcutsHelp";
import heroImage from "./assets/HeroImage.webp";
import heroFanIcon from "./assets/FanIcon.svg";
import businessManagerImage from "./assets/BusinessManager.webp";
import operatorImage from "./assets/Operator.webp";
import operatorTabletImage from "./assets/OperatorView.svg";
import connectLogo from "./assets/connect_logo.svg";

const SLIDE_MS = 600;
const INACTIVITY_MS = 30_000;
const ENABLE_INACTIVITY_RETURN = false;
const BEACONS_HIDDEN_KEY = "cv_beacons_hidden";
const BEACONS_VISIBILITY_EVENT = "cv_beacons_visibility_updated";
const HEADER_BRAND_KEY = "cv_header_brand";
const HEADER_BRAND_EVENT = "cv_header_brand_updated";
type StoreNode = {
  id: string;
  title: string;
  alarms: number;
  notices: number;
};

type SubRegionNode = {
  id: string;
  title: string;
  stores: StoreNode[];
};

type RegionNode = {
  id: string;
  title: string;
  subRegions: SubRegionNode[];
};

type HebRegionNode = {
  id: string;
  title: string;
  stores: StoreNode[];
};

const randomStoreCount = () => Math.floor(Math.random() * 5) + 1;

const STORE_NAME_POOL = [
  "Brad Lane",
  "Kingsway",
  "Maple Crescent",
  "Oakridge",
  "Harbour View",
  "Rivergate",
  "Willow Park",
  "Elm Street",
  "Stonebridge",
  "Baker Row",
  "Holloway",
  "Meadow Lane",
  "Cedar Walk",
  "Lakeside",
  "Foxglove",
  "Hilltop",
  "Ashgrove",
  "Parkside",
  "Chapel Row",
  "Market Street",
  "Bridge End",
  "Station Rise",
  "Westfield",
  "Eastgate",
  "Southbank",
  "Northfield",
  "Wellington Way",
  "Abbey Road",
  "Granary Wharf",
  "Millstone",
];

const buildStores = (
  prefix: string,
  count: number,
  names: string[] = STORE_NAME_POOL,
): StoreNode[] => {
  const pool = [...names];
  return Array.from({ length: count }).map((_, index) => {
    const name =
      pool.splice(Math.floor(Math.random() * pool.length), 1)[0] ??
      `Site ${index + 1}`;
    return {
      id: `${prefix}-${name.toLowerCase().replace(/\s+/g, "-")}`,
      title: name,
      alarms: Math.floor(Math.random() * 7),
      notices: Math.floor(Math.random() * 10),
    };
  });
};

const TEXAS_STORE_POOLS: Record<string, string[]> = {
  "san-antonio": [
    "Alamo Heights",
    "Stone Oak",
    "Southtown",
    "Medical Center",
    "Pearl District",
    "Helotes",
  ],
  houston: [
    "The Heights",
    "Midtown",
    "Montrose",
    "River Oaks",
    "Memorial",
    "Westchase",
  ],
  dallas: [
    "Deep Ellum",
    "Uptown",
    "Bishop Arts",
    "Lakewood",
    "Preston Hollow",
    "Oak Lawn",
  ],
  austin: [
    "South Congress",
    "Domain Northside",
    "Mueller",
    "East Austin",
    "Rainey Street",
    "Circle C",
  ],
};

const REGIONS: RegionNode[] = [
  {
    id: "central",
    title: "Central",
    subRegions: [
      {
        id: "city-centre",
        title: "City Centre",
        stores: buildStores("City Centre", randomStoreCount()),
      },
      {
        id: "business-area",
        title: "Business Area",
        stores: buildStores("Business Area", randomStoreCount()),
      },
      {
        id: "suburb",
        title: "Suburb",
        stores: buildStores("Suburb", randomStoreCount()),
      },
    ],
  },
  {
    id: "north",
    title: "North",
    subRegions: [
      {
        id: "northwest",
        title: "Northwest",
        stores: buildStores("Northwest", randomStoreCount()),
      },
      {
        id: "northeast",
        title: "Northeast",
        stores: buildStores("Northeast", randomStoreCount()),
      },
    ],
  },
  {
    id: "south",
    title: "South",
    subRegions: [
      {
        id: "southwest",
        title: "Southwest",
        stores: buildStores("Southwest", randomStoreCount()),
      },
      {
        id: "southeast",
        title: "Southeast",
        stores: buildStores("Southeast", randomStoreCount()),
      },
    ],
  },
  {
    id: "transport",
    title: "Transport Hubs",
    subRegions: [
      {
        id: "airports",
        title: "Airports",
        stores: buildStores("Airports", randomStoreCount()),
      },
      {
        id: "train-stations",
        title: "Train Stations",
        stores: buildStores("Train Stations", randomStoreCount()),
      },
    ],
  },
];

const HEB_REGIONS: HebRegionNode[] = [
  {
    id: "san-antonio",
    title: "San Antonio",
    stores: buildStores("San Antonio", 5, TEXAS_STORE_POOLS["san-antonio"]),
  },
  {
    id: "houston",
    title: "Houston",
    stores: buildStores("Houston", 5, TEXAS_STORE_POOLS.houston),
  },
  {
    id: "dallas",
    title: "Dallas",
    stores: buildStores("Dallas", 5, TEXAS_STORE_POOLS.dallas),
  },
  {
    id: "austin",
    title: "Austin",
    stores: buildStores("Austin", 5, TEXAS_STORE_POOLS.austin),
  },
];

const sumStoreStats = (stores: StoreNode[]) =>
  stores.reduce(
    (totals, store) => {
      totals.alarms += store.alarms;
      totals.notices += store.notices;
      return totals;
    },
    { alarms: 0, notices: 0 },
  );

const REGION_ROWS: BURow[] = REGIONS.map((region) => {
  const stores = region.subRegions.flatMap((subRegion) => subRegion.stores);
  const totals = sumStoreStats(stores);
  return {
    id: region.id,
    title: region.title,
    subtitle: `${stores.length} Stores`,
    alarms: totals.alarms,
    notices: totals.notices,
  };
});

const REGION_TITLE_BY_ID = REGIONS.reduce<Record<string, string>>((acc, region) => {
  acc[region.id] = region.title;
  return acc;
}, {});

const SUB_REGION_ROWS_BY_REGION = REGIONS.reduce<Record<string, BURow[]>>(
  (acc, region) => {
    acc[region.id] = region.subRegions.map((subRegion) => {
      const totals = sumStoreStats(subRegion.stores);
      return {
        id: subRegion.id,
        title: subRegion.title,
        subtitle: `${subRegion.stores.length} Stores`,
        alarms: totals.alarms,
        notices: totals.notices,
      };
    });
    return acc;
  },
  {},
);

const SUB_REGION_TITLE_BY_ID = REGIONS.flatMap((region) => region.subRegions).reduce<
  Record<string, string>
>((acc, subRegion) => {
  acc[subRegion.id] = subRegion.title;
  return acc;
}, {});

const STORE_ROWS_BY_SUB_REGION = REGIONS.flatMap((region) => region.subRegions).reduce<
  Record<string, BURow[]>
>((acc, subRegion) => {
  acc[subRegion.id] = subRegion.stores.map((store) => ({
    id: store.id,
    title: store.title,
    subtitle: undefined,
    alarms: store.alarms,
    notices: store.notices,
  }));
  return acc;
}, {});

const STORE_TITLE_BY_ID = REGIONS.flatMap((region) =>
  region.subRegions.flatMap((subRegion) => subRegion.stores),
).reduce<Record<string, string>>((acc, store) => {
  acc[store.id] = store.title;
  return acc;
}, {});

const HEB_REGION_ROWS: BURow[] = HEB_REGIONS.map((region) => {
  const totals = sumStoreStats(region.stores);
  return {
    id: region.id,
    title: region.title,
    subtitle: `${region.stores.length} Stores`,
    alarms: totals.alarms,
    notices: totals.notices,
  };
});

const HEB_REGION_TITLE_BY_ID = HEB_REGIONS.reduce<Record<string, string>>(
  (acc, region) => {
    acc[region.id] = region.title;
    return acc;
  },
  {},
);

const HEB_STORE_ROWS_BY_REGION = HEB_REGIONS.reduce<Record<string, BURow[]>>(
  (acc, region) => {
    acc[region.id] = region.stores.map((store) => ({
      id: store.id,
      title: store.title,
      subtitle: undefined,
      alarms: store.alarms,
      notices: store.notices,
    }));
    return acc;
  },
  {},
);

const HEB_STORE_TITLE_BY_ID = HEB_REGIONS.flatMap((region) => region.stores).reduce<
  Record<string, string>
>((acc, store) => {
  acc[store.id] = store.title;
  return acc;
}, {});

export default function App() {
  const [heroVisible, setHeroVisible] = React.useState(true);
  const [selectorVisible, setSelectorVisible] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);
  const [selectedRegionId, setSelectedRegionId] = React.useState<string | null>(
    null,
  );
  const [selectedSubRegionId, setSelectedSubRegionId] = React.useState<
    string | null
  >(null);
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(
    null,
  );
  const [regionLayerEnter, setRegionLayerEnter] = React.useState(false);
  const [subRegionLayerEnter, setSubRegionLayerEnter] = React.useState(false);
  const [storeLayerEnter, setStoreLayerEnter] = React.useState(false);
  const [enterDirection, setEnterDirection] = React.useState<
    "left" | "right" | null
  >(null);
  const [pageEnter, setPageEnter] = React.useState(false);
  const [showIntroOverlay, setShowIntroOverlay] = React.useState(false);
  const [showDockedHelper, setShowDockedHelper] = React.useState(false);
  const introTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showHelperTip, setShowHelperTip] = React.useState(false);
  const [isHebMode, setIsHebMode] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(HEADER_BRAND_KEY) === "heb";
  });
  const [areBeaconsEnabled, setAreBeaconsEnabled] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(BEACONS_HIDDEN_KEY) !== "1";
  });
  const helperTipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    const syncHeaderBrand = () => {
      if (typeof window === "undefined") return;
      setIsHebMode(window.localStorage.getItem(HEADER_BRAND_KEY) === "heb");
    };
    syncHeaderBrand();
    window.addEventListener("storage", syncHeaderBrand);
    window.addEventListener(HEADER_BRAND_EVENT, syncHeaderBrand);
    return () => {
      window.removeEventListener("storage", syncHeaderBrand);
      window.removeEventListener(HEADER_BRAND_EVENT, syncHeaderBrand);
    };
  }, []);

  React.useEffect(() => {
    const preload = (src: string) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    };

    [
      heroImage,
      heroFanIcon,
      businessManagerImage,
      operatorImage,
      operatorTabletImage,
      connectLogo,
    ].forEach(preload);
  }, []);

  React.useEffect(() => {
    const syncBeaconSetting = () => {
      if (typeof window === "undefined") return;
      setAreBeaconsEnabled(window.localStorage.getItem(BEACONS_HIDDEN_KEY) !== "1");
    };
    syncBeaconSetting();
    window.addEventListener("storage", syncBeaconSetting);
    window.addEventListener(BEACONS_VISIBILITY_EVENT, syncBeaconSetting);
    return () => {
      window.removeEventListener("storage", syncBeaconSetting);
      window.removeEventListener(BEACONS_VISIBILITY_EVENT, syncBeaconSetting);
    };
  }, []);

  React.useEffect(() => {
    if (!selectedRole) return;
    setPageEnter(false);
    const raf = requestAnimationFrame(() => setPageEnter(true));
    return () => cancelAnimationFrame(raf);
  }, [selectedRole]);

  React.useEffect(() => {
    if (introTimerRef.current) {
      clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
    if (helperTipTimerRef.current) {
      clearTimeout(helperTipTimerRef.current);
      helperTipTimerRef.current = null;
    }
    setShowHelperTip(false);

    if (!selectedRole || selectedRole !== "manager" || !areBeaconsEnabled) {
      setShowIntroOverlay(false);
      setShowDockedHelper(false);
      return;
    }

    setShowIntroOverlay(true);
    setShowDockedHelper(false);
    introTimerRef.current = setTimeout(() => {
      setShowIntroOverlay(false);
      setShowDockedHelper(true);
      introTimerRef.current = null;
    }, 2100);

    return () => {
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current);
        introTimerRef.current = null;
      }
      if (helperTipTimerRef.current) {
        clearTimeout(helperTipTimerRef.current);
        helperTipTimerRef.current = null;
      }
    };
  }, [selectedRole, areBeaconsEnabled]);

  const handleHelperQuestionClick = React.useCallback(() => {
    if (helperTipTimerRef.current) {
      clearTimeout(helperTipTimerRef.current);
    }
    setShowHelperTip(true);
    helperTipTimerRef.current = setTimeout(() => {
      setShowHelperTip(false);
      helperTipTimerRef.current = null;
    }, 2400);
  }, []);
  // Reveal selector after hero slide completes
  const handleGetStarted = () => {
    //console.log("Hero: Get started pressed — hiding hero");
    setHeroVisible(false);
    setTimeout(() => setSelectorVisible(true), SLIDE_MS);
  };

  const handleSelectRole = (role: Role) => {
    //console.log("App: handleSelectRole called with", role);
    setSelectedRole(role);
    setSelectedRegionId(null);
    setSelectedSubRegionId(null);
    setSelectedStoreId(null);
    setEnterDirection(role === "manager" ? "left" : "right");
    // give time for panel animation to finish inside RoleSelector (it calls onSelect after transitionend)
    //setSelectorVisible(false);

    //requestAnimationFrame(() => setPageEnter(true));
  };

  const handleBackToSelector = () => {
    //console.log("App: Back to selector");
    // start exit animation
    setPageEnter(false);
    setRegionLayerEnter(false);
    setSubRegionLayerEnter(false);
    setStoreLayerEnter(false);
    // after transition finishes, clear role and show selector
    setTimeout(() => {
      setSelectedRole(null);
      setSelectedRegionId(null);
      setSelectedSubRegionId(null);
      setSelectedStoreId(null);
      setSelectorVisible(true);
      setEnterDirection(null);
    }, 650); // must match CSS duration (600ms + small buffer)
  };

  const handleOpenRegion = (id: string) => {
    if (isHebMode) {
      setSelectedRegionId(null);
      setSelectedSubRegionId(id);
      setSelectedStoreId(null);
      setRegionLayerEnter(false);
      setStoreLayerEnter(false);
      setSubRegionLayerEnter(false);
      requestAnimationFrame(() => setSubRegionLayerEnter(true));
      return;
    }
    setSelectedRegionId(id);
    setSelectedSubRegionId(null);
    setSelectedStoreId(null);
    setSubRegionLayerEnter(false);
    setStoreLayerEnter(false);
    setRegionLayerEnter(false);
    requestAnimationFrame(() => setRegionLayerEnter(true));
  };

  const handleOpenSubRegion = (id: string) => {
    setSelectedSubRegionId(id);
    setSelectedStoreId(null);
    setStoreLayerEnter(false);
    setSubRegionLayerEnter(false);
    requestAnimationFrame(() => setSubRegionLayerEnter(true));
  };

  const handleOpenStore = (id: string) => {
    setSelectedStoreId(id);
    setStoreLayerEnter(false);
    requestAnimationFrame(() => setStoreLayerEnter(true));
  };

  const handleBackToSubRegion = () => {
    setStoreLayerEnter(false);
    setTimeout(() => {
      setSelectedStoreId(null);
    }, SLIDE_MS);
  };

  const handleBackToRegion = () => {
    if (isHebMode) {
      setSubRegionLayerEnter(false);
      setStoreLayerEnter(false);
      setTimeout(() => {
        setSelectedStoreId(null);
        setSelectedSubRegionId(null);
      }, SLIDE_MS);
      return;
    }
    setSubRegionLayerEnter(false);
    setStoreLayerEnter(false);
    setTimeout(() => {
      setSelectedStoreId(null);
      setSelectedSubRegionId(null);
    }, SLIDE_MS);
  };

  const handleBackToBusinessManager = () => {
    setRegionLayerEnter(false);
    setSubRegionLayerEnter(false);
    setStoreLayerEnter(false);
    setTimeout(() => {
      setSelectedStoreId(null);
      setSelectedSubRegionId(null);
      setSelectedRegionId(null);
    }, SLIDE_MS);
  };

  const handleBackToHero = () => {
    setSelectorVisible(false);
    setSelectedRole(null);
    setEnterDirection(null);
    setHeroVisible(true);
  };

  React.useEffect(() => {
    if (!ENABLE_INACTIVITY_RETURN) return;
    if (heroVisible) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const events = ["mousemove", "keydown", "touchstart", "scroll"];

    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setSelectedRole(null);
        setSelectorVisible(false);
        setEnterDirection(null);
        setPageEnter(false);
        setHeroVisible(true);
      }, INACTIVITY_MS);
    };

    reset();
    events.forEach((ev) => window.addEventListener(ev, reset));

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [heroVisible]);

  return (
    <div className="app-root">
      <HeroSlide visible={heroVisible} onClose={handleGetStarted} />
      <DevShortcutsHelp />

      {selectorVisible && !selectedRole && (
        <RoleSelector
          onSelect={handleSelectRole}
          onBack={handleBackToHero}
          onClose={() => {
            console.log(
              "App: RoleSelector finished - hiding selector and entering page",
            );
            setSelectorVisible(false);
          }}
        />
      )}

      {/* Show selected role page */}
      {selectedRole === "manager" && (
        <div
          className={`page-slide ${enterDirection === "left" ? "from-left" : ""} ${pageEnter ? "enter" : ""}`}
        >
          <BusinessManagerPage
            onBack={handleBackToSelector}
            rows={isHebMode ? HEB_REGION_ROWS : REGION_ROWS}
            onOpen={handleOpenRegion}
          />
          {!isHebMode && selectedRegionId && (
            <div
              className={`subpage-slide from-right ${regionLayerEnter ? "enter" : ""}`}
            >
              <BusinessManagerPage
                onBack={handleBackToBusinessManager}
                heading={REGION_TITLE_BY_ID[selectedRegionId] ?? "View All Markets"}
                rows={SUB_REGION_ROWS_BY_REGION[selectedRegionId] ?? []}
                onOpen={handleOpenSubRegion}
              />
            </div>
          )}
          {selectedSubRegionId && (
            <div
              className={`subpage-slide from-right ${subRegionLayerEnter ? "enter" : ""}`}
            >
              <BusinessManagerPage
                onBack={isHebMode ? handleBackToBusinessManager : handleBackToRegion}
                heading={
                  isHebMode
                    ? HEB_REGION_TITLE_BY_ID[selectedSubRegionId] ?? "View All Stores"
                    : SUB_REGION_TITLE_BY_ID[selectedSubRegionId] ?? "View All Stores"
                }
                rows={
                  isHebMode
                    ? HEB_STORE_ROWS_BY_REGION[selectedSubRegionId] ?? []
                    : STORE_ROWS_BY_SUB_REGION[selectedSubRegionId] ?? []
                }
                onOpen={handleOpenStore}
              />
            </div>
          )}
          {selectedStoreId && (
            <div
              className={`subpage-slide from-right ${storeLayerEnter ? "enter" : ""}`}
            >
              <StoreViewPage
                onBack={handleBackToSubRegion}
                title={
                  (isHebMode
                    ? HEB_STORE_TITLE_BY_ID[selectedStoreId]
                    : STORE_TITLE_BY_ID[selectedStoreId]) ?? "Store View"
                }
              />
            </div>
          )}
        </div>
      )}
      {selectedRole === "operator" && (
        <div
          className={`page-slide ${enterDirection === "right" ? "from-right" : ""} ${pageEnter ? "enter" : ""}`}
        >
          <OperatorPage onBack={handleBackToSelector} deferSceneLoadMs={650} />
        </div>
      )}

      {selectedRole === "manager" &&
        areBeaconsEnabled &&
        (showIntroOverlay || showDockedHelper) && (
        <>
          {showIntroOverlay && <div className="connect-helper-backdrop" aria-hidden />}
          <div
            className={`connect-helper ${showIntroOverlay ? "intro" : "docked"}`}
            aria-live="polite"
          >
            {showIntroOverlay && (
              <p className="connect-helper-text">
                Click the beacons to learn more about Connect
              </p>
            )}
            {showDockedHelper && showHelperTip && (
              <div className="connect-helper-tip" role="status">
                Click the beacons to learn more about Connect
              </div>
            )}
            <button
              type="button"
              className="connect-helper-trigger"
              onClick={showDockedHelper ? handleHelperQuestionClick : undefined}
              aria-label="Help"
            >
              <span className="connect-helper-icon-wrap" aria-hidden>
                <img src={heroFanIcon} alt="" className="connect-helper-icon" />
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
