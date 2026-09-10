import { Rng } from "./rng.js";

// ---------------------------------------------------------------------------
// Config (env-overridable)
// ---------------------------------------------------------------------------
export const CONFIG = {
  seed: Number(process.env.SIM_SEED ?? 1),
  tickMs: Number(process.env.TICK_MS ?? 5000),
  simMinutesPerTick: Number(process.env.SIM_MINUTES_PER_TICK ?? 15),
  storeCount: Number(process.env.STORE_COUNT ?? 14),
  // Daily trading window (minutes of day). Units warm up ~40 min before
  // open and take ~90 min to cool back to ambient after close.
  openMin: Number(process.env.OPEN_MIN ?? 6 * 60),
  closeMin: Number(process.env.CLOSE_MIN ?? 22 * 60),
};

// --- Hot-hold thermal constants ------------------------------------------
const AMBIENT_C = 21;
const BAND_C = 8; // sustained deviation beyond this from target = alarm
const WARMUP_LEAD_MIN = 40;
const COOLDOWN_TAIL_MIN = 90;
const DAY_MIN = 24 * 60;
const WEEK_MIN = 7 * DAY_MIN;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type UnitState = "off" | "warming" | "holding" | "cooling";
export type Fan = { id: string; wearPercent: number };

export type Unit = {
  id: string;
  label: string;
  model: string;
  online: boolean;
  offlineTicks: number;
  state: UnitState;
  fans: Fan[];
  elementHours: number;
  cabinetTempC: number;
  targetC: number;
  doorOpenTicks: number;
  dropDepthC: number;
  scheduleCompliant: boolean;
  energyKwhToday: number;
};

export type AlarmEvent = {
  id: string;
  storeId: string;
  location: string;
  unitId: string;
  alarm: string;
  status: "Active" | "Warning" | "Resolved";
  at: string;
};

export type Store = {
  id: string;
  name: string;
  region: string;
  online: boolean;
  gatewayOnline: boolean;
  commanderOnline: boolean;
  units: Unit[];
  tempAlarms: { high: number[]; low: number[] }; // last 7 sim-days
  energy: { thisWeek: number[]; lastWeek: number[] }; // per weekday kWh
  tempHistory: { t: number; c: number; state: UnitState }[]; // rolling ~7d aggregate
};

const REGIONS = ["Central", "North", "South", "Transport Hubs"] as const;
const STORE_NAMES = [
  "Brad Lane", "Kingsway", "Maple Crescent", "Oakridge", "Harbour View",
  "Rivergate", "Willow Park", "Elm Street", "Stonebridge", "Baker Row",
  "Holloway", "Meadow Lane", "Cedar Walk", "Lakeside", "Foxglove", "Hilltop",
  "Ashgrove", "Parkside", "Chapel Row", "Market Street",
];
const EXTRA_UNITS = ["Pizza Spinner", "Roller Grill"];
const ALARM_TYPES = ["Sensor Fault", "Power Loss", "Fan Fault", "Comms Lost"];

