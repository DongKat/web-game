import type { SPRITE_ID } from "../shared/constants";

// Just for reporting sprite id to be drawn
export interface IEntity {
    id: SPRITE_ID;
    data: any; // TODO: Define data structure for each entity type
    getSpriteId(): SPRITE_ID;
}

export abstract class Entity implements IEntity {
    id: SPRITE_ID;
    data: any;

    constructor(id: SPRITE_ID, data: any) {
        this.id = id;
        this.data = data;
    }

    getSpriteId(): SPRITE_ID {
        return this.id;
    }
}