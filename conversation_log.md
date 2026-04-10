# Conversation Log — Advance Wars Web Game Architecture Overhaul

**Date:** April 10, 2026  
**Branch:** `ai_build`

---

## 1. Initial Request

> Read the implementation_plan.md, review it and propose changes if necessary. My end goal is to build a web game that can be hosted on AWS, with dedicated server and client setup. It must be Docker containerizable. Implement code too. I want to allow possible future sprite change as current sprites have no animations. I aim to copy and implement campaign single-player mode and replay missions. Design code base with intent to integrate simulating other game of the Advanced War series, to replay and host multiplayer contest.

---

## 2. Codebase Analysis

Read and analyzed the full existing codebase:

| Aspect | Status |
|--------|--------|
| Core game loop | Working (input → state → render) |
| Map rendering | Functional (5 layers render correctly via PixiJS) |
| Pathfinding | Implemented (A* + BFS) |
| Unit movement | Partial (MovingUnitState is a stub, no animation) |
| Combat | TODO (ActionMenuState, CombatResolveState are stubs) |
| Buildings | Not implemented |
| Networking | Not started |
| Unit entity | Skeleton only |
| AI | Not started |
| UI panels | Planned |

**Existing tech stack:** Vite + TypeScript + PixiJS v8, Kenney "Tiny Battle" 16×16 tileset (198 tiles), Tiled JSON maps, custom state machine.

---

## 3. Clarifying Questions & Answers

| Question | Answer |
|----------|--------|
| Server architecture | **Authoritative server** (all game logic on server, client just renders) |
| AWS deployment | **ECS Fargate + CloudFront** |
| Repo strategy | **Monorepo** (client + server + shared types in one repo) |
| Advance Wars series scope | **Full series** (AW1, AW2, Dual Strike, Days of Ruin) |

---

## 4. Architecture Plan

### Key Decisions
- **Authoritative server** — prevents cheating, enables competitive play
- **Command pattern** — all player actions are serializable commands; replays are free
- **Pluggable rule engine** — `IGameRuleSet` interface with per-game data modules (aw1/aw2/awds/awdor)
- **Sprite abstraction** — `ISpriteProvider` interface allows swapping static/animated sprite sets
- **Offline-capable** — `LocalServerAdapter` runs GameEngine client-side for single-player without network
- **Docker + AWS** — multi-stage Dockerfiles, docker-compose for dev/prod, ECS Fargate + CloudFront

### Implementation Priority
Phase 0 → 1 → 3.2 (sprite abstraction) → 2 → 3 (rest) → 4 → 5 → 6

---

## 5. Implementation Summary

### Phase 0 — Monorepo Scaffold & Migration ✅

**What changed:**
- Created `packages/shared/`, `packages/server/`, `packages/client/` directories
- Moved `src/` → `packages/client/src/`, `public/` → `packages/client/public/`, `index.html` → `packages/client/`
- Root `package.json` now uses npm workspaces
- Created `tsconfig.base.json` (shared compiler options) at root
- Each package has its own `package.json` and `tsconfig.json`
- Client has `vite.config.ts` with alias for `@web-game/shared` and proxy config for socket.io

**Files created/modified:**
- `package.json` (root) — workspaces config
- `tsconfig.base.json` — shared TS config
- `tsconfig.json` (root) — project references only
- `packages/shared/package.json`, `packages/shared/tsconfig.json`
- `packages/server/package.json`, `packages/server/tsconfig.json`
- `packages/client/package.json`, `packages/client/tsconfig.json`, `packages/client/vite.config.ts`

---

### Phase 1 — Shared Types & Game Rule Engine ✅

**1.1 — Core Type System** (`packages/shared/src/types/`)
- `index.ts` — `Point`, `TeamColor`, `Player`, `TerrainType` (17 types), `UnitType` (24 types), `MovementClass` (8 types), `UnitState`, `BuildingState`, `TerrainCell`, `MapDefinition`, `Weather`, `GameRuleSetId`, `GameConfig`, `PlayerConfig`, `GameState`, `TurnPhase`
- `commands.ts` — `Command` discriminated union: `MoveCommand`, `AttackCommand`, `CaptureCommand`, `BuildCommand`, `WaitCommand`, `EndTurnCommand`, `COPowerCommand`, `LoadCommand`, `UnloadCommand`, `JoinCommand`
- `events.ts` — `GameEvent` discriminated union (16 event types): `UnitMoved`, `UnitDamaged`, `UnitDestroyed`, `UnitCreated`, `UnitWaited`, `BuildingCaptured`, `CaptureProgress`, `TurnChanged`, `Income`, `WeatherChanged`, `COPowerActivated`, `GameOver`, `UnitLoaded`, `UnitUnloaded`, `UnitJoined`, `FundsChanged`

