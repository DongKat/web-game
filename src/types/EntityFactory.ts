import { Building } from "./Building.ts";
import { Unit } from "./Unit.ts";
import { Terrain } from "./Terrain.ts";

export class EntityFactory {
    public static createEntity(type: string): Building | Unit | Terrain | null {
        switch (type) {
            case 'Building':
                return new Building();
            case 'Unit':
                return new Unit();
            case 'Terrain':
                return new Terrain();
            default:
                console.warn(`EntityFactory: Unknown entity type: ${type}`);
                return null;
        }
    }
}