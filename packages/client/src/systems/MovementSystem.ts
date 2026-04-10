import type { TileMap } from '../map/TileMap';
import type { OverlayMap } from '../ui/OverlayMap';
import { type Point, Pathfinder } from '../map/Pathfinder';

export class MovementSystem {
    private tileMap: TileMap;

    private pathCache: Map<string, Point[]> = new Map(); // Cache paths for units to destinations


    constructor(
        tileMap: TileMap,
        _overlayMap: OverlayMap
    ) {
        this.tileMap = tileMap;
    }

    moveUnit(fromX: number, fromY: number, toX: number, toY: number): boolean {
        // TODO: Emit animation event for unit movement (e.g., using an event emitter or callback)

        // Check movable terrain
        if (this.tileMap.getTile(toX, toY, 'Terrain') === 0) {
            console.warn(`Cannot move unit to (${toX}, ${toY}): impassable terrain.`);
            return false;
        }

        // Check if occupied by another unit
        if (this.tileMap.getTile(toX, toY, 'Vehicles') !== 0) {
            console.warn(`Cannot move unit to (${toX}, ${toY}): occupied by another unit.`);
            return false;
        }

        // TODO: Find edge cases :v
        this.tileMap.moveUnit(fromX, fromY, toX, toY);
        return true;
    }

    isOccupiedByUnit(col: number, row: number): boolean {
        return this.tileMap.getTile(col, row, 'Vehicles') !== 0;
    }

    private translateMap(): number[][] {
        // translate map into simple 0,1 map for pathfinding (1 = impassable, 0 = passable)
        const map: number[][] = [];
        for (let row = 0; row < this.tileMap.height; row++) {
            const mapRow: number[] = [];
            for (let col = 0; col < this.tileMap.width; col++) {
                const terrainTile = this.tileMap.getTile(col, row, 'Terrain');
                mapRow.push(terrainTile === 0 ? 1 : 0);
            }
            map.push(mapRow);
        }
        return map;
    }

    private validatePath(path: Point[]): boolean {
        // Validate that the path only goes through passable terrain and does not go through occupied tiles
        for (const point of path) {
            if (this.tileMap.isPassable(point.x, point.y) === false) {
                console.warn(`Path validation failed: tile at (${point.x}, ${point.y}) is not passable.`);
                return false;
            }
            if (this.tileMap.isOccupied(point.x, point.y)) {
                console.warn(`Path validation failed: tile at (${point.x}, ${point.y}) is occupied by a unit.`);
                return false;
            }
        }
        return true;
    
    }

    clearPathCache(): void {
        // Clear the cache for new game
        this.pathCache.clear();
    }


    

    findPath(from: Point, to: Point): Point[] | null {
        const pathFindingMap = this.translateMap();
        const pathfinder = new Pathfinder(pathFindingMap[0].length, pathFindingMap.length);

        // Check if there's a cached path for this unit and destination
        const cacheKey = `${from.x},${from.y}->${to.x},${to.y}`;
        if (this.pathCache.has(cacheKey) && this.validatePath(this.pathCache.get(cacheKey)!)) {
            return this.pathCache.get(cacheKey)!;
        }
        const path = pathfinder.findPath(from, to, pathFindingMap);
        if (path.length === 0) {
            console.warn(`No path found from (${from.x}, ${from.y}) to (${to.x}, ${to.y}).`);
            return null;
        }
        // Cache the path for future use
        this.pathCache.set(cacheKey, path);
        return path;
    }


    public translatePathToOverlay(path: Point[]): number[] {
        // Map vector directions to arrow tile IDs (example values, adjust as needed)
        const directionToTileId: { [key: string]: number } = {
            '0,1': 1,   // down arrow
            '0,-1': 2,  // up arrow
            '1,0': 3,   // right arrow
            '-1,0': 4,  // left arrow
            '1,1': 5,   // down-right arrow
            '-1,1': 6,  // down-left arrow
            '1,-1': 7,  // up-right arrow
            '-1,-1': 8  // up-left arrow
        };
        let result: number[] = [];

        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            const directionVector = { x: next.x - current.x, y: next.y - current.y };
            const directionKey = `${directionVector.x},${directionVector.y}`;
            const tileId = directionToTileId[directionKey];
            if (tileId) {
                result.push(tileId);
            }
        }
        return result;
    }


}