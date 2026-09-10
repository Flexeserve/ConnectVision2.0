import Fastify from "fastify";
import cors from "@fastify/cors";
import { World, CONFIG, type Store, type AlarmEvent } from "./world.js";

const PORT = Number(process.env.PORT ?? 8080);
const HOST = "0.0.0.0";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
const EOL_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 95;

const world = new World();
world.start();

// ---------------------------------------------------------------------------
// Scope filtering + snapshot
// ---------------------------------------------------------------------------
function storesInScope(scope: string | undefined): Store[] {
  if (!scope || scope === "all") return world.stores;
  const byId = world.stores.filter((s) => s.id === scope);
  if (byId.length) return byId;
  const byRegion = world.stores.filter(
    (s) => s.region.toLowerCase() === scope.toLowerCase(),
  );
  return byRegion.length ? byRegion : world.stores;
}

function timeLabel(iso: string): string {
  return new Date(iso).toISOString().slice(11, 16);
}

function buildSnapshot(scope: string | undefined) {
  const stores = storesInScope(scope);
  const units = stores.flatMap((s) => s.units);
  const onlineUnits = units.filter((u) => u.online);
  const eventsInScope = world.events.filter((e) =>
    stores.some((s) => s.id === e.storeId),
  );

  // fan life
  const fans = onlineUnits.flatMap((u) =>
    u.fans.map((f) => ({
      unitId: u.id,
      storeName: stores.find((s) => s.units.includes(u))?.name ?? "",
      percentUsed: f.wearPercent,
    })),
  );
  const nearing = fans
    .filter((f) => f.percentUsed >= EOL_THRESHOLD)
    .sort((a, b) => b.percentUsed - a.percentUsed);
  const critical = nearing.filter((f) => f.percentUsed >= CRITICAL_THRESHOLD).length;

  // cabinet temperature — pointwise average across in-scope stores' histories
  const histLen = Math.max(0, ...stores.map((s) => s.tempHistory.length));
  const series: { t: number; c: number; state: string }[] = [];
  for (let i = 0; i < histLen; i += 1) {
    const points = stores
      .map((s) => s.tempHistory[s.tempHistory.length - histLen + i])
      .filter((p): p is NonNullable<typeof p> => !!p);
    if (points.length) {
      series.push({
        t: points[0]!.t,
        c: Math.round((points.reduce((a, p) => a + p.c, 0) / points.length) * 10) / 10,
        state: points[0]!.state,
      });
    }
  }
  const latestC = series.length ? series[series.length - 1]!.c : null;
  const holdingPoints = series.filter((p) => p.state === "holding");
  const avgHoldingC = holdingPoints.length
    ? Math.round(
        (holdingPoints.reduce((a, p) => a + p.c, 0) / holdingPoints.length) * 10,
      ) / 10
    : null;
  const avgTargetC = onlineUnits.length
    ? Math.round(
        (onlineUnits.reduce((a, u) => a + u.targetC, 0) / onlineUnits.length) * 10,
      ) / 10
    : null;

  // temperature alarms by day (7)
  const byDay = Array.from({ length: 7 }, (_, d) => ({
    dayIndex: d,
    high: stores.reduce((a, s) => a + (s.tempAlarms.high[d] ?? 0), 0),
    low: stores.reduce((a, s) => a + (s.tempAlarms.low[d] ?? 0), 0),
  }));

  // energy
  const thisWeekKwh = Array.from({ length: 7 }, (_, d) =>
    stores.reduce((a, s) => a + (s.energy.thisWeek[d] ?? 0), 0),
  );
  const lastWeekKwh = Array.from({ length: 7 }, (_, d) =>
    stores.reduce((a, s) => a + (s.energy.lastWeek[d] ?? 0), 0),
  );

  const compliantUnits = onlineUnits.filter((u) => u.scheduleCompliant).length;

  const minOfDay = world.simMinutes % (24 * 60);
  const openMin = CONFIG.openMin;
  const closeMin = CONFIG.closeMin;

  return {
    scope: scope ?? "all",
    tick: world.tick,
    simMinutes: world.simMinutes,
    simTimeOfDay: `${String(Math.floor(minOfDay / 60)).padStart(2, "0")}:${String(
      Math.floor(minOfDay % 60),
    ).padStart(2, "0")}`,
    generatedAt: new Date().toISOString(),

    operating: {
      openMin,
      closeMin,
      open: `${String(Math.floor(openMin / 60)).padStart(2, "0")}:00`,
      close: `${String(Math.floor(closeMin / 60)).padStart(2, "0")}:00`,
      // majority state right now across in-scope units
      phase:
        series.length && series[series.length - 1]
          ? series[series.length - 1]!.state
          : "holding",
    },

    fanLife: {
      count: nearing.length,
      critical,
      warning: nearing.length - critical,
      nearingEndOfLife: nearing.slice(0, 20),
    },
    elementLife: {
      totalHours: onlineUnits.reduce((a, u) => a + u.elementHours, 0),
    },
    cabinetTemp: { latestC, avgHoldingC, targetC: avgTargetC, series },
    temperatureAlarms: {
      today: { high: byDay[6]!.high, low: byDay[6]!.low },
      byDay,
    },
    activeAlarms: {
      count: eventsInScope.filter((e) => e.status === "Active").length,
    },
    offlineDevices: {
      gateways: stores.filter((s) => !s.gatewayOnline).length,
      commanders: stores.filter((s) => !s.commanderOnline).length,
      units: units.length - onlineUnits.length,
      get total() {
        return this.gateways + this.commanders + this.units;
      },
    },
    cloudConnected: {
      connected: onlineUnits.length,
      offline: units.length - onlineUnits.length,
    },
    storesOnline: {
      online: stores.filter((s) => s.online).length,
      offline: stores.filter((s) => !s.online).length,
      total: stores.length,
    },
    scheduleCompliance: {
      compliantPercent: onlineUnits.length
        ? Math.round((compliantUnits / onlineUnits.length) * 100)
        : 100,
    },
    energyCost: {
      thisWeekKwh,
      lastWeekKwh,
      totalThisWeekKwh: thisWeekKwh.reduce((a, b) => a + b, 0),
      totalLastWeekKwh: lastWeekKwh.reduce((a, b) => a + b, 0),
    },
    alarmSummary: eventsInScope.slice(0, 40).map((e: AlarmEvent) => ({
      id: e.id,
      location: e.location,
      alarm: e.alarm,
      status: e.status,
      time: timeLabel(e.at),
    })),
  };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });
