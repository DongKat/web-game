import type { TileMap } from '../map/TileMap';
import type { OverlayMap } from '../ui/OverlayMap';


export class MovementSystem {
    private tileMap: TileMap;
    private overlayMap: OverlayMap;


    constructor(
        tileMap: TileMap,
        overlayMap: OverlayMap
    ) {
        this.tileMap = tileMap;
        this.overlayMap = overlayMap;
    }

    moveUnit(unitId: number, fromX: number, fromY: number, toX: number, toY: number): boolean {
        // TODO: Emit animation event for unit movement (e.g., using an event emitter or callback)

        // Check movable terrain
        if (this.tileMap.getTile(toX, toY, 'Terrain') === 0) {
            console.warn(`Cannot move unit ${unitId} to (${toX}, ${toY}): impassable terrain.`);
            return false;
        }

        // Check if occupied by another unit
        if (this.tileMap.getTile(toX, toY, 'Vehicles') !== 0) {
            console.warn(`Cannot move unit ${unitId} to (${toX}, ${toY}): occupied by another unit.`);
            return false;
        }

        // TODO: Find edge cases :v


        this.tileMap.moveEntity(fromX, fromY, toX, toY, 'Vehicles');
        this.overlayMap.moveOverlay(fromX, fromY, toX, toY);
        return true;
    }
    

    
}