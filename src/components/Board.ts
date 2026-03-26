// Holds the map properties such as width and height, how to draw it, the middleman for
// interactions between the player and the tiles

// Terrain types: 0 = void (unwalkable), 1 = grass, 2 = water, 3 = mountain, 4 = forest, 5 = road
// Building types: 0 = none, 1 = city, 2 = factory, 3 = airport, 4 = port
// Unit types: 0 = none, 1 = infantry, 2 = light_tank, 3 = medium_tank, 4 = recon,  5 = artillery, 6 = rocket_artillery, 7 = anti_air, 8 = fighter, 9 = bomber

const TerrainTypes = {
    VOID: 0,
    GRASS: 1,
    WATER: 2,
    MOUNTAIN: 3,
    FOREST: 4,
    ROAD: 5
} as const;

const BuildingTypes = {
    NONE: 0,
    CITY: 1,
    FACTORY: 2,
    AIRPORT: 3,
    PORT: 4
} as const;

const UnitTypes = {
    NONE: 0,
    INFANTRY: 1,
    LIGHT_TANK: 2,
    MEDIUM_TANK: 3,
    RECON: 4,
    ARTILLERY: 5,
    ROCKET_ARTILLERY: 6,
    ANTI_AIR: 7,
    FIGHTER: 8,
    BOMBER: 9
} as const;

const terrainColors: Record<number, string> = {
    [TerrainTypes.VOID]: "black",
    [TerrainTypes.GRASS]: "#2ecc71",
    [TerrainTypes.WATER]: "#3498db",
    [TerrainTypes.MOUNTAIN]: "#7f8c8d",
    [TerrainTypes.FOREST]: "#27ae60",
    [TerrainTypes.ROAD]: "#95a5a6"
};

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

    render(ctx: CanvasRenderingContext2D) {
        // Draw the background
        ctx.fillStyle = "#7a7a7a";
        ctx.fillRect(0, 0, this.width * this.tileSize, this.height * this.tileSize);

        // Draw terrain layer
        const terrainGrid = this.layers.get("terrain");
        if (terrainGrid) {
            for (let y = 0; y < this.height; y++) {
                const row = terrainGrid[y];
                if (!row) continue;
                for (let x = 0; x < this.width; x++) {
                    const terrain = row[x];
                    if (terrain === undefined) continue;
                    ctx.fillStyle = terrainColors[terrain] || "black";
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    
                    // Draw grid lines
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
                    ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        // Draw buildings layer
        const buildingGrid = this.layers.get("building");
        if (buildingGrid) {
            for (let y = 0; y < this.height; y++) {
                const row = buildingGrid[y];
                if (!row) continue;
                for (let x = 0; x < this.width; x++) {
                    const building = row[x];
                    if (building !== undefined && building !== BuildingTypes.NONE) {
                        ctx.fillStyle = "rgba(231, 76, 60, 0.8)"; // Red for buildings
                        ctx.beginPath();
                        ctx.arc((x + 0.5) * this.tileSize, (y + 0.5) * this.tileSize, this.tileSize * 0.3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
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
