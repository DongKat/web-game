// Just for reporting sprite id to be drawn
export interface IEntity {
    getType(): string;
    importFromJson(json: string): void;
    exportToJson(): string;
}

export class Entity implements IEntity {
    getType(): string {
        return "Entity";
    }

    importFromJson(_json: string): void {
        throw new Error("importFromJson() not implemented for Entity.");
    }

    exportToJson(): string {
        throw new Error("exportToJson() not implemented for Entity.");
    }
}