await app.register(cors, { origin: CORS_ORIGIN });

app.get("/health", async () => ({
  ok: true,
  uptimeSec: Math.round((Date.now() - world.startedAt) / 1000),
  tick: world.tick,
  simMinutes: world.simMinutes,
  stores: world.stores.length,
}));

app.get("/api/stores", async () =>
  world.stores.map((s) => ({
    id: s.id,
    name: s.name,
    region: s.region,
    online: s.online,
    units: s.units.length,
    activeAlarms: world.events.filter(
      (e) => e.storeId === s.id && e.status === "Active",
    ).length,
  })),
);

app.get<{ Params: { id: string } }>("/api/stores/:id", async (req, reply) => {
  const store = world.stores.find((s) => s.id === req.params.id);
  if (!store) return reply.code(404).send({ error: "store not found" });
  return store;
});

app.get<{ Querystring: { limit?: string; scope?: string } }>(
  "/api/alarms",
  async (req) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
    const stores = storesInScope(req.query.scope);
    return world.events
      .filter((e) => stores.some((s) => s.id === e.storeId))
      .slice(0, limit);
  },
);

app.get<{ Querystring: { scope?: string } }>("/api/snapshot", async (req) =>
  buildSnapshot(req.query.scope),
);

// Server-Sent Events — a fresh snapshot every tick.
const sseClients = new Set<import("node:http").ServerResponse>();
app.get<{ Querystring: { scope?: string } }>("/api/stream", (req, reply) => {
  const res = reply.raw;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": CORS_ORIGIN,
  });
  res.write(`retry: ${CONFIG.tickMs}\n\n`);
  const scope = req.query.scope;
  const send = () =>
    res.write(`data: ${JSON.stringify(buildSnapshot(scope))}\n\n`);
  send();
  const timer = setInterval(send, CONFIG.tickMs);
  sseClients.add(res);
  req.raw.on("close", () => {
    clearInterval(timer);
    sseClients.delete(res);
  });
});

app.get("/", async (_req, reply) => {
  reply.type("text/html").send(`<!doctype html><meta charset="utf-8">
<title>ConnectVision Device Simulator</title>
<style>body{font:14px/1.6 ui-monospace,monospace;max-width:44rem;margin:3rem auto;padding:0 1rem}a{color:#d94d14}</style>
<h1>ConnectVision Device Simulator</h1>
<p>Simulating <b>${world.stores.length}</b> stores /
<b>${world.stores.reduce((n, s) => n + s.units.length, 0)}</b> units.
Tick ${world.tick}, every ${CONFIG.tickMs}ms (${CONFIG.simMinutesPerTick} sim-min/tick).</p>
<ul>
<li><a href="/health">/health</a></li>
<li><a href="/api/stores">/api/stores</a></li>
<li><code>/api/stores/:id</code></li>
<li><a href="/api/snapshot">/api/snapshot</a> &nbsp;<code>?scope=all|&lt;region&gt;|&lt;storeId&gt;</code></li>
<li><a href="/api/alarms">/api/alarms</a> &nbsp;<code>?limit=50&amp;scope=</code></li>
<li><code>/api/stream</code> &nbsp;(Server-Sent Events, one snapshot per tick)</li>
</ul>`);
});

app
  .listen({ port: PORT, host: HOST })
  .then((addr) => app.log.info(`device-simulator listening on ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    world.stop();
    app.close().finally(() => process.exit(0));
  });
}