**1.2 — Game Rule Engine** (`packages/shared/src/rules/`)
- `IGameRuleSet.ts` — Interface with: `getUnitStats()`, `getTerrainStats()`, `getMovementCost()`, `getAttackRange()`, `getVisionRange()`, `calculateDamage()`, `canAttack()`, `getUnitCost()`, `getBuildableUnits()`, `getRepairAmount()`, `getFuelCostPerTurn()`, `getIncomePerProperty()`
- `GameEngine.ts` — Pure-function command processor: `applyCommand(state, command, rules) → { newState, events }`, `validateCommand()`, handles all 10 command types, victory checking, turn management with income/repair/resupply/fuel consumption
- `Pathfinder.ts` — A* with weighted movement costs via `PathGrid` interface, `getReachableTiles()` BFS for movement range display
- `RuleSetFactory.ts` — `createRuleSet('aw1' | 'aw2' | 'awds' | 'awdor')`

**1.3 — AW1 Data Module** (`packages/shared/src/data/aw1/`)
- `index.ts` — `AW1RuleSet` implementing `IGameRuleSet` with:
  - 24 unit types with real AW1 stats (cost, move range, ammo, fuel, vision, attack range, movement class, can capture, load capacity)
  - 17 terrain types with defense stars, movement costs per movement class, property status, repair capability, income
  - ~150-entry damage matrix (base damage percentages for attacker→defender)
  - Full damage calculation with terrain defense, HP factor, terrain reduction

**1.4 — Replay Codec** (`packages/shared/src/replay/`)
- `ReplayData` type with version, metadata (gameId, config, timestamps, winner, player names), and ordered `ReplayCommand[]`
- `encodeReplay()` / `decodeReplay()` (JSON-based, extensible to binary later)

**Barrel export:** `packages/shared/src/index.ts` re-exports everything

---

### Phase 3.2 — Sprite Provider Abstraction ✅

**Files created:**
- `packages/client/src/rendering/ISpriteProvider.ts` — Interface with `getUnitTexture(type, team, action?)`, `getBuildingTexture()`, `getTerrainTexture()`, `getOverlayTexture()`, `getHealthTexture()`, `getTileTextureByTiledId()`. Supports both static `Texture` and `AnimatedTexture` (frames + fps) return types.
- `packages/client/src/sprites/KenneySpriteProvider.ts` — Implements `ISpriteProvider` wrapping the existing Kenney tileset. Maps semantic types (unit type + team color) to Kenney tile IDs. Slices spritesheet on `init()`. Full mapping tables for all 5 teams × 13 unit types, 5 teams × 7 building types, terrain types, overlay types, and health digits.

**Files modified:**
- `packages/client/src/core/AssetLoader.ts` — Added `KenneySpriteProvider` initialization in `loadAll()`, exposed `getSpriteProvider()` static accessor, made `loadMapData()` public

---

### Phase 2 — Authoritative Game Server ✅

**2.1 — Server Entry & Transport** (`packages/server/src/`)
- `index.ts` — Express + Socket.io server on port 3000, `/health` endpoint, CORS configured for client origin
- `net/SocketHandler.ts` — Full socket event wiring:
  - Lobby events: `lobby:create`, `lobby:join`, `lobby:leave`, `lobby:ready`, `lobby:start`, `lobby:list`
  - Game events: `game:command` (validates player, delegates to session), `game:getState`
  - Disconnect cleanup (leave lobby, notify others)

**2.2 — Game Session** (`packages/server/src/game/`)
- `GameSession.ts` — Holds `GameState` + `IGameRuleSet` + connected players + replay log. `receiveCommand()` validates → applies via `GameEngine.applyCommand()` → logs → broadcasts events.
- `GameSessionManager.ts` — CRUD for sessions, lookup by ID or socket ID.

**2.3 — Lobby** (`packages/server/src/lobby/`)
- `LobbyManager.ts` — Create/join/leave rooms, ready check, slot-based player management, AI slot support, game start → creates `GameSession` from lobby config.

---

### Phase 5.1 — Docker & Compose ✅

**Files created:**
- `packages/server/Dockerfile` — Multi-stage: Node 20-alpine build → slim runtime, non-root user, healthcheck
- `packages/client/Dockerfile` — Multi-stage: Vite build → nginx:alpine
- `packages/client/nginx.conf` — SPA fallback, WebSocket proxy to server, gzip, asset caching
- `docker-compose.yml` — Dev: hot reload via volume mounts, server on :3000, client on :5173
- `docker-compose.prod.yml` — Production images, server on :3000, client on :8080
- `Dockerfile.dev` (root) — Updated for monorepo workspace deps

---

### Client-side fixes ✅

Fixed all strict TypeScript errors across migrated client code:
- Prefixed unused parameters with `_` in stub state handlers
- Removed unused imports and type aliases
- Removed unused class fields (`overlayMap` in MovementSystem, `currentDirectionVector`)
- Updated `Unit.ts` entity to expose fields as `readonly` and re-export shared `UnitState` type

---

## 6. Verification Results

