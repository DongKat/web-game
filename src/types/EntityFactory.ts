import { Building } from "./Building.ts";
import { Unit } from "./Unit.ts";
import { Terrain } from "./Terrain.ts";
import type { Texture } from "pixi.js";


// For creating entity instances based on some parameters (e.g. type, faction, etc.)
// Current use case: create entity when gamemap create new
export class EntityFactory {


    private static instance: EntityFactory;
    
    private constructor() { }

    public static getInstance(): EntityFactory {
        if (!EntityFactory.instance) {
            EntityFactory.instance = new EntityFactory();
        }
        return EntityFactory.instance;
    }

    
    public static createEntity(type: string): Building | Unit | Terrain | null
    {
        switch (type) {
            case 'Building':
                return new Building();
            case 'Unit':
                return new Unit();
            case 'Terrain':
                return new Terrain();
            default:
                throw new Error(`EntityFactory: Unknown entity type: ${type}`);
                console.warn(`EntityFactory: Unknown entity type: ${type}`);
                return null;
        }
    }
}