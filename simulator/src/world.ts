import { Rng } from "./rng.js";

// ---------------------------------------------------------------------------
// Config (env-overridable)
// ---------------------------------------------------------------------------
export const CONFIG = {
  seed: Number(process.env.SIM_SEED ?? 1),
  tickMs: Number(process.env.TICK_MS ?? 5000),
  simMinutesPerTick: Number(process.env.SIM_MINUTES_PER_TICK ?? 20),
  storeCount: Number(process.env.STORE_COUNT ?? 14),
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Fan = { id: string; wearPercent: number };

export type Unit = {
  id: string;
  label: string;
  model: string;
  online: boolean;
  offlineTicks: number;
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
  at: string; // ISO
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
  tempHistory: { t: number; c: number }[]; // rolling ~7 sim-days, aggregate
};

const REGIONS = ["Central", "North", "South", "Transport Hubs"] as const;
const STORE_NAMES = [
  "Brad Lane", "Kingsway", "Maple Crescent", "Oakridge", "Harbour View",
  "Rivergate", "Willow Park", "Elm Street", "Stonebridge", "Baker Row",
  "Holloway", "Meadow Lane", "Cedar Walk", "Lakeside", "Foxglove", "Hilltop",
  "Ashgrove", "Parkside", "Chapel Row", "Market Street",
];
const EXTRA_UNITS = ["Pizza Spinner", "Roller Grill"];
const ALARM_TYPES = [
  "High Temp", "Low Temp", "Door Open", "Sensor Fault",
  "Power Loss", "Low Humidity", "Comms Lost",
];

const DAY_MIN = 24 * 60;
const WEEK_MIN = 7 * DAY_MIN;
const TEMP_BAND_C = 2.5; // deviation beyond this from target raises an alarm

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------
export class World {
  readonly startedAt = Date.now();
  tick = 0;
  simMinutes = 0; // sim-clock minutes since boot
  stores: Store[] = [];
  events: AlarmEvent[] = [];
  private rng: Rng;
  private prevDay = 0;
  private prevWeek = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.rng = new Rng(CONFIG.seed);
    this.build();
  }

  // --- construction ------------------------------------------------------
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
        units.push(this.makeUnit(`${id}-${side.toLowerCase()}`, `Flexeserve ${side}`, name));
      }
      if (this.rng.bool(0.5)) {
        const label = this.rng.pick(EXTRA_UNITS);
        units.push(this.makeUnit(`${id}-${label.toLowerCase().replace(/\s+/g, "-")}`, label, name));
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

  private makeUnit(id: string, label: string, storeName: string): Unit {
    const tiers = [2, 3, 4, 5];
    const tier = this.rng.pick(tiers);
    const fanCount = this.rng.int(2, 4);
    return {
      id,
      label,
      model: label.startsWith("Flexeserve")
        ? `Flexeserve ${tier}T 1000`
        : label,
      online: true,
      offlineTicks: 0,
      fans: Array.from({ length: fanCount }, (_, i) => ({
        id: `${id}-fan-${i + 1}`,
        wearPercent: this.rng.int(15, 88),
      })),
      elementHours: this.rng.int(400, 9000),
      cabinetTempC: this.rng.float(3, 4),
      targetC: 3.5,
      doorOpenTicks: 0,
      dropDepthC: 0,
      scheduleCompliant: this.rng.bool(0.85),
      energyKwhToday: this.rng.float(2, 8),
    };
  }

  private seedWeek(): number[] {
    return Array.from({ length: 7 }, () => Math.round(this.rng.float(120, 320)));
  }

  // --- loop ------------------------------------------------------------
  start() {
    if (this.timer) return;
    this.step(); // one immediate step so the first snapshot isn't empty
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
    const day = Math.floor(this.simMinutes / DAY_MIN);
    const week = Math.floor(this.simMinutes / WEEK_MIN);

    for (const store of this.stores) {
      this.stepStore(store, simHours);
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

    // keep the event log bounded
    if (this.events.length > 200) this.events.length = 200;
  }

  private stepStore(store: Store, simHours: number) {
    // connectivity blips
    if (store.gatewayOnline && this.rng.bool(0.004)) store.gatewayOnline = false;
    else if (!store.gatewayOnline && this.rng.bool(0.25)) store.gatewayOnline = true;
    if (store.commanderOnline && this.rng.bool(0.003)) store.commanderOnline = false;
    else if (!store.commanderOnline && this.rng.bool(0.3)) store.commanderOnline = true;
    store.online = store.gatewayOnline || store.units.some((u) => u.online);

    let tempSum = 0;
    let tempN = 0;
    const weekdayIdx = Math.floor(this.simMinutes / DAY_MIN) % 7;

    for (const unit of store.units) {
      // offline recovery
      if (!unit.online) {
        unit.offlineTicks -= 1;
        if (unit.offlineTicks <= 0) unit.online = true;
      } else if (this.rng.bool(0.002)) {
        unit.online = false;
        unit.offlineTicks = this.rng.int(2, 8);
      }
      if (!unit.online) continue;

      // --- cabinet temperature -------------------------------------
      if (unit.doorOpenTicks > 0) {
        unit.doorOpenTicks -= 1;
        const floor = unit.targetC - unit.dropDepthC;
        unit.cabinetTempC += (floor - unit.cabinetTempC) * 0.35 + this.rng.float(-0.2, 0.2);
      } else {
        unit.cabinetTempC += (unit.targetC - unit.cabinetTempC) * 0.25 + this.rng.float(-0.35, 0.35);
        if (this.rng.bool(0.05)) {
          unit.doorOpenTicks = this.rng.int(1, 3);
          unit.dropDepthC = this.rng.float(6, 14);
        }
      }
      unit.cabinetTempC = Math.round(unit.cabinetTempC * 10) / 10;
      tempSum += unit.cabinetTempC;
      tempN += 1;

      // temperature alarm
      const deviation = unit.cabinetTempC - unit.targetC;
      if (Math.abs(deviation) > TEMP_BAND_C && this.rng.bool(0.6)) {
        const isHigh = deviation > 0;
        if (isHigh) store.tempAlarms.high[6] = (store.tempAlarms.high[6] ?? 0) + 1;
        else store.tempAlarms.low[6] = (store.tempAlarms.low[6] ?? 0) + 1;
        this.addEvent(store, unit, isHigh ? "High Temp" : "Low Temp", "Active");
      }

      // --- fan wear ----------------------------------------------------
      for (const fan of unit.fans) {
        fan.wearPercent = Math.min(
          100,
          fan.wearPercent + simHours * this.rng.float(0.002, 0.02) + (this.rng.bool(0.01) ? this.rng.float(0.5, 2) : 0),
        );
        fan.wearPercent = Math.round(fan.wearPercent * 10) / 10;
      }

      // --- elements & energy ----------------------------------------
      const duty = 0.55 + this.rng.float(-0.1, 0.1);
      unit.elementHours = Math.round(unit.elementHours + simHours * duty);
      const doorPenalty = unit.doorOpenTicks > 0 ? this.rng.float(0.3, 0.8) : 0;
      unit.energyKwhToday += simHours * (this.rng.float(0.8, 1.4) + doorPenalty);

      // --- schedule compliance -------------------------------------
      if (this.rng.bool(0.02)) unit.scheduleCompliant = this.rng.bool(0.8);

      // occasional non-temp alarms
      if (this.rng.bool(0.006)) {
        this.addEvent(store, unit, this.rng.pick(ALARM_TYPES), this.rng.pick(["Active", "Warning"]));
      }
    }

    // roll the store's aggregate temp history (~1 point per tick, ~7 sim-days kept)
    if (tempN > 0) {
      store.tempHistory.push({
        t: this.simMinutes,
        c: Math.round((tempSum / tempN) * 10) / 10,
      });
      const keepFrom = this.simMinutes - WEEK_MIN;
      while (store.tempHistory.length && (store.tempHistory[0]?.t ?? 0) < keepFrom) {
        store.tempHistory.shift();
      }
    }

    // accrue today's energy into the weekday bucket
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
        unit.energyKwhToday = this.rng.float(1, 4);
        unit.scheduleCompliant = this.rng.bool(0.88);
      }
    }
    // age active events toward resolved
    for (const e of this.events) {
      if (e.status === "Active" && this.rng.bool(0.4)) e.status = "Resolved";
      else if (e.status === "Warning" && this.rng.bool(0.5)) e.status = "Resolved";
    }
  }

  private addEvent(store: Store, unit: Unit, alarm: string, status: AlarmEvent["status"]) {
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
