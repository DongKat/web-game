import type { GameDefs } from './defsLoader';
import type { Placement } from './gameMap';
import type { GameMapManager } from './gameMapManager';
import { bfsReachable, bfsPath } from './highlightMovement';
import type { InputManager } from './inputManager';
import type { Player } from './player';
import type { TurnManager } from './turnManager';

type Cell = { c: number; r: number };

function facing(from: Cell, to: Cell): string {
    const dc = to.c - from.c;
    const dr = to.r - from.r;
    if (dr < 0) return 'n';
    if (dr > 0) return 's';
    if (dc < 0) return 'w';
    return 'e';
}

function isVertical(a: Cell, b: Cell): boolean {
    return a.c === b.c;
}

function drawPathCell(
    manager: GameMapManager,
    prev: Cell | null,
    curr: Cell,
    next: Cell | null,
): void {
    if (!prev) return;
    if (!next) {
        const dir = facing(prev, curr);
        manager.placeFxByQuery({ subtype: 'arrow', facing: dir }, curr.c, curr.r);
    } else {
        const vertical = isVertical(prev, curr) && isVertical(curr, next);
        const horizontal = !isVertical(prev, curr) && !isVertical(curr, next);
        if (vertical || horizontal) {
            const edge = vertical ? 5 : 10;
            manager.placeFxByQuery({ subtype: 'line', edge }, curr.c, curr.r);
        } else {
            const edgeBit: Record<string, number> = { n: 1, e: 2, s: 4, w: 8 };
            const fromDir = facing(curr, prev);
            const toDir = facing(curr, next);
            const edge = edgeBit[fromDir] + edgeBit[toDir];
            manager.placeFxByQuery({ subtype: 'corner', edge }, curr.c, curr.r);
        }
    }
}

export interface ActionState {
    enter(): void;
    exit(): void;
    onHover(c: number, r: number): void;
    onSelect(c: number, r: number): void;
    onCancel(): void;
}

export class ActionController {
    private current!: ActionState;
    player: Player;
    readonly manager: GameMapManager;
    readonly input: InputManager;
    readonly gameDefs: GameDefs;
    turnManager!: TurnManager;

    constructor(player: Player, manager: GameMapManager, input: InputManager, gameDefs: GameDefs) {
        this.player = player;
        this.manager = manager;
        this.input = input;
        this.gameDefs = gameDefs;
        this.current = new HoverState(this, manager);
        this.current.enter();
    }

    transition(next: ActionState): void {
        this.current?.exit();
        this.current = next;
        this.current?.enter();
    }

    onHover(c: number, r: number): void {
        this.current.onHover(c, r);
    }

    onSelect(c: number, r: number): void {
        this.current.onSelect(c, r);
    }

    onCancel(): void {
        this.current.onCancel();
    }
}

export class HoverState implements ActionState {
    private readonly controller: ActionController;
    private readonly manager: GameMapManager;
    // TODO: Use gameDefs to show unit/terrain info on hover

    constructor(controller: ActionController, manager: GameMapManager) {
        this.controller = controller;
        this.manager = manager;
    }

    enter(): void { }
    exit(): void { }

    onHover(_c: number, _r: number): void {
        // TODO: show terrain/unit info
    }

    onSelect(c: number, r: number): void {
        const unit = this.manager.unitAt(c, r);
        if (unit && unit.team === this.controller.player.team) {
            this.controller.transition(new SelectState(this.controller, this.manager, unit, this.controller.gameDefs));
            return;
        }
    }

    onCancel(): void { }
}

export class SelectState implements ActionState {
    private readonly controller: ActionController;
    private readonly manager: GameMapManager;
    private readonly _unit: Placement;
    private reachable = new Set<number>();
    private readonly gameDefs: GameDefs;

    constructor(controller: ActionController, manager: GameMapManager, unit: Placement, gameDefs: GameDefs) {
        this.controller = controller;
        this.manager = manager;
        this._unit = unit;
        this.gameDefs = gameDefs;
    }

    private key(c: number, r: number): number {
        return r * this.manager.map.w + c;
    }

    inRange(c: number, r: number): boolean {
        return this.reachable.has(this.key(c, r));
    }

    private highlightedCells: { c: number; r: number }[] = [];

    enter(): void {
        const unitDef = this.gameDefs.units.get(this._unit.type);
        const range = unitDef?.movementRange; // TODO: factor in terrain movement cost
        if (range === undefined) {
            throw new Error(`Unit type ${this._unit.type} has no definition`);
        }
        if (range <= 0) {
            throw new Error(`Unit type ${this._unit.type} has invalid movement range: ${range}`);
        }
        const cells = bfsReachable({ c: this._unit.c, r: this._unit.r }, range, this.manager.map);
        this.reachable.add(this.key(this._unit.c, this._unit.r));
        for (const cell of cells) {
            this.reachable.add(this.key(cell.c, cell.r));
            this.manager.placeOverlay('highlight', cell.c, cell.r);
            this.highlightedCells.push(cell);
        }
        this.controller.input.cellFilter = (c, r) => this.inRange(c, r);
    }

