import { useEffect, useState } from "react";

// Resolves the viewer's city and ISO country code. The city feeds the
// dashboard greeting; the country drives regional conventions (currency,
// temperature unit, clock format, spelling) via LocaleProvider.
//
// An IP-based lookup runs immediately (no permission prompt) so the result
// lands within ~1s. In parallel, if the browser exposes Geolocation (OS
// "Location Services") we ask for a precise fix and, if granted, override the
// IP result with a reverse-geocoded one. Every call is best-effort; on total
// failure the fallback stays.

export type GeoResult = {
  city: string | null;
  /** ISO 3166-1 alpha-2, upper-case (e.g. "US", "GB"). */
  countryCode: string | null;
};

const GEO_TIMEOUT_MS = 8000;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const norm = (code?: string | null) =>
  code && /^[a-z]{2}$/i.test(code) ? code.toUpperCase() : null;

async function geoFromIp(): Promise<GeoResult | null> {
  // Try a couple of keyless, CORS-open providers — some networks / ad
  // blockers block one but not the others.
  const geojs = await fetchJson<{ city?: string; country_code?: string }>(
    "https://get.geojs.io/v1/ip/geo.json",
  );
  if (geojs?.city || geojs?.country_code)
    return { city: geojs.city ?? null, countryCode: norm(geojs.country_code) };

  const ipwho = await fetchJson<{
    success?: boolean;
    city?: string;
    country_code?: string;
  }>("https://ipwho.is/");
  if (ipwho?.success && (ipwho.city || ipwho.country_code))
    return { city: ipwho.city ?? null, countryCode: norm(ipwho.country_code) };

  const ipapi = await fetchJson<{ city?: string; country_code?: string }>(
    "https://ipapi.co/json/",
  );
  if (ipapi?.city || ipapi?.country_code)
    return { city: ipapi.city ?? null, countryCode: norm(ipapi.country_code) };

  return null;
}

async function reverseGeocode(lat: number, lon: number): Promise<GeoResult | null> {
  const data = await fetchJson<{
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryCode?: string;
  }>(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  );
  if (!data) return null;
  const city = data.city || data.locality || data.principalSubdivision || null;
  const countryCode = norm(data.countryCode);
  return city || countryCode ? { city, countryCode } : null;
}

function getPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (v: GeolocationPosition | null) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    // Guard against the permission prompt hanging forever — the options
    // `timeout` only starts once permission is granted.
    const t = setTimeout(() => done(null), GEO_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(t);
        done(pos);
      },
      () => {
        clearTimeout(t);
        done(null);
      },
      { timeout: GEO_TIMEOUT_MS, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export function useGeoLocation(): GeoResult {
  const [geo, setGeo] = useState<GeoResult>({ city: null, countryCode: null });

  useEffect(() => {
    let cancelled = false;
    // Whichever of the two lookups resolves last would otherwise win, even
    // if it's the coarse IP result landing after the precise fix (e.g. once
    // geolocation permission is already granted from earlier in the
    // session, the GPS fix can resolve before the IP lookup's network
    // round-trip finishes). Once the precise result lands, it always wins.
    let preciseApplied = false;

    const merge = (value: GeoResult) =>
      setGeo((prev) => ({
        city: value.city ?? prev.city,
        countryCode: value.countryCode ?? prev.countryCode,
      }));

    // 1. immediate, prompt-free
    void geoFromIp().then((g) => {
      if (!g) console.debug("[useGeoLocation] IP lookup returned nothing");
      if (!cancelled && !preciseApplied && g) merge(g);
    });

    // 2. precise, if the user allows it — overrides the IP result
    void getPosition().then((pos) => {
      if (!pos) return;
      void reverseGeocode(pos.coords.latitude, pos.coords.longitude).then((g) => {
        if (!cancelled && g) {
          preciseApplied = true;
          merge(g);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return geo;
}
