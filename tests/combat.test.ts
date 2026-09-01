import { describe, it, expect } from 'vitest';
import { damageFrom, canCounter, resolveExchange } from '../src/combat';
import { Unit } from '../src/unit';

const infantry = new Unit('infantry', 55, 45, 3, 1, 1000);
const tank = new Unit('tank', 70, 50, 6, 1, 7000);
const supply = new Unit('supply', 0, 20, 6, 0, 5000);
const artillery = new Unit('artillery', 80, 20, 5, 3, 6000);

describe('damageFrom', () => {
    it('scales attack by the attacker HP and the defender defense', () => {
        // 55 * 1.0 * 100/150 = 36.67 -> 37
        expect(damageFrom(infantry, 100, tank)).toBe(37);
    });

    it('reduces damage as the attacker loses HP', () => {
        // 55 * 0.5 * 100/150 = 18.33 -> 18
        expect(damageFrom(infantry, 50, tank)).toBe(18);
    });

    it('deals no damage at zero HP', () => {
        expect(damageFrom(infantry, 0, tank)).toBe(0);
    });
});

describe('canCounter', () => {
    it('is true for a melee-range armed unit', () => {
        expect(canCounter(tank)).toBe(true);
    });

    it('is false for a unit with no attack', () => {
        expect(canCounter(supply)).toBe(false);
    });

    it('is false for a unit that only attacks at range', () => {
        const ranged = new Unit('battleship', 65, 40, 5, 5, 28000);
        // attackRange 5 >= 1 so it counters today; the guard is on attack, not range.
        expect(canCounter(ranged)).toBe(true);
    });
});

describe('resolveExchange', () => {
    it('clamps damage to the defender remaining HP so overkill does not count', () => {
        const result = resolveExchange(tank, 100, infantry, 20);

        expect(result.damage).toBe(20);
        expect(result.kills).toBe(true);
    });

    it('skips the counterattack when the defender dies', () => {
        const result = resolveExchange(tank, 100, infantry, 20);

        expect(result.counter).toBe(0);
    });

    it('counters with the defender HP reduced by the incoming damage', () => {
        const attack = resolveExchange(infantry, 100, tank, 100);

        // Tank takes 37, counters from 63 HP: 70 * 0.63 * 100/145 = 30.4 -> 30
        expect(attack.damage).toBe(37);
        expect(attack.counter).toBe(30);
        expect(attack.kills).toBe(false);
        expect(attack.dies).toBe(false);
    });

    it('takes no counter from a zero-attack defender', () => {
        const result = resolveExchange(infantry, 100, supply, 100);

        expect(result.counter).toBe(0);
    });

    it('reports the attacker dying to a counterattack', () => {
        const result = resolveExchange(artillery, 10, tank, 100);

        expect(result.dies).toBe(true);
        expect(result.counter).toBe(10);
    });
});
