import type { Player } from './player';
import type { GameMapManager } from './gameMapManager';
import type { ActionController } from './actionState';

export interface UnitState {
    hp: number;
    hasMoved: boolean;
    // TODO: ammo, fuel
}

export class TurnManager {
    readonly players: Player[];
    private currentPlayerIndex: number;
    private _turnCount: number;
    private readonly manager: GameMapManager;
    private readonly controller: ActionController;
    private readonly unitStates = new Map<number, UnitState>();

    constructor(players: Player[], manager: GameMapManager, controller: ActionController) {
        this.players = players;
        this.currentPlayerIndex = 0;
        this._turnCount = 1;
        this.manager = manager;
        this.controller = controller;
        this.initUnitStates();
    }

    get activePlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    get turnCount(): number {
        return this._turnCount;
    }

    private key(c: number, r: number): number {
        return r * this.manager.map.w + c;
    }

    private initUnitStates(): void {
        for (const unit of this.manager.map.units) {
            this.unitStates.set(this.key(unit.c, unit.r), { hp: 100, hasMoved: false });
        }
    }

    getUnitState(c: number, r: number): UnitState | undefined {
        return this.unitStates.get(this.key(c, r));
    }

    moveUnitState(fromC: number, fromR: number, toC: number, toR: number): void {
        const state = this.unitStates.get(this.key(fromC, fromR));
        if (!state) return;
        this.unitStates.delete(this.key(fromC, fromR));
        this.unitStates.set(this.key(toC, toR), state);
    }

    markMoved(c: number, r: number): void {
        const state = this.unitStates.get(this.key(c, r));
        if (state) state.hasMoved = true;
    }

    unmarkMoved(c: number, r: number): void {
        const state = this.unitStates.get(this.key(c, r));
        if (state) state.hasMoved = false;
    }

    applyDamage(c: number, r: number, damage: number): void {
        const state = this.unitStates.get(this.key(c, r));
        if (!state) return;
        state.hp = Math.max(0, state.hp - damage);
        if (state.hp <= 0) {
            this.unitStates.delete(this.key(c, r));
            this.manager.removeUnit(c, r);
        }
    }

    endTurn(): void {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        if (this.currentPlayerIndex === 0) {
            this._turnCount++;
        }

        const player = this.activePlayer;
        // player.collectIncome(this.manager.map);

        for (const unit of this.manager.map.units) {
            if (unit.team === player.team) {
                const state = this.unitStates.get(this.key(unit.c, unit.r));
                if (state) state.hasMoved = false;
            }
        }

        this.manager.resetUnitAlpha(player.team);
        this.controller.player = player;
    }

    isDefeated(player: Player): boolean {
        return player.units(this.manager.map).length === 0;
    }

    winner(): Player | null {
        const alive = this.players.filter(p => !this.isDefeated(p));
        return alive.length === 1 ? alive[0] : null;
    }
}
