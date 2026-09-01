import { INCOME_PER_PROPERTY } from './constant';
import type { GameMap, Placement } from './gameMap';

export class Player {
    readonly team: string;
    readonly name: string;
    readonly human: boolean; // Is human or AI
    funds: number;

    constructor(team: string, name: string, human = true, funds = 0) {
        this.team = team;
        this.name = name;
        this.human = human;
        this.funds = funds;
    }

    units(map: GameMap): Placement[] {
        // TODO: This iterate through the map :v
        return map.units.filter(u => u.team === this.team);
    }

    structures(map: GameMap): Placement[] {
        return map.structures.filter(s => s.team === this.team);
    }

    income(map: GameMap): number {
        return this.structures(map).length * INCOME_PER_PROPERTY;
    }

    collectIncome(map: GameMap): void {
        this.funds += this.income(map);
    }
}
