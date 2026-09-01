import { describe, it, expect, vi } from 'vitest';
import { AI, scoreAttack, unitValue } from '../src/ai';
import type { ActionController } from '../src/actionState';
import type { GameMapManager } from '../src/gameMapManager';
import type { TurnManager, UnitState } from '../src/turnManager';
import type { GameDefs } from '../src/defsLoader';
import type { Placement } from '../src/gameMap';
import { Unit } from '../src/unit';

const MAP_W = 10;
const MAP_H = 10;

const infantry = new Unit('infantry', 55, 45, 3, 1, 1000);
const tank = new Unit('tank', 70, 50, 6, 1, 7000);
const recon = new Unit('recon', 35, 25, 8, 1, 4000);
const supply = new Unit('supply', 0, 20, 6, 0, 5000);

function makeGameDefs(): GameDefs {
    return {
        terrains: new Map(),
        structures: new Map(),
        units: new Map([
            ['infantry', infantry],
            ['tank', tank],
            ['recon', recon],
            ['supply', supply],
        ]),
    };
}

function makeTurnManager(states: Map<string, UnitState>): TurnManager {
    const byKey = new Map<number, UnitState>();
    for (const [key, state] of states) {
        const [c, r] = key.split(',').map(Number);
        byKey.set(r * MAP_W + c, state);
    }
    return {
        getUnitState: vi.fn((c: number, r: number) => byKey.get(r * MAP_W + c)),
        winner: vi.fn(() => null),
    } as unknown as TurnManager;
}

function makeManager(units: Placement[]): GameMapManager {
    return {
        map: { w: MAP_W, h: MAP_H, units, at: () => 'grass' },
        unitAt: vi.fn((c: number, r: number) => units.find(u => u.c === c && u.r === r)),
    } as unknown as GameMapManager;
}

function makeController(): ActionController {
    return {
        onSelect: vi.fn(),
        onHover: vi.fn(),
        transition: vi.fn(),
        input: { enable: vi.fn(), disable: vi.fn() },
    } as unknown as ActionController;
}

function makeAI(units: Placement[], states: Map<string, UnitState>): AI {
    return new AI(makeController(), makeManager(units), makeGameDefs(), makeTurnManager(states), 0);
}

describe('unitValue', () => {
    it('scales cost by remaining HP', () => {
        expect(unitValue(7000, 100)).toBe(7000);
        expect(unitValue(7000, 50)).toBe(3500);
        expect(unitValue(7000, 0)).toBe(0);
    });
});

describe('scoreAttack', () => {
    it('favours a cheap unit trading into an expensive one', () => {
        // Infantry deals 37 to a tank (2590 of tank value) and takes 30 back (300 of
        // its own): cheap units should accept trades expensive units would refuse.
        expect(scoreAttack(infantry, 100, tank, 100)).toBeCloseTo(2590 - 300, 5);
    });

    it('declines an unfavourable trade for a mid-cost low-attack unit', () => {
        // Recon deals 23 (1610) and eats a 43 counter (1720) -> negative.
        expect(scoreAttack(recon, 100, tank, 100)).toBeLessThan(0);
    });

    it('adds the kill bonus and drops the counter when the attack kills', () => {
        // Tank finishes a 20 HP infantry: 20 HP of value + 30% kill bonus, no counter.
        const expected = unitValue(1000, 20) + unitValue(1000, 20) * 0.3;
        expect(scoreAttack(tank, 100, infantry, 20)).toBeCloseTo(expected, 5);
    });

    it('scores attacking a defenceless unit with no downside', () => {
        expect(scoreAttack(infantry, 100, supply, 100)).toBeGreaterThan(0);
    });
});

