import type { Placement } from './gameMap';
import type { GameMapManager } from './gameMapManager';
import type { Player } from './player';

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

    constructor(player: Player, manager: GameMapManager) {
        this.player = player;
        this.manager = manager;
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

    enter(): void {}
    exit(): void {}

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

    onCancel(): void {}
}

export class SelectState implements ActionState {
    private readonly controller: ActionController;
    private readonly manager: GameMapManager;
    private readonly _unit: Placement;

    constructor(controller: ActionController, manager: GameMapManager, unit: Placement) {
        this.controller = controller;
        this.manager = manager;
        this._unit = unit;
    }

    enter(): void {
        // TODO: compute movement range (BFS/Dijkstra), highlight reachable cells
    }

    exit(): void {
        // TODO: clear movement range highlights and path arrow
    }

    onHover(_c: number, _r: number): void {
        // TODO: if cell in range, pathfind from unit to cell, draw arrow sprites on fx layer
        //       else clear arrow
    }

    onSelect(_c: number, _r: number): void {
        // TODO: if cell in range, move unit and transition to AttackState or HoverState
        //       needs: pathfinding, arrow rendering helper, movement range set
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
