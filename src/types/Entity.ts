
// Just for reporting sprite id to be drawn
export interface IEntity {
    importFromJson(json: string): void;
    exportToJson(): string;
    getType(): string;
    getColor(): string; // Optional method for getting color, used by Renderer hack. Should be removed in the future.
}

export class Entity implements IEntity {
    constructor() {
    }

    importFromJson(json: string): void {
        throw new Error("importFromJson() not implemented for Entity.");
    }

    exportToJson(): string {
        throw new Error("exportToJson() not implemented for Entity.");
    }

    getType(): string {
        throw new Error("getType() not implemented for Entity.");
    }

    getColor(): string {
        throw new Error("getColor() not implemented for Entity.");
    }
}