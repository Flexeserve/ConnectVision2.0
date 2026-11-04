import { createContext, useContext } from "react";

// Regional conventions driven by the viewer's geolocation.
//
//   US  → $ (USD), °F, 12-hour clock with AM/PM, American spelling
//   UK  → £ (GBP), °C, 24-hour clock, British spelling   (default)
//
// The region comes from the country code useGeoLocation resolves. For demos
// it can be forced with `?locale=us` / `?locale=uk` (`?locale=auto` clears
// it) or by cycling Auto → US → UK with Ctrl + Shift + L. The override lasts
// for the browser tab's session.

export type Region = "US" | "UK";
export type TempUnit = "C" | "F";
export type RegionOverride = Region | null;

// The US and its territories use Fahrenheit, USD and the 12-hour clock.
const US_COUNTRIES = new Set(["US", "PR", "GU", "VI", "AS", "MP", "UM"]);

export const OVERRIDE_KEY = "cv-locale-override";
export const LAST_COUNTRY_KEY = "cv-last-country";

export const regionForCountry = (code: string | null): Region | null =>
  code ? (US_COUNTRIES.has(code) ? "US" : "UK") : null;

export function safeGet(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}
export function safeSet(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    /* storage unavailable — fine, it's a convenience */
  }
}
export const session = () => window.sessionStorage;
export const local = () => window.localStorage;

export function initialOverride(): RegionOverride {
  if (typeof window === "undefined") return null;
  const param = new URLSearchParams(window.location.search)
    .get("locale")
    ?.toUpperCase();
  if (param === "US" || param === "UK") {
    safeSet(session, OVERRIDE_KEY, param);
    return param;
  }
  if (param === "AUTO") {
    safeSet(session, OVERRIDE_KEY, null);
    return null;
  }
  const stored = safeGet(session, OVERRIDE_KEY);
  return stored === "US" || stored === "UK" ? stored : null;
}

// ─── Spelling ───────────────────────────────────────────────────────────────

// British → American, applied per whole word (lower-cased), case restored
// afterwards. Stems are listed explicitly for -ise → -ize so words like
// "promise", "advise" or "enterprise" are left alone.
const IZE_STEMS =
  "optim|organ|custom|real|recogn|minim|maxim|priorit|summar|util|standard|personal|synchron|author|visual|categor|initial|normal|special|stabil|central|capital|emphas|apolog|final|harmon|memor|modern|neutral|sanit|steril|symbol|digit|monet|character|critic|global|local|famil|subsid|computer|energ";
const US_SPELLING_RULES: [RegExp, string][] = [
  [new RegExp(`^(${IZE_STEMS})is(e|es|ed|ing|ation|ations|er|ers)$`), "$1iz$2"],
  [/^analys(e|es|ed|ing)$/, "analyz$1"],
  [/^(cent|met|lit|theat|fib)re(s|d)?$/, "$1er$2"],
  [/^(col|fav|behavi|lab|neighb|hon|flav|hum|harb|rum|arm)our(s|ed|ing|ite|ites|able|ful)?$/, "$1or$2"],
  [/^(catalog|dialog|analog)ue(s)?$/, "$1$2"],
  [/^grey(s|ed|ish)?$/, "gray$1"],
  [/^programme(s)?$/, "program$1"],
  [/^(licen|defen|offen)ce(s)?$/, "$1se$2"],
  [/^(cancel|travel|model|label|fuel|signal|channel|level)l(ed|ing|er|ers)$/, "$1$2"],
  [/^aluminium$/, "aluminum"],
  [/^(fulfil|enrol)(s|ment)?$/, "$1l$2"],
];

function matchCase(source: string, replacement: string): string {
  if (source === source.toUpperCase() && source.length > 1)
    return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase())
    return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

function americanise(text: string): string {
  return text.replace(/[A-Za-z]+/g, (word) => {
    const lower = word.toLowerCase();
    for (const [re, rep] of US_SPELLING_RULES) {
      if (re.test(lower)) return matchCase(word, lower.replace(re, rep));
    }
    return word;
  });
}

// Mirrors the provider so non-React code (e.g. the driver.js tour) can
// localise copy at the moment it's shown.
let activeRegion: Region = "UK";
export function setActiveRegion(region: Region) {
  activeRegion = region;
}

/** Localise British-English copy to the viewer's region. */
export function spell(text: string, region: Region = activeRegion): string {
  return region === "US" ? americanise(text) : text;
}

// ─── Formatting ─────────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");

export type Locale = {
  region: Region;
  /** null = following geolocation; otherwise a forced region. */
  override: RegionOverride;
  setOverride: (next: RegionOverride) => void;
  city: string;
  currencyCode: "USD" | "GBP";
  tempUnit: TempUnit;
  /** "°C" or "°F" */
  tempSymbol: string;
  hour12: boolean;
  /** Convert a Celsius reading into the display unit, rounded. */
  toTemp: (celsius: number, decimals?: number) => number;
  /** Clock time: "6:05 AM" (US) / "06:05" (UK). */
  formatTime: (hour: number, minute?: number) => string;
  /** On-the-hour axis label: "6 AM" (US) / "06:00" (UK). */
  formatHour: (hour: number) => string;
  /** Header date + time. */
  formatDateTime: (date: Date) => string;
  spell: (text: string) => string;
};

export function buildLocale(
  region: Region,
  city: string,
  override: RegionOverride,
  setOverride: (next: RegionOverride) => void,
): Locale {
  const us = region === "US";
  const tempUnit: TempUnit = us ? "F" : "C";
  const round = (v: number, decimals: number) => {
    const f = 10 ** decimals;
    return Math.round(v * f) / f;
  };
  const formatTime = (hour: number, minute = 0) => {
    const h = ((hour % 24) + 24) % 24;
    if (!us) return `${pad2(h)}:${pad2(minute)}`;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad2(minute)} ${h < 12 ? "AM" : "PM"}`;
  };
  return {
    region,
    override,
    setOverride,
    city,
    currencyCode: us ? "USD" : "GBP",
    tempUnit,
    tempSymbol: `°${tempUnit}`,
    hour12: us,
    toTemp: (celsius, decimals = 0) =>
      round(us ? (celsius * 9) / 5 + 32 : celsius, decimals),
    formatTime,
    formatHour: (hour) => {
      if (!us) return formatTime(hour, 0);
      const h = ((hour % 24) + 24) % 24;
      return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;
    },
    formatDateTime: (date) =>
      date.toLocaleString(us ? "en-US" : "en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: us ? "numeric" : "2-digit",
        minute: "2-digit",
        hour12: us,
      }),
    spell: (text) => spell(text, region),
  };
}

export const LocaleContext = createContext<Locale>(
  buildLocale("UK", "London", null, () => {}),
);

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
