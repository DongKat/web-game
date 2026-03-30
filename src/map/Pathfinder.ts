
type Point = {
    x: number,
    y: number;
};

type Node = {
    point: Point;
    g: number;
    f: number;
    parent: Node | null;
};

export class AStarAlgorithm {
    public mapWidth: number;
    public mapHeight: number;


    constructor(
        mapWidth: number,
        mapHeight: number) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    }


    // A* algorithm implementation
    public heuristic(a: Point, b: Point): number {
        // Manhattan distance heuristic
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }


    public findPath(start: Point, goal: Point, map: number[][]): Point[] {
        const openSet: Node[] = [];
        const closedSet: Set<string> = new Set();

        const startNode: Node = {
            point: start,
            g: 0,
            f: this.heuristic(start, goal),
            parent: null
        };

        openSet.push(startNode);

        while (openSet.length > 0) {
            // Get node with lowest f score
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift()!;

            if (current.point.x === goal.x && current.point.y === goal.y) {
                const path: Point[] = [];
                let temp: Node | null = current;
                while (temp) {
                    path.push(temp.point);
                    temp = temp.parent;
                }
                return path.reverse();
            }

            closedSet.add(`${current.point.x},${current.point.y}`);

            const neighbors = [
                { x: current.point.x + 1, y: current.point.y },
                { x: current.point.x - 1, y: current.point.y },
                { x: current.point.x, y: current.point.y + 1 },
                { x: current.point.x, y: current.point.y - 1 }
            ];

            for (const neighbor of neighbors) {
                if (neighbor.x < 0 || neighbor.x >= this.mapWidth || neighbor.y < 0 || neighbor.y >= this.mapHeight) continue;
                if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

                // Tile ID 2 is river/impassable based on instruction
                if (map[neighbor.y][neighbor.x] === 2) continue;

                const gScore = current.g + 1;
                let neighborNode = openSet.find(n => n.point.x === neighbor.x && n.point.y === neighbor.y);

                if (!neighborNode) {
                    neighborNode = {
                        point: neighbor,
                        g: gScore,
                        f: gScore + this.heuristic(neighbor, goal),
                        parent: current
                    };
                    openSet.push(neighborNode);
                } else if (gScore < neighborNode.g) {
                    neighborNode.g = gScore;
                    neighborNode.f = gScore + this.heuristic(neighbor, goal);
                    neighborNode.parent = current;
                }
            }
        }

        return []; // No path found
    }
}

export class BFSAlgorithm {
    public mapWidth: number;
    public mapHeight: number;

    constructor(mapWidth: number, mapHeight: number) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    }

    public findPath(start: Point, goal: Point, map: number[][]): Point[] {
        const queue: Point[] = [start];
        const visited: Set<string> = new Set();
        const parentMap: Map<string, Point | null> = new Map();
        visited.add(`${start.x},${start.y}`);
        parentMap.set(`${start.x},${start.y}`, null);
        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current.x === goal.x && current.y === goal.y) {

                const path: Point[] = [];
                let temp: Point | null = current;
                while (temp) {
                    path.push(temp);
                    temp = parentMap.get(`${temp.x},${temp.y}`) ?? null;
                }

                return path.reverse();
            }

            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (const neighbor of neighbors) {
                if (
                    neighbor.x < 0 ||
                    neighbor.x >= this.mapWidth ||
                    neighbor.y < 0 ||
                    neighbor.y >= this.mapHeight
                )
                    continue;

                if (visited.has(`${neighbor.x},${neighbor.y}`))
                    continue;

                // Tile ID 2 is river/impassable based on instruction
                if (map[neighbor.y][neighbor.x] === 2)
                    continue;
                queue.push(neighbor);

                visited.add(`${neighbor.x},${neighbor.y}`);
                parentMap.set(`${neighbor.x},${neighbor.y}`, current);
            }
        }
        return []; // No path found
    }
}

export class Pathfinder {
    private aStar: AStarAlgorithm;
    private bfs: BFSAlgorithm;
    constructor(mapWidth: number, mapHeight: number) {
        this.aStar = new AStarAlgorithm(mapWidth, mapHeight);
        this.bfs = new BFSAlgorithm(mapWidth, mapHeight);
    }

    public findPath(start: Point, goal: Point, map: number[][]): Point[] {
        const aStarPath = this.aStar.findPath(start, goal, map);
        if (aStarPath.length > 0) {
            return aStarPath;
        }
        return this.bfs.findPath(start, goal, map);
    }
}
