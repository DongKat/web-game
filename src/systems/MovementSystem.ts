import type { TileMap } from '../map/GameMap';
import type { Terrain } from '../types/Terrain';


export class MovementSystem {
    private tileMap: TileMap;


    constructor(
        tileMap: TileMap,
    ) {
        this.tileMap = tileMap;
    }

    moveUnit(unitId: number, _fromX: number, _fromY: number, toX: number, toY: number): boolean {
        // TODO: Emit animation event for unit movement (e.g., using an event emitter or callback)

        // Check movable terrain
        const terrainEntity = this.tileMap.getTile(toX, toY, 'Terrain') as Terrain | null;
        if (!terrainEntity || !terrainEntity.data?.passable) {
            console.warn(`Cannot move unit ${unitId} to (${toX}, ${toY}): impassable terrain.`);
            return false;
        }

        // Check if occupied by another unit
        const occupant = this.tileMap.getTile(toX, toY, 'Unit');
        if (occupant) {
            console.warn(`Cannot move unit ${unitId} to (${toX}, ${toY}): occupied by another unit.`);
            return false;
        }

        // TODO: Implement moveEntity on GameMap
        // this.tileMap.moveEntity(fromX, fromY, toX, toY, 'Unit');
        return true;
    }
    

    
}