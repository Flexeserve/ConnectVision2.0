import { useEffect, useState } from "react";

// Resolves the viewer's city name for the dashboard greeting.
//
// An IP-based lookup runs immediately (no permission prompt) so the greeting
// updates within ~1s. In parallel, if the browser exposes Geolocation (OS
// "Location Services") we ask for a precise fix and, if granted, override the
// IP result with a reverse-geocoded city. Every call is best-effort; on total
// failure the `fallback` stays.

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

async function cityFromIp(): Promise<string | null> {
  // Try a couple of keyless, CORS-open providers — some networks / ad
  // blockers block one but not the others.
  const geojs = await fetchJson<{ city?: string }>(
    "https://get.geojs.io/v1/ip/geo.json",
  );
  if (geojs?.city) return geojs.city;

  const ipwho = await fetchJson<{ success?: boolean; city?: string }>(
    "https://ipwho.is/",
  );
  if (ipwho?.success && ipwho.city) return ipwho.city;

  const ipapi = await fetchJson<{ city?: string }>("https://ipapi.co/json/");
  if (ipapi?.city) return ipapi.city;

  return null;
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const data = await fetchJson<{
    city?: string;
    locality?: string;
    principalSubdivision?: string;
  }>(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  );
  return data?.city || data?.locality || data?.principalSubdivision || null;
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

export function useCityName(fallback = "London"): string {
  const [city, setCity] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    const apply = (value: string | null) => {
      if (!cancelled && value) setCity(value);
    };

    // 1. immediate, prompt-free
    void cityFromIp().then((c) => {
      if (!c) console.debug("[useCityName] IP lookup returned no city");
      apply(c);
    });

    // 2. precise, if the user allows it — overrides the IP result
    void getPosition().then((pos) => {
      if (!pos) return;
      void reverseGeocode(pos.coords.latitude, pos.coords.longitude).then(apply);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return city;
}
