export interface IEntity {
    importFromJson(json: string): void;
    exportToJson(): string;
    getType(): string;
    getOwner(): number;
}

export class Entity implements IEntity {
    constructor() {}

    importFromJson(_json: string): void {
        throw new Error("importFromJson() not implemented for Entity.");
    }

    exportToJson(): string {
        throw new Error("exportToJson() not implemented for Entity.");
    }

    getType(): string {
        throw new Error("getType() not implemented for Entity.");
    }

    getOwner(): number {
        return 0;
    }
}