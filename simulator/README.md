# ConnectVision Device Simulator

A small stateful service that simulates Flexeserve Connect devices — stores,
Flexeserve units, fans, heating elements, gateways, commanders — and serves
their evolving telemetry over HTTP. Built so the dashboard can consume
live-ish data instead of generating it client-side.

**Live:** https://connectvision-device-simulator-production.up.railway.app
(Railway project `connectvision-device-simulator`, separate from the
dashboard app.)

## Run locally

```bash
cd simulator
npm install
npm run dev          # tsx watch, http://localhost:8080
# or
npm run build && npm start
```

## What it models

A seeded world of ~14 stores, each with a Flexeserve LEFT + RIGHT unit
(plus sometimes a Pizza Spinner / Roller Grill), a gateway and a commander.
Every tick (`TICK_MS`, default 5s) advances a sim clock by
`SIM_MINUTES_PER_TICK` (default 20) and updates:

- cabinet temperature (random walk toward target, periodic door-open dips)
- temperature alarms (high/low when it drifts out of band) — 7-day daily buckets
- fan wear %, cumulative element hours
- energy kWh per unit → per-weekday store buckets (this week / last week)
- schedule compliance, unit/gateway/commander offline blips
- a rolling alarm event log

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | liveness + tick counter |
| GET | `/api/stores` | store list with rollup stats |
| GET | `/api/stores/:id` | full store detail |
| GET | `/api/alarms?limit=&scope=` | recent alarm events |
| GET | `/api/snapshot?scope=` | dashboard-shaped aggregate (one object per widget) |
| GET | `/api/stream?scope=` | Server-Sent Events — a snapshot every tick |
| GET | `/` | HTML index of the above |

`scope` = `all` (default), a region name (`Central`, `North`, …), or a store id.

`/api/snapshot` returns: `fanLife`, `elementLife`, `cabinetTemp`,
`temperatureAlarms`, `activeAlarms`, `offlineDevices`, `cloudConnected`,
`storesOnline`, `scheduleCompliance`, `energyCost`, `alarmSummary` — each
keyed to the widget that consumes it.

## Config (env)

| Var | Default | |
|---|---|---|
| `PORT` | `8080` | Railway injects this |
| `SIM_SEED` | `1` | starting world seed |
| `TICK_MS` | `5000` | real ms per tick |
| `SIM_MINUTES_PER_TICK` | `20` | sim time advanced per tick |
| `STORE_COUNT` | `14` | |
| `CORS_ORIGIN` | `*` | set to the dashboard origin in prod |
| `LOG_LEVEL` | `info` | |

## Deploy to Railway

From this directory:

```bash
cd simulator
railway up
```

`railway up` signs you in if needed, creates the project + service, and
deploys. `railway.json` here pins the Nixpacks build
(`npm ci && npm run build`), the start command (`npm start`) and the
`/health` check. After it's live, generate a public URL:

```bash
railway domain
```

Then point the dashboard at it (and set `CORS_ORIGIN` to the dashboard's
origin via `railway variables`).
