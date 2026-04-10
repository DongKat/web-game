import type { Point } from '../types/index.js';

export interface PathGrid {
  width: number;
  height: number;
  getCost(col: number, row: number): number | null; // null = impassable
  isBlocked(col: number, row: number): boolean;      // occupied by enemy
}

interface PathNode {
  point: Point;
  g: number;
  f: number;
  parent: PathNode | null;
}

const DIRS: readonly Point[] = [
  { col: 1, row: 0 },
  { col: -1, row: 0 },
  { col: 0, row: 1 },
  { col: 0, row: -1 },
];

function manhattan(a: Point, b: Point): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

export class Pathfinder {
  static findPath(grid: PathGrid, start: Point, goal: Point): Point[] | null {
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
      point: start,
      g: 0,
      f: manhattan(start, goal),
      parent: null,
    };
    openSet.push(startNode);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const key = `${current.point.col},${current.point.row}`;

      if (current.point.col === goal.col && current.point.row === goal.row) {
        const path: Point[] = [];
        let node: PathNode | null = current;
        while (node) {
          path.push(node.point);
          node = node.parent;
        }
        return path.reverse();
      }

      closedSet.add(key);

      for (const dir of DIRS) {
        const nc = current.point.col + dir.col;
        const nr = current.point.row + dir.row;

        if (nc < 0 || nc >= grid.width || nr < 0 || nr >= grid.height) continue;
        if (closedSet.has(`${nc},${nr}`)) continue;

        const cost = grid.getCost(nc, nr);
        if (cost === null) continue; // impassable
        if (grid.isBlocked(nc, nr) && !(nc === goal.col && nr === goal.row)) continue;

        const g = current.g + cost;
        const existing = openSet.find(n => n.point.col === nc && n.point.row === nr);

        if (!existing) {
          openSet.push({
            point: { col: nc, row: nr },
            g,
            f: g + manhattan({ col: nc, row: nr }, goal),
            parent: current,
          });
        } else if (g < existing.g) {
          existing.g = g;
          existing.f = g + manhattan({ col: nc, row: nr }, goal);
          existing.parent = current;
        }
      }
    }

    return null; // no path found
  }

  static getReachableTiles(
    grid: PathGrid,
    origin: Point,
    maxCost: number,
  ): Map<string, { point: Point; cost: number }> {
    const reachable = new Map<string, { point: Point; cost: number }>();
    const queue: { point: Point; cost: number }[] = [{ point: origin, cost: 0 }];
    reachable.set(`${origin.col},${origin.row}`, { point: origin, cost: 0 });

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const dir of DIRS) {
        const nc = current.point.col + dir.col;
        const nr = current.point.row + dir.row;
        const key = `${nc},${nr}`;

        if (nc < 0 || nc >= grid.width || nr < 0 || nr >= grid.height) continue;

        const tileCost = grid.getCost(nc, nr);
        if (tileCost === null) continue;
        if (grid.isBlocked(nc, nr)) continue;

        const totalCost = current.cost + tileCost;
        if (totalCost > maxCost) continue;

        const existing = reachable.get(key);
        if (!existing || totalCost < existing.cost) {
          reachable.set(key, { point: { col: nc, row: nr }, cost: totalCost });
          queue.push({ point: { col: nc, row: nr }, cost: totalCost });
        }
      }
    }

    return reachable;
  }
}
