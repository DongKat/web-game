import type { GameDefs } from './defsLoader';
import type { Placement } from './gameMap';
import type { GameMapManager } from './gameMapManager';
import { bfsReachable } from './highlightMovement';
import type { Player } from './player';
import type { TurnManager } from './turnManager';
import { resolveExchange } from './combat';
import type { Unit } from './unit';
import { ActionController, HoverState } from './actionState';

type Cell = { c: number; r: number };

const DIRS: Cell[] = [
    { c: 0, r: -1 },
    { c: 1, r: 0 },
    { c: 0, r: 1 },
    { c: -1, r: 0 },
];

/**
 * Removing a unit is worth more than the raw HP traded: it ends every future
 * counterattack and threat that unit represented. Applied to the killing blow only.
 */
export const KILL_BONUS = 0.3;

/** Score units in "cost value" so every term shares one currency. */
export function unitValue(cost: number, hp: number): number {
    return cost * (hp / 100);
}

export interface AttackPlan {
    /** Where the unit moves before attacking. */
    dest: Cell;
    target: Placement;
    score: number;
}

export interface MovePlan {
    dest: Cell;
    target: null;
}

export type Plan = AttackPlan | MovePlan;

function manhattan(a: Cell, b: Cell): number {
    return Math.abs(a.c - b.c) + Math.abs(a.r - b.r);
}

/**
 * Value swing of one attack, in cost currency. Positive means the exchange is worth
 * taking. Because value is cost-scaled, cheap units correctly accept trades that
 * would be bad for expensive ones -- no per-role special cases needed.
 */
export function scoreAttack(
    attacker: Unit, attackerHp: number,
    defender: Unit, defenderHp: number,
): number {
    const exchange = resolveExchange(attacker, attackerHp, defender, defenderHp);

    const gain = unitValue(defender.cost, exchange.damage);
    const loss = unitValue(attacker.cost, exchange.counter);
    const bonus = exchange.kills ? unitValue(defender.cost, defenderHp) * KILL_BONUS : 0;

    return gain - loss + bonus;
}

export class AI {
    private readonly manager: GameMapManager;
    private readonly defs: GameDefs;
    private readonly turnManager: TurnManager;
    private readonly controller: ActionController;
    /** Delay between synthetic inputs so the player can follow what the AI does. */
    readonly stepDelayMs: number;

    constructor(
        controller: ActionController,
        manager: GameMapManager,
        defs: GameDefs,
        turnManager: TurnManager,
        stepDelayMs = 300,
    ) {
        this.controller = controller;
        this.manager = manager;
        this.defs = defs;
        this.turnManager = turnManager;
        this.stepDelayMs = stepDelayMs;
    }

    /** Enemy units adjacent to `cell`, ignoring the acting unit's own square. */
    private adjacentEnemies(cell: Cell, team: string): Placement[] {
        const found: Placement[] = [];
        for (const dir of DIRS) {
            const enemy = this.manager.unitAt(cell.c + dir.c, cell.r + dir.r);
            if (enemy && enemy.team !== team) found.push(enemy);
        }
        return found;
    }

    /** Cells this unit may end its move on: its own square plus any empty reachable one. */
    private candidateCells(unit: Placement, range: number): Cell[] {
        const cells: Cell[] = [{ c: unit.c, r: unit.r }];
        for (const cell of bfsReachable({ c: unit.c, r: unit.r }, range, this.manager.map)) {
            if (!this.manager.unitAt(cell.c, cell.r)) cells.push(cell);
        }
        return cells;
    }

