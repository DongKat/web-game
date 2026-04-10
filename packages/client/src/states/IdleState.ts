import type { GameContext } from '../core/GameContext';
import type { GameState, StateHandler } from '../core/StateHandler';

export class IdleState implements StateHandler {
    onEnter(context: GameContext): void {
        context.overlayMap.clearMovementRangeHighlight();
    }

    onUpdate(context: GameContext, _dt: number): GameState | null {
        const { inputManager, overlayMap, tileMap } = context;
        const cursor = overlayMap.cursorPosition || { col: 0, row: 0 };

        // Cursor movement
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
            case inputManager.isActionPressed('select'):
                // Check if there's a unit under the cursor
                if (tileMap.getTile(cursor.col, cursor.row, 'Vehicles') !== 0) {
                    return 'unitSelected';
                }
                return null;
        }

        if (newCol !== cursor.col || newRow !== cursor.row) {
            overlayMap.moveCursor(newCol, newRow);
        }

        return null;
    }

    onExit(_context: GameContext): void {
        // Nothing to clean up
    }
}
