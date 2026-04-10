
export type { UnitState } from '@web-game/shared';

// Legacy Unit class — kept for backward compatibility during migration.
// New code should use UnitState from @web-game/shared.
export class Unit {
    readonly id: number;
    readonly unitType: string;
    readonly owner: number;

    constructor(id: number, unitType: string, owner: number) {
        this.id = id;
        this.unitType = unitType;
        this.owner = owner;
    }
}