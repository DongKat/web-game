# Refactoring Opportunities

## Critical

### 1. MovementSystem API Mismatch
**File**: `src/systems/MovementSystem.ts`
- References `tileMap.getTile()` expecting `0` for impassable, but `GameMap.getTile()` returns `IEntity` objects
- References non-existent `tileMap.moveEntity()` and `overlayMap.moveOverlay()`
- References non-existent `'Vehicles'` layer — `GameMap` only has `'Terrain'`, `'Building'`, `'Unit'`
- **Action**: Rewrite to match actual `GameMap` API

---

## High Impact

### 2. Renderer God Class
**File**: `src/renderer/Renderer.ts`
- Handles 6 responsibilities: initialization, sprite creation, terrain/building/unit rendering, autotiling, color mapping, update flag management
- **Action**: Extract `TerrainTileRenderer`, `AutoTiler`, and `SpriteFactory` classes

### 3. Duplicate Layer Rendering Pattern
**File**: `src/renderer/Renderer.ts`
- `renderTerrain()`, `renderBuildings()`, `renderUnits()` share ~70% identical structure: get layer → clear container → loop tiles → look up entity → get texture → create sprite → add to container
- **Action**: Extract generic `renderLayer(layerName, textureCallback)` method

### 4. Duplicate Pathfinding Algorithms
**File**: `src/map/Pathfinder.ts`
- `AStarAlgorithm` and `BFSAlgorithm` share ~70% code: neighbor generation, bounds checking, visited tracking, path reconstruction
- **Action**: Extract a base `PathFindingAlgorithm` class; keep only heuristic/queue logic different

---

## Medium

### 5. Entity Serialization Duplication
**Files**: `src/types/Building.ts`, `src/types/Unit.ts`, `src/types/Terrain.ts`
- All three have nearly identical `importFromJson()` / `exportToJson()` implementations
- **Action**: Consolidate into `EntityFactory` or a shared serialization mixin

### 6. Magic Numbers / Strings
**Files**: `src/map/Pathfinder.ts` (lines 76, 126), `src/renderer/Renderer.ts` (lines 48, 152–158)
- Tile ID `2` hardcoded as impassable river tile
- Bitwise flags `0b001`, `0b010`, `0b100` undocumented
- **Action**: Add named constants to `src/shared/constants.ts`:
  ```ts
  const IMPASSABLE_TILE_ID = 2;
  const UPDATE_FLAGS = { TERRAIN: 0b001, BUILDINGS: 0b010, UNITS: 0b100 };
  ```

### 7. Inconsistent Coordinate Systems
**Files**: `src/map/Pathfinder.ts`, `src/map/GameMap.ts`
- `Pathfinder` uses `Point { x, y }`; `GameMap` uses `(col, row)` params for the same row-major data
- **Action**: Standardize on one convention throughout the codebase

### 8. Singleton Pattern Inconsistency
**Files**: `src/core/InputManager.ts`, `src/sprites/KennyTextureProvider.ts`, `src/schema/EntityDefinitionManager.ts`, `src/renderer/Renderer.ts`
- All four use singleton pattern; `Game` does not
- **Action**: Pick one pattern (all singletons or dependency injection) and apply consistently

---

## Low / Cleanup

### 9. Dead / Commented-Out Code
- `src/core/Game.ts` — game loop ticker commented out; only a single-frame render runs
- `src/renderer/Renderer.ts` (lines 118–126) — large commented-out unit sprite centering block; building/unit rendering disabled
- **Action**: Remove or document with a tracked TODO

### 10. Empty Stub Files
**Files**: `src/core/Camera.ts`, `src/core/GameStateMachine.ts`, `src/core/StateHandler.ts`
- All three files are completely empty
- **Action**: Delete if unused, or add minimal stubs with planned interfaces

### 11. Unused `bindAction()` in InputManager
**File**: `src/core/InputManager.ts` (lines 60–62)
- `bindAction()` is defined but never called; action query methods exist but no bindings are ever set up
- **Action**: Remove or wire up during initialization
