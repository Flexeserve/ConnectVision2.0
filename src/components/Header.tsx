import React from "react";
import { Popover, PopoverContent, PopoverTrigger, Switch } from "@heroui/react";
import settingsIcon from "../assets/SettingsIcon.svg";
import BackButton from "./BackButton";
import flexeserveLogo from "../assets/flexeserveLogo.svg";
import flexeserveLogoInversed from "../assets/flexeserveLogoInversed.svg";
import hebLogo from "../assets/HEBLogo.svg";

type Props = {
  onBack?: () => void;
  title?: string;
  headerBrand?: "default" | "heb";
};

const HEADER_BRAND_KEY = "cv_header_brand";
const HEADER_BRAND_EVENT = "cv_header_brand_updated";

export default function Header({ onBack, title, headerBrand }: Props) {
  const [now, setNow] = React.useState(() => new Date());
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("cv_theme") === "dark";
  });
  const [darkModeLabel, setDarkModeLabel] = React.useState("Dark mode");
  const [lightModeLabel, setLightModeLabel] = React.useState("Light mode");
  const [globalHeaderBrand, setGlobalHeaderBrand] = React.useState<
    "default" | "heb"
  >(() => {
    if (typeof window === "undefined") return "default";
    return window.localStorage.getItem(HEADER_BRAND_KEY) === "heb"
      ? "heb"
      : "default";
  });

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("dark", isDarkMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("cv_theme", isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const handleThemeChange = () => {
      setIsDarkMode(document.body.classList.contains("dark"));
    };
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const managerTitles = new Set([
      "manager view",
      "business manager",
      "business manager view",
    ]);
    const operatorTitles = new Set(["operator view", "operator"]);
    if (!title) {
      setDarkModeLabel("Dark mode");
      setLightModeLabel("Light mode");
      return;
    }
    const normalized = title.toLowerCase().trim();
    if (managerTitles.has(normalized)) {
      setDarkModeLabel("Dark manager view");
      setLightModeLabel("Light manager view");
      return;
    }
    if (operatorTitles.has(normalized)) {
      setDarkModeLabel("Dark operator view");
      setLightModeLabel("Light operator view");
      return;
    }
    setDarkModeLabel("Dark mode");
    setLightModeLabel("Light mode");
  }, [title]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const syncHeaderBrand = () => {
      setGlobalHeaderBrand(
        window.localStorage.getItem(HEADER_BRAND_KEY) === "heb"
          ? "heb"
          : "default",
      );
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
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const timeLabel = now.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const effectiveHeaderBrand = headerBrand ?? globalHeaderBrand;
  const isHebHeader = effectiveHeaderBrand === "heb";
  const logoSrc = isHebHeader
    ? hebLogo
    : isDarkMode
      ? flexeserveLogoInversed
      : flexeserveLogo;

  return (
    <header
      className={`relative z-[2] flex items-center justify-between gap-4 border-b border-line px-4 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${
        isHebHeader ? "bg-[#ee2824] text-white" : "bg-surface text-ink"
      }`}
    >
      <div className="flex items-center gap-4">
        {onBack && <BackButton onClick={onBack} />}
        <img src={logoSrc} alt="Flexeserve Logo" className="h-5" />
        {title && (
          <>
            <span aria-hidden className="font-semibold opacity-70">
              |
            </span>
            <span className="text-base font-semibold">{title}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs opacity-70">{timeLabel}</span>
        <Popover placement="bottom-end">
          <PopoverTrigger>
            <button
              type="button"
              aria-label="Settings"
              className="inline-flex items-center justify-center rounded-md"
            >
              <img
                src={settingsIcon}
                alt=""
                className="h-12 w-12 rounded-md bg-gradient-to-br from-accent to-[#f06a24] px-3 py-0.5"
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[220px] p-4">
            <div className="w-full">
              <p className="mb-2 font-semibold text-ink">Appearance</p>
              <Switch
                isSelected={isDarkMode}
                onValueChange={setIsDarkMode}
                size="sm"
              >
                {isDarkMode ? darkModeLabel : lightModeLabel}
              </Switch>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
