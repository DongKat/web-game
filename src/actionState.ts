import type { Placement } from './gameMap';
import type { GameMapManager } from './gameMapManager';
import { bfsReachable, bfsPath } from './highlightMovement';
import type { InputManager } from './inputManager';
import type { Player } from './player';

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

    constructor(player: Player, manager: GameMapManager, input: InputManager) {
        this.player = player;
        this.manager = manager;
        this.input = input;
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
            this.controller.transition(new SelectState(this.controller, this.manager, unit));
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

    constructor(controller: ActionController, manager: GameMapManager, unit: Placement) {
        this.controller = controller;
        this.manager = manager;
        this._unit = unit;
    }

    private key(c: number, r: number): number {
        return r * this.manager.map.w + c;
    }

    inRange(c: number, r: number): boolean {
        return this.reachable.has(this.key(c, r));
    }

    private highlightedCells: { c: number; r: number }[] = [];

    enter(): void {
        const cells = bfsReachable({ c: this._unit.c, r: this._unit.r }, 3, this.manager.map);
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
        const path = bfsPath({ c: this._unit.c, r: this._unit.r }, { c, r }, 3, this.manager.map);
        if (!path) return;

        // NOTE: For now let actionState resolve auto tile arrow path
        for (let i = 0; i < path.length; i++) {
            drawPathCell(this.manager, path[i - 1] ?? null, path[i], path[i + 1] ?? null);
        }
    }

    onSelect(c: number, r: number): void {
        if (!this.inRange(c, r)) return;
        if (c === this._unit.c && r === this._unit.r) return;

        this.manager.moveUnit(this._unit.c, this._unit.r, c, r);

        const directions = [
            { c: 0, r: -1 },
            { c: 1, r: 0 },
            { c: 0, r: 1 },
            { c: -1, r: 0 },
        ];
        for (const dir of directions) {
            const nc = c + dir.c;
            const nr = r + dir.r;
            const neighbor = this.manager.unitAt(nc, nr);
            if (neighbor && neighbor.team !== this.controller.player.team) {
                this.controller.transition(new AttackState(this.controller, this.manager, this._unit));
                return;
            }
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

    constructor(controller: ActionController, manager: GameMapManager, unit: Placement) {
        this.controller = controller;
        this.manager = manager;
        this.unit = unit;
    }

    enter(): void {
        // TODO: highlight attackable targets
    }

    exit(): void {
        // TODO: remove highlights
    }

    onHover(_c: number, _r: number): void {
        // TODO: show damage preview
    }

    onSelect(_c: number, _r: number): void {
        // TODO: execute attack, then transition back to Hover
        // this.controller.transition(new HoverState(this.controller, this.manager));
    }

    onCancel(): void {
        // TODO: undo move, back to SelectState
        this.controller.transition(new HoverState(this.controller, this.manager));
    }
}
