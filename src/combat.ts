import type { Unit } from './unit';

/**
 * The single source of truth for combat arithmetic. Both AttackState (resolving a
 * human's attack) and the AI (scoring hypothetical attacks) go through here, so the
 * AI's predictions cannot drift from what actually happens.
 *
 * TODO: terrain/structure defenseBonus is not part of the formula yet -- when it
 * lands it belongs here, and the AI picks it up for free.
 */

/** Damage one attack deals, before clamping to the defender's remaining HP. */
export function damageFrom(attacker: Unit, attackerHp: number, defender: Unit): number {
    return Math.round(attacker.attack * (attackerHp / 100) * (100 / (100 + defender.defense)));
}

/** A unit that cannot shoot back deals no counterattack. */
export function canCounter(defender: Unit): boolean {
    return defender.attackRange >= 1 && defender.attack > 0;
}

export interface Exchange {
    /** Damage dealt to the defender, clamped to its remaining HP. */
    damage: number;
    /** Counterattack damage dealt back to the attacker, clamped to its remaining HP. */
    counter: number;
    /** True when the attack removes the defender from the board. */
    kills: boolean;
    /** True when the counterattack removes the attacker from the board. */
    dies: boolean;
}

/**
 * Resolve an attack without mutating anything. Deterministic and fully observable,
 * so this is the exact outcome rather than an estimate: a dead defender never
 * counters, and damage past a unit's remaining HP is overkill and does not count.
 */
export function resolveExchange(
    attacker: Unit, attackerHp: number,
    defender: Unit, defenderHp: number,
): Exchange {
    const damage = Math.min(damageFrom(attacker, attackerHp, defender), defenderHp);
    const kills = damage >= defenderHp;

    let counter = 0;
    if (!kills && canCounter(defender)) {
        counter = Math.min(damageFrom(defender, defenderHp - damage, attacker), attackerHp);
    }

    return { damage, counter, kills, dies: counter >= attackerHp };
}