    /**
     * Pick this unit's action, in preference order: a favourable attack; else a
     * retreat if the unit is threatened and can reduce the number of attackers; else
     * an unfavourable attack if it is threatened and cornered; else a step toward the
     * nearest enemy. Returns null when the unit should hold.
     */
    decide(unit: Placement): Plan | null {
        const def = this.defs.units.get(unit.type);
        const state = this.turnManager.getUnitState(unit.c, unit.r);
        if (!def || !state || state.hasMoved) return null;

        const cells = this.candidateCells(unit, def.movementRange);

        // Zero-attack units (supply, lander) would otherwise fall through to "advance
        // on the nearest enemy" and walk straight into death. Hold until they have a job.
        if (def.attack <= 0) return null;

        // Track the best attack regardless of sign. A negative score only means
        // "worse than doing nothing", and doing nothing is not always an option.
        let best: AttackPlan | null = null;
        for (const dest of cells) {
            for (const target of this.adjacentEnemies(dest, unit.team!)) {
                const targetDef = this.defs.units.get(target.type);
                const targetState = this.turnManager.getUnitState(target.c, target.r);
                if (!targetDef || !targetState) continue;

                const score = scoreAttack(def, state.hp, targetDef, targetState.hp);
                if (!best || score > best.score) {
                    best = { dest, target, score };
                }
            }
        }
        if (best && best.score > 0) return best;

        const enemies = this.manager.map.units.filter(u => u.team !== unit.team);
        if (enemies.length === 0) return null;

        // The attack looked bad. If the unit is already under threat, try to break
        // contact; retreating only counts if it actually reduces the number of
        // attackers, otherwise the unit has gained nothing by walking.
        const here = this.attackerCount({ c: unit.c, r: unit.r }, enemies);
        if (here > 0) {
            const escape = this.bestRetreat(unit, here, cells, enemies);
            if (escape) return escape;

            // Cornered: it will be attacked wherever it stands. Swinging beats standing
            // still, which means taking the same damage without dealing any back.
            if (best) return best;
        }

        // Nothing to attack and nowhere safer: close on the nearest enemy.
        let bestCell: Cell | null = null;
        let bestDist = Infinity;
        for (const dest of cells) {
            const dist = Math.min(...enemies.map(e => manhattan(dest, e)));
            if (dist < bestDist) {
                bestDist = dist;
                bestCell = dest;
            }
        }
        if (!bestCell || (bestCell.c === unit.c && bestCell.r === unit.r)) return null;
        return { dest: bestCell, target: null };
    }

    /**
     * How many enemies could reach a square adjacent to `cell` and attack it next
     * turn. A deliberately narrow version of a threat map: it counts attackers rather
     * than weighing their damage, which is all the retreat decision needs.
     */
    private attackerCount(cell: Cell, enemies: Placement[]): number {
        let count = 0;
        for (const enemy of enemies) {
            const enemyDef = this.defs.units.get(enemy.type);
            if (!enemyDef || enemyDef.attack <= 0) continue;
            // Reach to any square adjacent to `cell`, hence range + 1.
            const reach = manhattan({ c: enemy.c, r: enemy.r }, cell);
            if (reach <= enemyDef.movementRange + 1) count++;
        }
        return count;
    }

    /**
     * Move to a square under threat from strictly fewer enemies. Returns null when no
     * reachable square is safer, so the caller can fall back to attacking.
     */
    private bestRetreat(unit: Placement, here: number, cells: Cell[], enemies: Placement[]): MovePlan | null {
        let bestCell: Cell | null = null;
        let bestCount = here;
        let bestDist = -Infinity;
        for (const dest of cells) {
            if (dest.c === unit.c && dest.r === unit.r) continue;
            const count = this.attackerCount(dest, enemies);
            const dist = Math.min(...enemies.map(e => manhattan(dest, e)));
            // Fewer attackers first; among equals, prefer the most distance gained.
            const better = bestCell === null
                ? count < bestCount
                : count < bestCount || (count === bestCount && dist > bestDist);
            if (better) {
                bestCount = count;
                bestCell = dest;
                bestDist = dist;
            }
        }
        if (!bestCell || bestCount >= here) return null;
        return { dest: bestCell, target: null };
    }

    private delay(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, this.stepDelayMs));
    }

    /**
     * Drive the same state machine a human drives, so the AI can only ever do what a
     * human could and its moves animate on screen. Units are re-planned immediately
     * before acting, never in a batch up front: that keeps plans from going stale and
     * makes focus fire fall out for free, since later units see earlier damage.
     */
    async takeTurn(player: Player): Promise<void> {
        this.controller.input.disable();
        try {
            // Snapshot the roster: map.units is mutated as units die during the turn.
            const roster = this.manager.map.units.filter(u => u.team === player.team);

            for (const rosterUnit of roster) {
                // Re-look-up: this unit may have moved or died since the snapshot.
                const unit = this.manager.map.units.find(u => u === rosterUnit);
                if (!unit) continue;

                const plan = this.decide(unit);
                if (!plan) continue;

                const from = { c: unit.c, r: unit.r };
                this.controller.onSelect(from.c, from.r);
                await this.delay();

                this.controller.onHover(plan.dest.c, plan.dest.r);
                await this.delay();

                this.controller.onSelect(plan.dest.c, plan.dest.r);

                if (plan.target) {
                    await this.delay();
                    this.controller.onSelect(plan.target.c, plan.target.r);
                }
                await this.delay();

                if (this.turnManager.winner()) return;
            }

            // Leave the machine in a clean state regardless of where planning stopped.
            this.controller.transition(new HoverState(this.controller, this.manager));
        } finally {
            if (!this.turnManager.winner()) this.controller.input.enable();
        }
    }
}
