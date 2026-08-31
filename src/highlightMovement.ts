import type { GameMap } from './gameMap';

const DIRS: { c: number; r: number }[] = [
    { c: 0, r: -1 },
    { c: 1, r: 0 },
    { c: 0, r: 1 },
    { c: -1, r: 0 },
];

// Return list of reachable cells to be highlighted, given a starting cell and a movement range.
// TODO: handle obstacles.
export function bfsReachable(start: { c: number, r: number }, range: number, map: GameMap): { c: number, r: number }[] {
    const key = (c: number, r: number) => r * map.w + c;
    const visited = new Set<number>();
    visited.add(key(start.c, start.r));

    let frontier: { c: number, r: number }[] = [start];
    const reachable: { c: number, r: number }[] = [];

    for (let step = 0; step < range && frontier.length > 0; step++) {
        const next: { c: number, r: number }[] = [];
        for (const cell of frontier) {
            for (const dir of DIRS) {
                const nc = cell.c + dir.c;
                const nr = cell.r + dir.r;
                if (nc < 0 || nc >= map.w || nr < 0 || nr >= map.h) continue;
                const k = key(nc, nr);
                if (visited.has(k)) continue;
                visited.add(k);
                const neighbor = { c: nc, r: nr };
                reachable.push(neighbor);
                next.push(neighbor);
            }
        }
        frontier = next;
    }

    return reachable;
}

// Return path of cells from start to end, given a movement range. This is a simple BFS for now.
// TODO: handle obstacles, terrain costs, etc.
export function bfsPath(start: { c: number, r: number }, end: { c: number, r: number }, range: number, map: GameMap): { c: number, r: number }[] | null {
    const key = (c: number, r: number) => r * map.w + c;
    const visited = new Set<number>();
    visited.add(key(start.c, start.r));

    let frontier: { c: number, r: number }[] = [start];
    const cameFrom = new Map<number, { c: number, r: number }>();

    // Walk cameFrom back to the start, then flip to get start -> cell.
    const pathTo = (cell: { c: number, r: number }): { c: number, r: number }[] => {
        const path: { c: number, r: number }[] = [];
        let current: { c: number, r: number } | undefined = cell;
        while (current) {
            path.push(current);
            current = cameFrom.get(key(current.c, current.r));
        }
        return path.reverse();
    };

    if (start.c === end.c && start.r === end.r) return [start];

    // Cells are checked as they are discovered, not when they are dequeued: the last
    // pass discovers the ring at exactly `range`, which never becomes a frontier.
    for (let step = 0; step < range && frontier.length > 0; step++) {
        const next: { c: number, r: number }[] = [];
        for (const cell of frontier) {
            for (const dir of DIRS) {
                const nc = cell.c + dir.c;
                const nr = cell.r + dir.r;
                if (nc < 0 || nc >= map.w || nr < 0 || nr >= map.h) continue;
                const k = key(nc, nr);
                if (visited.has(k)) continue;
                visited.add(k);
                const neighbor = { c: nc, r: nr };
                cameFrom.set(k, cell);
                if (nc === end.c && nr === end.r) return pathTo(neighbor);
                next.push(neighbor);
            }
        }
        frontier = next;
    }

    return null; // No path found within range
}   