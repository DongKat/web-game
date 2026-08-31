import { describe, expect, it } from 'vitest';
import { GameMap } from '../src/gameMap';
import { bfsPath, bfsReachable } from '../src/highlightMovement';

/** A plain w x h grass map -- these functions only read w/h today. */
function gridMap(w: number, h: number): GameMap {
    return GameMap.fromFile({
        name: `${w}x${h}`,
        w,
        h,
        terrain: '.'.repeat(w * h),
        legend: { '.': 'grass' },
    });
}

const sorted = (cells: { c: number, r: number }[]) =>
    [...cells].sort((a, b) => a.r - b.r || a.c - b.c).map(({ c, r }) => `${c},${r}`);

describe('bfsReachable', () => {
    it('returns the diamond of cells within range, excluding the start', () => {
        const cells = bfsReachable({ c: 2, r: 2 }, 2, gridMap(5, 5));

        expect(sorted(cells)).toEqual([
            '2,0',
            '1,1', '2,1', '3,1',
            '0,2', '1,2', '3,2', '4,2',
            '1,3', '2,3', '3,3',
            '2,4',
        ]);
        expect(cells).toHaveLength(new Set(sorted(cells)).size);
    });

    it('clips the diamond at the map edges', () => {
        expect(sorted(bfsReachable({ c: 0, r: 0 }, 1, gridMap(5, 5)))).toEqual(['1,0', '0,1']);
    });

    it('returns nothing for zero range', () => {
        expect(bfsReachable({ c: 2, r: 2 }, 0, gridMap(5, 5))).toEqual([]);
    });

    it('includes the ring at exactly the range limit', () => {
        const cells = bfsReachable({ c: 4, r: 4 }, 3, gridMap(9, 9));
        const far = cells.filter(x => Math.abs(x.c - 4) + Math.abs(x.r - 4) === 3);

        expect(cells).toHaveLength(24);
        expect(far).toHaveLength(12);
    });
});

describe('bfsPath', () => {
    it('returns a shortest path including both endpoints', () => {
        const path = bfsPath({ c: 0, r: 0 }, { c: 2, r: 1 }, 4, gridMap(5, 5))!;

        expect(path).not.toBeNull();
        expect(path[0]).toEqual({ c: 0, r: 0 });
        expect(path.at(-1)).toEqual({ c: 2, r: 1 });
        expect(path).toHaveLength(4); // 3 steps of Manhattan distance

        for (let i = 1; i < path.length; i++) {
            const step = Math.abs(path[i].c - path[i - 1].c) + Math.abs(path[i].r - path[i - 1].r);
            expect(step).toBe(1);
        }
    });

    it('returns null when the destination is out of range', () => {
        expect(bfsPath({ c: 0, r: 0 }, { c: 4, r: 4 }, 3, gridMap(5, 5))).toBeNull();
    });

    it('reaches a destination at exactly the range limit', () => {
        const path = bfsPath({ c: 4, r: 4 }, { c: 7, r: 4 }, 3, gridMap(9, 9));

        expect(path).not.toBeNull();
        expect(path!.at(-1)).toEqual({ c: 7, r: 4 });
    });

    it('returns just the start when start and end are the same', () => {
        expect(bfsPath({ c: 2, r: 2 }, { c: 2, r: 2 }, 3, gridMap(5, 5)))
            .toEqual([{ c: 2, r: 2 }]);
    });

    it('returns null for zero range', () => {
        expect(bfsPath({ c: 2, r: 2 }, { c: 3, r: 2 }, 0, gridMap(5, 5))).toBeNull();
    });
});

/**
 * actionState.ts highlights with bfsReachable and then moves with bfsPath, both at
 * range 3 -- so every highlighted cell must be walkable. This caught bfsPath testing
 * cells on dequeue rather than on discovery, which stranded the outer ring.
 */
describe('bfsReachable and bfsPath agree', () => {
    it('gives a path to every cell it highlights', () => {
        const map = gridMap(9, 9);
        const start = { c: 4, r: 4 };

        const unreachable = bfsReachable(start, 3, map)
            .filter(cell => bfsPath(start, cell, 3, map) === null);

        expect(sorted(unreachable)).toEqual([]);
    });
});
