// Holds the map properties such as width and height, how to draw it, the middleman for
// interactions between the player and the tiles

import { Tile } from "components/Tile.ts";


export class Board {
    private tile: Tile[][];
    constructor(
        private width: number,
        private height: number,
    ) {
        this.width = width;
        this.height = height;
        this.tile = new Array(height).fill(0).map(() => new Array(width).fill(0).map(() => new Tile()));
    }

    getTile(x: number, y: number): Tile {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error(`Tile coordinates out of bounds: (${x}, ${y})`);
        }
        return this.tile?[y][x];
    
    }




}
