import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionController, AttackState, HoverState, SelectState } from '../src/actionState';
import type { GameMapManager } from '../src/gameMapManager';
import type { InputManager } from '../src/inputManager';
import type { TurnManager, UnitState } from '../src/turnManager';
import type { GameDefs } from '../src/defsLoader';
import type { Placement } from '../src/gameMap';
import { Player } from '../src/player';
import { Unit } from '../src/unit';

const MAP_W = 10;
const MAP_H = 10;

function makeUnitState(hp = 100, hasMoved = false): UnitState {
    return { hp, hasMoved };
}

function makeTurnManager(unitStates: Map<string, UnitState> = new Map()): TurnManager {
    const stateByKey = new Map<number, UnitState>();
    for (const [key, state] of unitStates) {
        const [c, r] = key.split(',').map(Number);
        stateByKey.set(r * MAP_W + c, state);
    }

    return {
        players: [],
        activePlayer: new Player('blue', 'P1'),
        turnCount: 1,
        getUnitState: vi.fn((c: number, r: number) => stateByKey.get(r * MAP_W + c)),
        moveUnitState: vi.fn((fromC: number, fromR: number, toC: number, toR: number) => {
            const fromKey = fromR * MAP_W + fromC;
            const toKey = toR * MAP_W + toC;
            const state = stateByKey.get(fromKey);
            if (state) {
                stateByKey.delete(fromKey);
                stateByKey.set(toKey, state);
            }
        }),
        markMoved: vi.fn((c: number, r: number) => {
            const state = stateByKey.get(r * MAP_W + c);
            if (state) state.hasMoved = true;
        }),
        unmarkMoved: vi.fn((c: number, r: number) => {
            const state = stateByKey.get(r * MAP_W + c);
            if (state) state.hasMoved = false;
        }),
        applyDamage: vi.fn(),
        endTurn: vi.fn(),
        isDefeated: vi.fn(() => false),
        winner: vi.fn(() => null),
    } as unknown as TurnManager;
}

function makeManager(units: Placement[] = []): GameMapManager {
    return {
        map: { w: MAP_W, h: MAP_H, units, at: () => 'grass' },
        moveUnit: vi.fn(),
        unitAt: vi.fn((c: number, r: number) => units.find(u => u.c === c && u.r === r)),
        placeOverlay: vi.fn(),
        removeOverlay: vi.fn(),
        clearFx: vi.fn(),
        placeFxByQuery: vi.fn(),
        setUnitAlpha: vi.fn(),
        resetUnitAlpha: vi.fn(),
    } as unknown as GameMapManager;
}

function makeInput(): InputManager {
    return {
        cellFilter: null,
        on: vi.fn(),
        off: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
    } as unknown as InputManager;
}

function makeGameDefs(): GameDefs {
    const infantry = new Unit('infantry', 55, 30, 3, 1, 1000);
    const tank = new Unit('tank', 70, 50, 6, 1, 7000);
    return {
        terrains: new Map(),
        structures: new Map(),
        units: new Map([
            ['infantry', infantry],
            ['tank', tank],
        ]),
    };
}

describe('SelectState cancel', () => {
    it('transitions back to HoverState without moving the unit', () => {
        const unit: Placement = { type: 'infantry', team: 'blue', c: 2, r: 2 };
        const manager = makeManager([unit]);
        const input = makeInput();
        const player = new Player('blue', 'P1');
        const defs = makeGameDefs();
        const controller = new ActionController(player, manager, input, defs);
        controller.turnManager = makeTurnManager(new Map([['2,2', makeUnitState()]]));

        controller.onSelect(2, 2);

        controller.onCancel();

        expect(manager.moveUnit).not.toHaveBeenCalled();
        expect(controller.turnManager.moveUnitState).not.toHaveBeenCalled();
    });
});

describe('AttackState cancel after move', () => {
    let controller: ActionController;
    let manager: GameMapManager;
    let tm: TurnManager;
    const originC = 2, originR = 2;
    const movedC = 3, movedR = 2;

    beforeEach(() => {
        const friendlyUnit: Placement = { type: 'infantry', team: 'blue', c: movedC, r: movedR };
        const enemyUnit: Placement = { type: 'tank', team: 'red', c: 4, r: 2 };
        manager = makeManager([friendlyUnit, enemyUnit]);
        const input = makeInput();
        const player = new Player('blue', 'P1');
        const defs = makeGameDefs();
        controller = new ActionController(player, manager, input, defs);
        tm = makeTurnManager(new Map([
            [`${movedC},${movedR}`, makeUnitState(100, true)],
            ['4,2', makeUnitState()],
        ]));
        controller.turnManager = tm;

        controller.transition(new AttackState(
            controller, manager, friendlyUnit, defs,
            [enemyUnit], originC, originR,
        ));
    });

    it('moves the unit back to its origin', () => {
        controller.onCancel();

        expect(manager.moveUnit).toHaveBeenCalledWith(movedC, movedR, originC, originR);
    });

    it('moves the unit state back', () => {
        controller.onCancel();

        expect(tm.moveUnitState).toHaveBeenCalledWith(movedC, movedR, originC, originR);
    });

    it('unmarks the unit as moved', () => {
        controller.onCancel();

        expect(tm.unmarkMoved).toHaveBeenCalledWith(originC, originR);
    });

    it('resets unit alpha to 1', () => {
        controller.onCancel();

        expect(manager.setUnitAlpha).toHaveBeenCalledWith(originC, originR, 1);
    });
});

describe('AttackState cancel after wait (no move)', () => {
    let controller: ActionController;
    let manager: GameMapManager;
    let tm: TurnManager;
    const unitC = 2, unitR = 2;

    beforeEach(() => {
        const friendlyUnit: Placement = { type: 'infantry', team: 'blue', c: unitC, r: unitR };
        const enemyUnit: Placement = { type: 'tank', team: 'red', c: 3, r: 2 };
        manager = makeManager([friendlyUnit, enemyUnit]);
        const input = makeInput();
        const player = new Player('blue', 'P1');
        const defs = makeGameDefs();
        controller = new ActionController(player, manager, input, defs);
        tm = makeTurnManager(new Map([
            [`${unitC},${unitR}`, makeUnitState(100, true)],
            ['3,2', makeUnitState()],
        ]));
        controller.turnManager = tm;

        controller.transition(new AttackState(
            controller, manager, friendlyUnit, defs,
            [enemyUnit], unitC, unitR,
        ));
    });

    it('does not call moveUnit when origin equals current position', () => {
        controller.onCancel();

        expect(manager.moveUnit).not.toHaveBeenCalled();
    });

    it('does not call moveUnitState when origin equals current position', () => {
        controller.onCancel();

        expect(tm.moveUnitState).not.toHaveBeenCalled();
    });

    it('still unmarks moved and resets alpha', () => {
        controller.onCancel();

        expect(tm.unmarkMoved).toHaveBeenCalledWith(unitC, unitR);
        expect(manager.setUnitAlpha).toHaveBeenCalledWith(unitC, unitR, 1);
    });
});
