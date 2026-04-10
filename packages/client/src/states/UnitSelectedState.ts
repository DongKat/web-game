import type { GameContext } from '../core/GameContext';
import type { GameState, StateHandler } from '../core/StateHandler';

export class UnitSelectedState implements StateHandler {
    private unitOrigin: { col: number; row: number } | null = null;
    private movementRange = 2; // TODO: read from Unit entity once wired up

    onEnter(context: GameContext): void {
        const cursor = context.overlayMap.cursorPosition;
        if (!cursor) return;

        this.unitOrigin = { col: cursor.col, row: cursor.row };

        // Show movement range highlight around the selected unit
        context.overlayMap.setMovementRangeHighlight(cursor.col, cursor.row, this.movementRange);
    }

    onUpdate(context: GameContext, _dt: number): GameState | null {
        const { inputManager, overlayMap } = context;
        const cursor = overlayMap.cursorPosition || { col: 0, row: 0 };

        // Cancel → back to idle
        if (inputManager.isActionPressed('cancel')) {
            return 'idle';
        }

        // Confirm move → transition to movingUnit
        if (inputManager.isActionPressed('select')) {
            // Only allow selecting a highlighted (reachable) tile
            if (this.unitOrigin && this.isInMovementRange(context, cursor.col, cursor.row)) {
                return 'movingUnit';
            }
            return null;
        }

        // Cursor movement — constrained to movement range
        let newCol = cursor.col;
        let newRow = cursor.row;

        switch (true) {
            case inputManager.isActionPressed('move_up'):
                newRow = cursor.row - 1;
                break;
            case inputManager.isActionPressed('move_down'):
                newRow = cursor.row + 1;
                break;
            case inputManager.isActionPressed('move_left'):
                newCol = cursor.col - 1;
                break;
            case inputManager.isActionPressed('move_right'):
                newCol = cursor.col + 1;
                break;
        }

        if ((newCol !== cursor.col || newRow !== cursor.row) && this.isInMovementRange(context, newCol, newRow)) {
            overlayMap.moveCursor(newCol, newRow);

            // Update path arrows from unit origin to new cursor position
            this.updatePathArrows(context, newCol, newRow);
        }

        return null;
    }

    onExit(context: GameContext): void {
        context.overlayMap.clearMovementRangeHighlight();
        this.clearPathArrows(context);
        this.unitOrigin = null;
    }

    private isInMovementRange(context: GameContext, col: number, row: number): boolean {
        if (!this.unitOrigin) return false;
        const distance = context.overlayMap.manhattanDistance(this.unitOrigin.col, this.unitOrigin.row, col, row);
        return distance <= this.movementRange && context.overlayMap.inBounds(col, row);
    }

    private updatePathArrows(context: GameContext, toCol: number, toRow: number): void {
        if (!this.unitOrigin) return;

        this.clearPathArrows(context);

        const from = { x: this.unitOrigin.col, y: this.unitOrigin.row };
        const to = { x: toCol, y: toRow };
        const path = context.movementSystem.findPath(from, to);
        if (!path) return;

        const arrowTiles = context.movementSystem.translatePathToOverlay(path);
        for (let i = 0; i < arrowTiles.length; i++) {
            context.overlayMap.setTile(path[i].x, path[i].y, 'UI', arrowTiles[i]);
        }
    }

    private clearPathArrows(context: GameContext): void {
        // Clear all UI layer tiles that aren't the cursor
        // Simple approach: re-clear the region around unit origin
        if (!this.unitOrigin) return;
        const { overlayMap } = context;
        const range = this.movementRange;
        for (let row = this.unitOrigin.row - range; row <= this.unitOrigin.row + range; row++) {
            for (let col = this.unitOrigin.col - range; col <= this.unitOrigin.col + range; col++) {
                if (overlayMap.inBounds(col, row)) {
                    const cursor = overlayMap.cursorPosition;
                    if (cursor && cursor.col === col && cursor.row === row) continue;
                    overlayMap.setTile(col, row, 'UI', 0);
                }
            }
        }
    }
}
