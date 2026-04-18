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

    
    createEntity(type: string, texture: Texture, params: any): Building | Unit | Terrain | null 
    {
        switch (type) {
            case 'Building':
                return new Building(texture, params);
            case 'Unit':
                return new Unit(texture, params);
            case 'Terrain':
                return new Terrain(texture, params);
            default:
                console.warn(`Unknown entity type: ${type}`);
                return null;
        }
    }

    createBuilding(texture: Texture, params: any): Building {
        return new Building(texture, params);
    }
    
    createUnit(texture: Texture, params: any): Unit {
        return new Unit(texture, params);
    }

    createTerrain(texture: Texture, params: any): Terrain {
        return new Terrain(texture, params);
    }
}