| Check | Result |
|-------|--------|
| `npm install` (workspace) | ✅ 192 packages, 0 vulnerabilities |
| `npm run build -w packages/shared` | ✅ Clean compilation |
| `npm run build -w packages/server` | ✅ Clean compilation |
| `npx tsc --noEmit -p packages/client/tsconfig.json` | ✅ Clean compilation |
| Client dev server (`npm run dev -w packages/client`) | ✅ Vite running on localhost:5173 |
| Game server (`npm run dev -w packages/server`) | ✅ Listening on port 3000 |

---

## 7. New Project Structure

```
web-game/
├── packages/
│   ├── shared/                          # Game logic & types (used by both)
│   │   ├── src/
│   │   │   ├── index.ts                 # Barrel export
│   │   │   ├── types/
│   │   │   │   ├── index.ts             # GameState, Unit, Building, Player, etc.
│   │   │   │   ├── commands.ts          # Command discriminated union (10 types)
│   │   │   │   └── events.ts            # GameEvent discriminated union (16 types)
│   │   │   ├── rules/
│   │   │   │   ├── IGameRuleSet.ts      # Rule engine interface
│   │   │   │   ├── GameEngine.ts        # Pure-function command applicator
│   │   │   │   ├── Pathfinder.ts        # A* + BFS with movement costs
│   │   │   │   └── RuleSetFactory.ts    # createRuleSet('aw1'|'aw2'|'awds'|'awdor')
│   │   │   ├── data/
│   │   │   │   └── aw1/index.ts         # AW1 unit stats, terrain, damage matrix
│   │   │   └── replay/index.ts          # Replay encode/decode
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── server/                          # Authoritative game server
│   │   ├── src/
│   │   │   ├── index.ts                 # Express + Socket.io entry
│   │   │   ├── game/
│   │   │   │   ├── GameSession.ts       # Holds state, receives commands, broadcasts events
│   │   │   │   └── GameSessionManager.ts
│   │   │   ├── lobby/
│   │   │   │   └── LobbyManager.ts      # Room management, ready check, game start
│   │   │   └── net/
│   │   │       └── SocketHandler.ts     # Socket.io event routing
│   │   ├── Dockerfile                   # Multi-stage production build
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── client/                          # PixiJS thin client
│       ├── public/assets/               # Kenney tileset + maps (unchanged)
│       ├── src/
│       │   ├── main.ts                  # PixiJS app bootstrap
│       │   ├── core/                    # Game.ts, AssetLoader, InputManager, etc.
│       │   ├── rendering/
│       │   │   └── ISpriteProvider.ts   # Sprite abstraction interface
│       │   ├── sprites/
│       │   │   └── KenneySpriteProvider.ts  # Kenney tileset implementation
│       │   ├── map/                     # TileMap, Pathfinder, TileMapRenderer
│       │   ├── states/                  # IdleState, UnitSelectedState, etc.
│       │   ├── systems/                 # MovementSystem
│       │   ├── entities/                # Unit (legacy)
│       │   └── ui/                      # OverlayMap, OverlayRenderer
│       ├── index.html
│       ├── Dockerfile                   # Multi-stage → nginx:alpine
│       ├── nginx.conf                   # SPA + WS proxy
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml                   # Dev
├── docker-compose.prod.yml              # Production
├── Dockerfile.dev                       # Dev base image
├── tsconfig.base.json                   # Shared TS config
├── tsconfig.json                        # Project references
├── package.json                         # Workspace root
└── infrastructure/                      # (placeholder for AWS CDK)
```

---

## 8. Key Technical Notes

- **erasableSyntaxOnly** in tsconfig — cannot use TypeScript parameter properties (`private foo: Bar` in constructor params)
- **noUnusedLocals/noUnusedParameters** in client tsconfig — must prefix unused params with `_`
- **TILE_ID_MAP** is 1-based; texture `Map<number, Texture>` is 0-based — subtract 1 for lookup
- **Tiled flip flags** (high bits 0x80000000, 0x40000000, 0x20000000) must be masked from tile IDs
- **Sprite provider** — `ISpriteProvider` supports both `Texture` and `AnimatedTexture` (frames + fps) for future animation
- **GameEngine** is a pure function — `applyCommand(state, cmd, rules) → { newState, events }` — no side effects, fully testable

---

## 9. What's Next (Not Yet Implemented)

| Phase | Description | Status |
|-------|-------------|--------|
| 3.1 | Client network layer (ServerConnection, CommandSender, StateReceiver) | Not started |
| 3.3 | Animation system (AnimationController, TweenManager) | Not started |
| 3.4 | Client state machine rework (server-driven transitions) | Not started |
| 3.5 | Client TileMap mirror (read-only, updated by events) | Not started |
| 3.6 | Renderer rework (inject ISpriteProvider) | Not started |
| 4 | Campaign & mission system | Not started |
| 5.2 | AWS CDK infrastructure | Not started |
| 5.3 | CI/CD pipeline | Not started |
| 6 | Multiplayer contest system (ranked, tournaments, spectator) | Not started |
