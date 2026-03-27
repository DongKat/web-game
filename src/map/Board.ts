// Holds the map properties such as width and height, how to draw it, the middleman for
// interactions between the player and the tiles

type Layer = "terrain" | "building" | "units";

interface TileData {
    layer: Layer;
    x: number;
    y: number;
    value: number;
}

export class Board {
    layers: Map<Layer, number[][]> = new Map([
        ["terrain", []],
        ["building", []],
        ["units", []]
    ]);
    width: number;
    height: number;
    tileSize: number;

    constructor(width: number, height: number, tileSize: number = 32) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.initializeLayers();
    }

    initializeLayers() {
        for (const layer of this.layers.keys()) {
            this.layers.set(
                layer,
                Array.from({ length: this.height }, () =>
                    Array(this.width).fill(0)
                )
            );
        }
    }

    setTile(layer: Layer, x: number, y: number, value: number) {
        const grid = this.layers.get(layer);
        if (!grid || y < 0 || y >= this.height || x < 0 || x >= this.width) {
            throw new Error(`Invalid coordinates (${x}, ${y}) for layer ${layer}`);
        }
        const row = grid[y];
        if (row === undefined) {
            throw new Error(`Invalid row access at ${y}`);
        }
        row[x] = value;
    }

    getTile(layer: Layer, x: number, y: number): number {
        const grid = this.layers.get(layer);
        if (!grid || y < 0 || y >= this.height || x < 0 || x >= this.width) {
            throw new Error(`Invalid coordinates (${x}, ${y}) for layer ${layer}`);
        }
        const row = grid[y];
        if (row === undefined) {
            throw new Error(`Invalid row access at ${y}`);
        }
        const cell = row[x];
        if (cell === undefined) {
            throw new Error(`Invalid cell access at ${x},${y}`);
        }
        return cell;
    }

    saveToFile() {
        // Save as JSON file (TODO: binary format)
        const data = {
            width: this.width,
            height: this.height,
            tileSize: this.tileSize,
            layers: Object.fromEntries(this.layers)
        };
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "board.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    loadFromFile(file: File) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);
                if (data.width && data.height && data.tileSize && data.layers) {
                    this.width = data.width;
                    this.height = data.height;
                    this.tileSize = data.tileSize;
                    this.layers = new Map(Object.entries(data.layers) as [Layer, number[][]][]);
                } else {
                    throw new Error("Invalid board data");
                }
            }
            catch (error) {
                console.error("Failed to load board:", error);
            }
        }
        reader.readAsText(file);
    }
}
