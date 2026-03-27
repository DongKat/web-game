// Draw everything
import { Tile } from "components/Tile.ts";
import { Unit } from "components/Unit.ts";
import { Building } from "components/Building.ts";
import { Board } from "map/Board.ts";
import { Terrain } from "components/Terrain.ts";

import { SpriteManager } from "./SpriteManager.ts";


export class Renderer {
    constructor(
        private spriteManager: SpriteManager,
        private ctx: CanvasRenderingContext2D
    ) {
        this.spriteManager = new SpriteManager();
    }

    drawBoard(board: Board) {
        // Render terrain layer
        const terrainLayer = board.getLayerData("terrain");
        if (terrainLayer) {
            for (let y = 0; y < board.height; y++) {
                for (let x = 0; x < board.width; x++) {
                    const tileValue = board.getTile("terrain", x, y);
                    const spriteName = `terrain_${tileValue}`;
                    const sprite = this.spriteManager.getSprite(spriteName);
                    this.ctx.drawImage(
                        sprite.image,
                        sprite.x,
                        sprite.y,
                        sprite.w,
                        sprite.h,
                        x * board.tileSize,
                        y * board.tileSize,
                        board.tileSize,
                        board.tileSize
                    );
                }
            }
        }

        // Render building layer
        const buildingLayer = board.getLayerData("building");
        if (buildingLayer) {
            for (let y = 0; y < board.height; y++) {
                for (let x = 0; x < board.width; x++) {
                    const tileValue = board.getTile("building", x, y);
                    // Get owner of building
                    

    }

    drawUnit(unit: Unit) {
    }

    drawTerrain(terrain: Terrain) {
    }

    drawBuilding(building: Building) {
    }
}