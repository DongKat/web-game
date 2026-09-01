import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDefs } from '../src/defsLoader';

const DEFS_PATH = resolve(__dirname, '../public/data/defs.yaml');
const yaml = readFileSync(DEFS_PATH, 'utf-8');

describe('parseDefs', () => {
    const defs = parseDefs(yaml);

    it('loads all terrain types', () => {
        expect(defs.terrains.size).toBeGreaterThanOrEqual(5);
        expect(defs.terrains.has('grass')).toBe(true);
        expect(defs.terrains.has('water')).toBe(true);
    });

    it('terrain has correct fields', () => {
        const grass = defs.terrains.get('grass')!;
        expect(grass.name).toBe('grass');
        expect(grass.defenseBonus).toBe(1);
    });

    it('loads all structure types', () => {
        expect(defs.structures.size).toBeGreaterThanOrEqual(6);
        expect(defs.structures.has('hq')).toBe(true);
        expect(defs.structures.has('factory')).toBe(true);
    });

    it('structure has correct fields', () => {
        const hq = defs.structures.get('hq')!;
        expect(hq.name).toBe('hq');
        expect(hq.defenseBonus).toBe(4);
    });

    it('loads all unit types', () => {
        expect(defs.units.size).toBeGreaterThanOrEqual(10);
        expect(defs.units.has('infantry')).toBe(true);
        expect(defs.units.has('tank')).toBe(true);
    });

    it('unit has correct fields', () => {
        const tank = defs.units.get('tank')!;
        expect(tank.name).toBe('tank');
        expect(tank.attack).toBe(70);
        expect(tank.defense).toBe(50);
        expect(tank.movementRange).toBe(6);
        expect(tank.attackRange).toBe(1);
        expect(tank.cost).toBe(7000);
    });

    it('non-combat units have zero attack', () => {
        const supply = defs.units.get('supply')!;
        expect(supply.attack).toBe(0);
        expect(supply.attackRange).toBe(0);
    });
});