    exit(): void {
        for (const cell of this.highlightedCells) {
            this.manager.removeOverlay(cell.c, cell.r);
        }
        this.highlightedCells = [];
        this.manager.clearFx();
        this.controller.input.cellFilter = null;
    }

    onHover(c: number, r: number): void {
        this.manager.clearFx();
        if (!this.inRange(c, r)) return;
        const unitMovementRange = this.gameDefs.units.get(this._unit.type)?.movementRange ?? 0;
        // This should never happen
        if (unitMovementRange <= 0)
            throw new Error(`Unit type ${this._unit.type} has invalid movement range: ${unitMovementRange}`);
        const path = bfsPath({ c: this._unit.c, r: this._unit.r }, { c, r }, unitMovementRange, this.manager.map);
        if (!path) return;

        // NOTE: For now let actionState resolve auto tile arrow path
        for (let i = 0; i < path.length; i++) {
            drawPathCell(this.manager, path[i - 1] ?? null, path[i], path[i + 1] ?? null);
        }
    }

    onSelect(c: number, r: number): void {
        if (!this.inRange(c, r)) return;
        if (c === this._unit.c && r === this._unit.r) return;

        // If target cell is occupied by any unit, prevent selection.
        if (this.manager.unitAt(c, r)) {
            return;

        }
        this.controller.turnManager.moveUnitState(this._unit.c, this._unit.r, c, r);
        this.manager.moveUnit(this._unit.c, this._unit.r, c, r);
        this.controller.turnManager.markMoved(c, r);

        const directions = [
            { c: 0, r: -1 },
            { c: 1, r: 0 },
            { c: 0, r: 1 },
            { c: -1, r: 0 },
        ];

        const targets: Placement[] = [];
        const unitDef = this.gameDefs.units.get(this._unit.type);
        if (unitDef && unitDef.attack > 0) {
            for (const dir of directions) {
                const nc = c + dir.c;
                const nr = r + dir.r;
                const neighbor = this.manager.unitAt(nc, nr);
                if (neighbor && neighbor.team !== this.controller.player.team) {
                    targets.push(neighbor);
                }
            }
        }

        if (targets.length > 0) {
            this.controller.transition(new AttackState(this.controller, this.manager, { ...this._unit, c, r }, this.gameDefs, targets));
            return;
        }

        this.controller.transition(new HoverState(this.controller, this.manager));
    }


    onCancel(): void {
        this.controller.transition(new HoverState(this.controller, this.manager));
    }
}

export class AttackState implements ActionState {
    private readonly controller: ActionController;
    private readonly manager: GameMapManager;
    private readonly unit: Placement;
    private readonly gameDefs: GameDefs;
    private readonly possibleTargets: Placement[];
    private readonly targetKeys: Set<number>;

    constructor(controller: ActionController, manager: GameMapManager, unit: Placement, gameDefs: GameDefs, possibleTargets: Placement[]) {
        this.controller = controller;
        this.manager = manager;
        this.unit = unit;
        this.gameDefs = gameDefs;
        this.possibleTargets = possibleTargets;
        this.targetKeys = new Set(possibleTargets.map(t => t.r * manager.map.w + t.c));
    }

    enter(): void {
        for (const t of this.possibleTargets) {
            this.manager.placeOverlay('highlight', t.c, t.r);
        }
        // this.controller.input.cellFilter = (c, r) =>
        //     this.targetKeys.has(r * this.manager.map.w + c);
    }

    exit(): void {
        for (const t of this.possibleTargets) {
            this.manager.removeOverlay(t.c, t.r);
        }
        // this.controller.input.cellFilter = null;
    }

    onHover(_c: number, _r: number): void { }

    onSelect(c: number, r: number): void {
        const target = this.possibleTargets.find(t => t.c === c && t.r === r);
        if (!target) return;

        const attackerDef = this.gameDefs.units.get(this.unit.type);
        const defenderDef = this.gameDefs.units.get(target.type);
        if (!attackerDef || !defenderDef) return;

        const tm = this.controller.turnManager;
        const attackerState = tm.getUnitState(this.unit.c, this.unit.r);
        const defenderState = tm.getUnitState(target.c, target.r);
        if (!attackerState || !defenderState) return;

        const attackerHpRatio = attackerState.hp / 100;
        const damage = Math.round(attackerDef.attack * attackerHpRatio * (100 / (100 + defenderDef.defense)));
        tm.applyDamage(target.c, target.r, damage);

        if (defenderState.hp > 0 && defenderDef.attackRange >= 1) {
            const defenderHpRatio = defenderState.hp / 100;
            const counterDamage = Math.round(defenderDef.attack * defenderHpRatio * (100 / (100 + attackerDef.defense)));
            tm.applyDamage(this.unit.c, this.unit.r, counterDamage);
        }

        this.controller.transition(new HoverState(this.controller, this.manager));
    }

    onCancel(): void {
        this.controller.transition(new HoverState(this.controller, this.manager));
    }
}
