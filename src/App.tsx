// src/App.tsx
import React from "react";
import "./App.css";
import HeroSlide from "./components/HeroSlide";
import type { Role } from "./components/RoleSelector";
import RoleSelector from "./components/RoleSelector";
import BusinessManagerPage, { type BURow } from "./pages/BusinessManagerPage";
import OperatorPage from "./pages/OperatorPage";
import StoreViewPage from "./pages/StoreViewPage";
import heroImage from "./assets/HeroImage.png";
import heroFanIcon from "./assets/FanIcon.svg";
import businessManagerImage from "./assets/BusinessManager.jpg";
import operatorImage from "./assets/Operator.jpg";
import operatorTabletImage from "./assets/OperatorView.svg";
import connectLogo from "./assets/connect_logo.svg";

const SLIDE_MS = 600;
const INACTIVITY_MS = 30_000;
const ENABLE_INACTIVITY_RETURN = false;
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

const randomStoreCount = () => Math.floor(Math.random() * 5) + 1;

const buildStores = (prefix: string, count: number): StoreNode[] =>
  Array.from({ length: count }).map((_, index) => {
    const storeIndex = index + 1;
    return {
      id: `${prefix}-store-${storeIndex}`,
      title: `${prefix} Store ${String(storeIndex).padStart(2, "0")}`,
      alarms: Math.floor(Math.random() * 7),
      notices: Math.floor(Math.random() * 10),
    };
  });

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
        subtitle: undefined,
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
    if (!selectedRole) return;
    setPageEnter(false);
    const raf = requestAnimationFrame(() => setPageEnter(true));
    return () => cancelAnimationFrame(raf);
  }, [selectedRole]);
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
            rows={REGION_ROWS}
            onOpen={handleOpenRegion}
          />
          {selectedRegionId && (
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
                onBack={handleBackToRegion}
                heading={SUB_REGION_TITLE_BY_ID[selectedSubRegionId] ?? "View All Stores"}
                rows={STORE_ROWS_BY_SUB_REGION[selectedSubRegionId] ?? []}
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
                title={STORE_TITLE_BY_ID[selectedStoreId] ?? "Store View"}
              />
            </div>
          )}
        </div>
      )}
      {selectedRole === "operator" && (
        <div
          className={`page-slide ${enterDirection === "right" ? "from-right" : ""} ${pageEnter ? "enter" : ""}`}
        >
          <OperatorPage onBack={handleBackToSelector} />
        </div>
      )}
    </div>
  );
}
