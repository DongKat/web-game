import { parse } from 'yaml';
import { Terrain } from './terrain';
import { Structure } from './structure';
import { Unit } from './unit';





/** Static registries keyed by type name. Definitions never change during a game. */
export interface GameDefs {
    terrains: Map<string, Terrain>;
    structures: Map<string, Structure>;
    units: Map<string, Unit>;
}

interface RawDefs {
    terrains: Record<string, { defenseBonus: number }>;
    structures: Record<string, { defenseBonus: number }>;
    units: Record<string, {
        attack: number;
        defense: number;
        movementRange: number;
        attackRange: number;
        cost: number;
    }>;
}

export function parseDefs(text: string): GameDefs {
    const raw: RawDefs = parse(text);

    const terrains = new Map<string, Terrain>();
    for (const [name, def] of Object.entries(raw.terrains)) {
        terrains.set(name, new Terrain(name, def.defenseBonus));
    }

    const structures = new Map<string, Structure>();
    for (const [name, def] of Object.entries(raw.structures)) {
        structures.set(name, new Structure(name, def.defenseBonus));
    }

    const units = new Map<string, Unit>();
    for (const [name, def] of Object.entries(raw.units)) {
        units.set(name, new Unit(name, def.attack, def.defense, def.movementRange, def.attackRange, def.cost));
    }

    return { terrains, structures, units };
}

export async function loadDefs(url = '/data/defs.yaml'): Promise<GameDefs> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`defs ${url} failed: ${res.status} ${res.statusText}`);
    return parseDefs(await res.text());
}
