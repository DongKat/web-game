
import { Layers, TILE_ID_MAP } from "../core/constants";

type Node = {
    col: number;
    row: number;
    distance: number;
}

export class OverlayMap {
    readonly width: number;
    readonly height: number;

    cursorPosition: { col: number; row: number } | null = null;

    private layers: Map<string, number[]> = new Map();

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.layers.set('UI', new Array(width * height).fill(0));
        this.layers.set('Effects', new Array(width * height).fill(0));

        // Place cursor at the middle of the map by default
        this.setCursor(Math.floor(width / 2), Math.floor(height / 2));
    }


    getTile(col: number, row: number, layer: string): number {
        if (!this.inBounds(col, row)) return 0;
        return this.layers.get(layer)?.[row * this.width + col] ?? 0;
    }

    setTile(col: number, row: number, layer: string, tileId: number): void {
        if (!this.inBounds(col, row)) return;
        this.layers.get(layer)![row * this.width + col] = tileId;
    }

    inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.width && row >= 0 && row < this.height;
    }

    setCursor(col: number, row: number): void {
        this.setTile(col, row, Layers.UI, TILE_ID_MAP.CURSOR);
    }

    manhattanDistance(col1: number, row1: number, col2: number, row2: number): number {
        return Math.abs(col1 - col2) + Math.abs(row1 - row2);
    }

    private highlightMovementRange(col: number, row: number): void {
        this.setTile(col, row, Layers.UI, TILE_ID_MAP.MOVEMENT_HIGHLIGHT);
    }

    setMovementRangeHighlight(col: number, row: number, movementRange: number): void {
        let visited = new Set<number>();
        let queue: Node[] = [{ col, row, distance: 0 }];
        let result: { col: number; row: number }[] = [];

        // Directions for movement (right, left, down, up)
        const dirs = [
            [1, 0], [-1, 0],
            [0, 1], [0, -1]
        ];

        while (queue.length > 0) {
            const current = queue.shift()!;
            result.push({ col: current.col, row: current.row });
            visited.add(current.row * this.width + current.col);

            for (const [dc, dr] of dirs) {
                const newCol = current.col + dc;
                const newRow = current.row + dr;
                const newDistance = this.manhattanDistance(col, row, newCol, newRow);
                if (this.inBounds(newCol, newRow) && newDistance <= movementRange) {
                    const node: Node = { col: newCol, row: newRow, distance: newDistance };
                    if (!visited.has(newRow * this.width + newCol)) {
                        visited.add(newRow * this.width + newCol);
                        queue.push(node);
                    }
                }
            }
        }
        result.shift();
        for (const { col, row } of result) {
            // Skip the unit's own tile
            this.highlightMovementRange(col, row);
        }
    }

    moveOverlay(fromCol: number, fromRow: number, toCol: number, toRow: number): void {
        const uiLayer = this.layers.get(Layers.UI);
        if (!uiLayer) return;
        const fromIndex = fromRow * this.width + fromCol;
        const toIndex = toRow * this.width + toCol;
        const tileId = uiLayer[fromIndex];
        uiLayer[fromIndex] = 0;
        uiLayer[toIndex] = tileId;
    }

    clearMovementRangeHighlight(): void {
        const uiLayer = this.layers.get(Layers.UI);
        if (!uiLayer) return;
        for (let i = 0; i < uiLayer.length; i++) {
            if (uiLayer[i] === TILE_ID_MAP.MOVEMENT_HIGHLIGHT) {
                uiLayer[i] = 0;
            }
        }
    }
}


// Test cases for OverlayMap
function testSetMovementRangeHighlight() {
    const overlayMap = new OverlayMap(10, 10);
    overlayMap.setMovementRangeHighlight(5, 5, 2);
    // Check that the correct tiles are highlighted
    const expectedHighlightedTiles = [
        [6, 5], [4, 5], [5, 6], [5, 4],
        [7, 5], [3, 5], [5, 7], [5, 3],
        [6, 6], [6, 4], [4, 6], [4, 4]
    ];

    for (const [col, row] of expectedHighlightedTiles) {
        const tileId = overlayMap.getTile(col, row, 'UI');
        if (tileId !== TILE_ID_MAP.MOVEMENT_HIGHLIGHT) {
            console.error(`Tile at (${col}, ${row}) should be highlighted but is not.`);
        }
    }
}

testSetMovementRangeHighlight();