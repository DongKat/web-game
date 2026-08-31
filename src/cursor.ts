import type { GameMapManager } from './gameMapManager';

export class Cursor {
    cell: { c: number; r: number } | null;
    locked: boolean;
    private readonly manager: GameMapManager;

    constructor(manager: GameMapManager) {
        this.cell = null;
        this.locked = false;
        this.manager = manager;
    }

    moveTo(c: number, r: number): void {
        if (this.cell) {
            this.manager.removeCursor(this.cell.c, this.cell.r);
        }
        this.cell = { c, r };
        this.manager.placeCursor('ui.cursor.select', c, r);
    }

    hide(): void {
        if (this.cell) {
            this.manager.removeCursor(this.cell.c, this.cell.r);
            this.cell = null;
        }
    }

    lock(): void {
        this.locked = true;
    }

    unlock(): void {
        this.locked = false;
    }
}
