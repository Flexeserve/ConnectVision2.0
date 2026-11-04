import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGeoLocation } from "../hooks/useGeoLocation";
import {
  LAST_COUNTRY_KEY,
  LocaleContext,
  OVERRIDE_KEY,
  buildLocale,
  initialOverride,
  local,
  regionForCountry,
  safeGet,
  safeSet,
  session,
  setActiveRegion,
  type Region,
  type RegionOverride,
} from "../lib/locale";

// Resolves the viewer's region from geolocation (see lib/locale.ts for the
// conventions and override options) and provides it to the app.
export default function LocaleProvider({ children }: { children: ReactNode }) {
  const geo = useGeoLocation();
  const [override, setOverrideState] = useState<RegionOverride>(initialOverride);
  // Last resolved country, so a reload doesn't flash UK conventions for a
  // US viewer while the lookup is in flight.
  const [cachedCountry] = useState(() =>
    typeof window === "undefined" ? null : safeGet(local, LAST_COUNTRY_KEY),
  );

  useEffect(() => {
    if (geo.countryCode) safeSet(local, LAST_COUNTRY_KEY, geo.countryCode);
  }, [geo.countryCode]);

  const setOverride = useCallback((next: RegionOverride) => {
    safeSet(session, OVERRIDE_KEY, next);
    setOverrideState(next);
  }, []);

  // Ctrl + Shift + L cycles Auto → US → UK → Auto.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "l"))
        return;
      event.preventDefault();
      setOverrideState((prev) => {
        const next: RegionOverride =
          prev === null ? "US" : prev === "US" ? "UK" : null;
        safeSet(session, OVERRIDE_KEY, next);
        console.info(`[locale] override → ${next ?? "auto (geolocation)"}`);
        return next;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const region: Region =
    override ??
    regionForCountry(geo.countryCode) ??
    regionForCountry(cachedCountry) ??
    "UK";
  useEffect(() => setActiveRegion(region), [region]);

  const city = geo.city ?? "London";
  const value = useMemo(
    () => buildLocale(region, city, override, setOverride),
    [region, city, override, setOverride],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