describe('AI.decide', () => {
    it('attacks an adjacent enemy when the exchange is favourable', () => {
        const self: Placement = { type: 'infantry', team: 'blue', c: 2, r: 2 };
        const enemy: Placement = { type: 'tank', team: 'red', c: 4, r: 2 };
        const ai = makeAI([self, enemy], new Map([
            ['2,2', { hp: 100, hasMoved: false }],
            ['4,2', { hp: 100, hasMoved: false }],
        ]));

        const plan = ai.decide(self);

        expect(plan?.target).toBe(enemy);
    });

    it('moves adjacent to the target before attacking', () => {
        const self: Placement = { type: 'infantry', team: 'blue', c: 2, r: 2 };
        const enemy: Placement = { type: 'tank', team: 'red', c: 4, r: 2 };
        const ai = makeAI([self, enemy], new Map([
            ['2,2', { hp: 100, hasMoved: false }],
            ['4,2', { hp: 100, hasMoved: false }],
        ]));

        const plan = ai.decide(self)!;
        const dist = Math.abs(plan.dest.c - enemy.c) + Math.abs(plan.dest.r - enemy.r);

        expect(dist).toBe(1);
    });

    it('advances toward the nearest enemy when no attack is worthwhile', () => {
        // A lone recon far from a tank: no favourable attack, so it should close in.
        const self: Placement = { type: 'recon', team: 'blue', c: 0, r: 0 };
        const enemy: Placement = { type: 'tank', team: 'red', c: 9, r: 0 };
        const ai = makeAI([self, enemy], new Map([
            ['0,0', { hp: 100, hasMoved: false }],
            ['9,0', { hp: 100, hasMoved: false }],
        ]));

        const plan = ai.decide(self)!;

        expect(plan.target).toBeNull();
        expect(plan.dest.c).toBeGreaterThan(self.c);
    });

    it('holds a zero-attack unit instead of walking it into the enemy', () => {
        const self: Placement = { type: 'supply', team: 'blue', c: 2, r: 2 };
        const enemy: Placement = { type: 'tank', team: 'red', c: 5, r: 2 };
        const ai = makeAI([self, enemy], new Map([
            ['2,2', { hp: 100, hasMoved: false }],
            ['5,2', { hp: 100, hasMoved: false }],
        ]));

        expect(ai.decide(self)).toBeNull();
    });

    it('skips a unit that has already moved', () => {
        const self: Placement = { type: 'infantry', team: 'blue', c: 2, r: 2 };
        const enemy: Placement = { type: 'tank', team: 'red', c: 3, r: 2 };
        const ai = makeAI([self, enemy], new Map([
            ['2,2', { hp: 100, hasMoved: true }],
            ['3,2', { hp: 100, hasMoved: false }],
        ]));

        expect(ai.decide(self)).toBeNull();
    });

    it('focuses the wounded one of two otherwise identical targets', () => {
        // Same type and cost, so only HP differs: the wounded one dies without
        // countering, while the healthy one would hit back.
        const self: Placement = { type: 'tank', team: 'blue', c: 2, r: 2 };
        const healthy: Placement = { type: 'infantry', team: 'red', c: 2, r: 1 };
        const wounded: Placement = { type: 'infantry', team: 'red', c: 2, r: 3 };
        const ai = makeAI([self, healthy, wounded], new Map([
            ['2,2', { hp: 100, hasMoved: false }],
            ['2,1', { hp: 100, hasMoved: false }],
            ['2,3', { hp: 30, hasMoved: false }],
        ]));

        const plan = ai.decide(self)!;

        expect(plan.target).toBe(wounded);
    });

    it('prefers a high-value target over finishing a nearly-dead cheap one', () => {
        // Cost-scaled value: a 10 HP infantry is worth ~100, so mauling a full tank
        // is the better play even though it means eating a counterattack.
        const self: Placement = { type: 'tank', team: 'blue', c: 2, r: 2 };
        const bigTarget: Placement = { type: 'tank', team: 'red', c: 2, r: 1 };
        const nearlyDead: Placement = { type: 'infantry', team: 'red', c: 2, r: 3 };
        const ai = makeAI([self, bigTarget, nearlyDead], new Map([
            ['2,2', { hp: 100, hasMoved: false }],
            ['2,1', { hp: 100, hasMoved: false }],
            ['2,3', { hp: 10, hasMoved: false }],
        ]));

        const plan = ai.decide(self)!;

        expect(plan.target).toBe(bigTarget);
    });

    it('returns null when there are no enemies left', () => {
        const self: Placement = { type: 'infantry', team: 'blue', c: 2, r: 2 };
        const ai = makeAI([self], new Map([['2,2', { hp: 100, hasMoved: false }]]));

        expect(ai.decide(self)).toBeNull();
    });
});

describe('AI.takeTurn', () => {
    it('drives the state machine and re-enables input afterwards', async () => {
        const self: Placement = { type: 'infantry', team: 'red', c: 2, r: 2 };
        const enemy: Placement = { type: 'tank', team: 'blue', c: 4, r: 2 };
        const controller = makeController();
        const manager = makeManager([self, enemy]);
        const tm = makeTurnManager(new Map([
            ['2,2', { hp: 100, hasMoved: false }],
            ['4,2', { hp: 100, hasMoved: false }],
        ]));
        const ai = new AI(controller, manager, makeGameDefs(), tm, 0);

        await ai.takeTurn({ team: 'red', name: 'AI', human: false } as never);

        expect(controller.input.disable).toHaveBeenCalled();
        expect(controller.input.enable).toHaveBeenCalled();
        // Select the unit, select the destination, then select the target.
        expect(controller.onSelect).toHaveBeenCalledTimes(3);
    });

    it('leaves input disabled once the game is won', async () => {
        const self: Placement = { type: 'infantry', team: 'red', c: 2, r: 2 };
        const controller = makeController();
        const manager = makeManager([self]);
        const tm = makeTurnManager(new Map([['2,2', { hp: 100, hasMoved: false }]]));
        (tm.winner as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ name: 'AI' });
        const ai = new AI(controller, manager, makeGameDefs(), tm, 0);

        await ai.takeTurn({ team: 'red', name: 'AI', human: false } as never);

        expect(controller.input.enable).not.toHaveBeenCalled();
    });
});
