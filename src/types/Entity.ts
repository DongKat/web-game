
// Just for reporting sprite id to be drawn
export interface IEntity {
    importFromJson(json: string): void;
    exportToJson(): string;
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
}