// A store's phase for a given minute-of-day: which state its units are in,
// and (during holding) how busy it is — busier => more door openings.
function dayPhase(
  minOfDay: number,
  openMin: number,
  closeMin: number,
): { state: UnitState; trading: number } {
  const warmStart = openMin - WARMUP_LEAD_MIN;
  const coolEnd = closeMin + COOLDOWN_TAIL_MIN;
  if (minOfDay < warmStart || minOfDay >= coolEnd) return { state: "off", trading: 0 };
  if (minOfDay < openMin) return { state: "warming", trading: 0 };
  if (minOfDay >= closeMin) return { state: "cooling", trading: 0 };
  // holding — two footfall peaks (lunch ~12:30, dinner ~18:00)
  const lunch = Math.exp(-(((minOfDay - 12.5 * 60) / 90) ** 2));
  const dinner = Math.exp(-(((minOfDay - 18 * 60) / 75) ** 2));
  const trading = 0.2 + 0.8 * Math.min(1, lunch + dinner);
  return { state: "holding", trading };
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------
export class World {
  readonly startedAt = Date.now();
  tick = 0;
  simMinutes = 0;
  stores: Store[] = [];
  events: AlarmEvent[] = [];
  private rng: Rng;
  private prevDay = 0;
  private prevWeek = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.rng = new Rng(CONFIG.seed);
    // Start the clock at a mid-morning holding time so the first snapshot
    // shows a "live" unit, not a cold one.
    this.simMinutes = CONFIG.openMin + 3 * 60;
    this.build();
  }

  private build() {
    const pool = [...STORE_NAMES];
    for (let s = 0; s < CONFIG.storeCount; s += 1) {
      const name =
        pool.splice(this.rng.int(0, Math.max(0, pool.length - 1)), 1)[0] ??
        `Site ${s + 1}`;
      const id = `store-${name.toLowerCase().replace(/\s+/g, "-")}`;
      const region = REGIONS[s % REGIONS.length] as string;
      const units: Unit[] = [];
      for (const side of ["LEFT", "RIGHT"]) {
        units.push(this.makeUnit(`${id}-${side.toLowerCase()}`, `Flexeserve ${side}`));
      }
      if (this.rng.bool(0.5)) {
        const label = this.rng.pick(EXTRA_UNITS);
        units.push(
          this.makeUnit(`${id}-${label.toLowerCase().replace(/\s+/g, "-")}`, label),
        );
      }
      this.stores.push({
        id,
        name,
        region,
        online: true,
        gatewayOnline: true,
        commanderOnline: true,
        units,
        tempAlarms: { high: Array(7).fill(0), low: Array(7).fill(0) },
        energy: { thisWeek: Array(7).fill(0), lastWeek: this.seedWeek() },
        tempHistory: [],
      });
    }
  }

  private makeUnit(id: string, label: string): Unit {
    const tier = this.rng.pick([2, 3, 4, 5]);
    const target = Math.round(this.rng.float(74, 82));
    return {
      id,
      label,
      model: label.startsWith("Flexeserve") ? `Flexeserve ${tier}T 1000` : label,
      online: true,
      offlineTicks: 0,
      state: "holding",
      fans: Array.from({ length: this.rng.int(2, 4) }, (_, i) => ({
        id: `${id}-fan-${i + 1}`,
        wearPercent: this.rng.int(12, 84),
      })),
      elementHours: this.rng.int(400, 9000),
      cabinetTempC: target + this.rng.float(-2, 2),
      targetC: target,
      doorOpenTicks: 0,
      dropDepthC: 0,
      scheduleCompliant: this.rng.bool(0.9),
      energyKwhToday: this.rng.float(3, 10),
    };
  }

  // "Last week" seed — per-store daily kWh, tuned to land near what a full
  // simulated day actually accumulates (~50 kWh/store) so the dashboard's
  // this-week-vs-last-week comparison is meaningful, not lopsided.
  private seedWeek(): number[] {
    return Array.from({ length: 7 }, (_, d) =>
      // weekends run a touch busier
      Math.round(this.rng.float(44, 60) + (d === 5 || d === 6 ? 6 : 0)),
    );
  }

  start() {
    if (this.timer) return;
    this.step();
    this.timer = setInterval(() => this.step(), CONFIG.tickMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private step() {
    this.tick += 1;
    this.simMinutes += CONFIG.simMinutesPerTick;
    const simHours = CONFIG.simMinutesPerTick / 60;
    const minOfDay = this.simMinutes % DAY_MIN;
    const phase = dayPhase(minOfDay, CONFIG.openMin, CONFIG.closeMin);
    const day = Math.floor(this.simMinutes / DAY_MIN);
    const week = Math.floor(this.simMinutes / WEEK_MIN);
    const weekdayIdx = day % 7;

    for (const store of this.stores) {
      this.stepStore(store, phase, simHours, weekdayIdx);
    }

    if (day !== this.prevDay) {
      this.rollDay();
      this.prevDay = day;
    }
    if (week !== this.prevWeek) {
      for (const store of this.stores) {
        store.energy.lastWeek = store.energy.thisWeek;
        store.energy.thisWeek = Array(7).fill(0);
      }
      this.prevWeek = week;
    }

    if (this.events.length > 200) this.events.length = 200;
  }

  private stepStore(
    store: Store,
    phase: { state: UnitState; trading: number },
    simHours: number,
    weekdayIdx: number,
  ) {
    // connectivity blips
    if (store.gatewayOnline && this.rng.bool(0.003)) store.gatewayOnline = false;
    else if (!store.gatewayOnline && this.rng.bool(0.25)) store.gatewayOnline = true;
    if (store.commanderOnline && this.rng.bool(0.002)) store.commanderOnline = false;
    else if (!store.commanderOnline && this.rng.bool(0.3)) store.commanderOnline = true;
    store.online = store.gatewayOnline || store.units.some((u) => u.online);

    let tempSum = 0;
    let tempN = 0;

    for (const unit of store.units) {
      // reporting blips
      if (!unit.online) {
        unit.offlineTicks -= 1;
        if (unit.offlineTicks <= 0) unit.online = true;
      } else if (this.rng.bool(0.0015)) {
        unit.online = false;
        unit.offlineTicks = this.rng.int(2, 8);
      }
      if (!unit.online) continue;

      unit.state = phase.state;

      // --- cabinet temperature -----------------------------------------
      const noise = (amp: number) => this.rng.float(-amp, amp);
      switch (phase.state) {
        case "off":
          unit.cabinetTempC += (AMBIENT_C - unit.cabinetTempC) * 0.03 + noise(0.3);
          break;
        case "warming":
          unit.cabinetTempC += (unit.targetC - unit.cabinetTempC) * 0.1 + noise(0.6);
          break;
        case "cooling":
          unit.cabinetTempC += (AMBIENT_C - unit.cabinetTempC) * 0.04 + noise(0.4);
          break;
        case "holding":
          if (unit.doorOpenTicks > 0) {
            unit.doorOpenTicks -= 1;
            const floor = unit.targetC - unit.dropDepthC;
            unit.cabinetTempC += (floor - unit.cabinetTempC) * 0.3 + noise(0.5);
          } else {
            unit.cabinetTempC +=
              (unit.targetC - unit.cabinetTempC) * 0.22 + noise(1.4);
            if (this.rng.bool(0.03 + 0.12 * phase.trading)) {
              unit.doorOpenTicks = this.rng.int(1, 2);
              unit.dropDepthC = this.rng.float(8, 22);
            }
          }
          break;
      }
      unit.cabinetTempC = Math.round(unit.cabinetTempC * 10) / 10;
      tempSum += unit.cabinetTempC;
      tempN += 1;

      // --- temperature alarms (holding only, once recovered) ----------
      if (phase.state === "holding" && unit.doorOpenTicks === 0) {
        const dev = unit.cabinetTempC - unit.targetC;
        if (dev > BAND_C && this.rng.bool(0.5)) {
          store.tempAlarms.high[6] = (store.tempAlarms.high[6] ?? 0) + 1;
          this.addEvent(store, unit, "High Temp", "Active");
        } else if (dev < -BAND_C && this.rng.bool(0.5)) {
          store.tempAlarms.low[6] = (store.tempAlarms.low[6] ?? 0) + 1;
          this.addEvent(store, unit, "Low Temp", "Active");
        }
      }

      // --- fans & elements run while heat is on -----------------------
      if (phase.state === "warming" || phase.state === "holding") {
        for (const fan of unit.fans) {
          fan.wearPercent = Math.min(
            100,
            fan.wearPercent +
              simHours * this.rng.float(0.003, 0.02) +
              (this.rng.bool(0.008) ? this.rng.float(0.5, 2) : 0),
          );
          fan.wearPercent = Math.round(fan.wearPercent * 10) / 10;
        }
        unit.elementHours = Math.round(unit.elementHours + simHours);
      }

      // --- energy: kW draw varies sharply by state ------------------
      let kw: number;
      switch (phase.state) {
        case "off":
          kw = this.rng.float(0.02, 0.06);
          break;
        case "warming":
          kw = this.rng.float(2.4, 3.6);
          break;
        case "cooling":
          kw = this.rng.float(0.1, 0.3);
          break;
        default: {
          const recovery = unit.doorOpenTicks > 0 ? this.rng.float(0.6, 1.4) : 0;
          kw = this.rng.float(0.7, 1.1) + recovery + 0.3 * phase.trading;
        }
      }
      unit.energyKwhToday += kw * simHours;

      // schedule compliance drifts a little through the day
      if (this.rng.bool(0.015)) unit.scheduleCompliant = this.rng.bool(0.85);

      if (this.rng.bool(0.004)) {
        this.addEvent(
          store,
          unit,
          this.rng.pick(ALARM_TYPES),
          this.rng.pick(["Active", "Warning"]),
        );
      }
    }

    if (tempN > 0) {
      store.tempHistory.push({
        t: this.simMinutes,
        c: Math.round((tempSum / tempN) * 10) / 10,
        state: phase.state,
      });
      const keepFrom = this.simMinutes - WEEK_MIN;
      while (store.tempHistory.length && (store.tempHistory[0]?.t ?? 0) < keepFrom) {
        store.tempHistory.shift();
      }
    }

    const storeKwh = store.units.reduce((s, u) => s + u.energyKwhToday, 0);
    store.energy.thisWeek[weekdayIdx] = Math.round(storeKwh);
  }

  private rollDay() {
    for (const store of this.stores) {
      store.tempAlarms.high.shift();
      store.tempAlarms.high.push(0);
      store.tempAlarms.low.shift();
      store.tempAlarms.low.push(0);
      for (const unit of store.units) {
        unit.energyKwhToday = 0;
        unit.scheduleCompliant = this.rng.bool(0.9);
      }
    }
    for (const e of this.events) {
      if (e.status === "Active" && this.rng.bool(0.4)) e.status = "Resolved";
      else if (e.status === "Warning" && this.rng.bool(0.5)) e.status = "Resolved";
    }
  }

  private addEvent(
    store: Store,
    unit: Unit,
    alarm: string,
    status: AlarmEvent["status"],
  ) {
    this.events.unshift({
      id: `evt-${this.tick}-${this.events.length}-${unit.id}`,
      storeId: store.id,
      location: store.name,
      unitId: unit.id,
      alarm,
      status,
      at: new Date().toISOString(),
    });
  }
}
