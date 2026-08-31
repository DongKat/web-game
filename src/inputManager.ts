import { TILE_SIZE } from './constant';
import type { Application, Container, FederatedPointerEvent } from 'pixi.js';
import type { Cursor } from './cursor';
import type { GameMap } from './gameMap';

type InputEvent = 'cellhover' | 'cellselect' | 'cancel';

export class InputManager {
    private readonly app: Application;
    private readonly world: Container;
    private readonly cursor: Cursor;
    private readonly map: GameMap;
    private readonly listeners = new Map<InputEvent, Set<(...args: any[]) => void>>();
    private readonly onKeyDown: (e: KeyboardEvent) => void;
    private enabled = true;

    constructor(app: Application, world: Container, cursor: Cursor, map: GameMap) {
        this.app = app;
        this.world = world;
        this.cursor = cursor;
        this.map = map;

        // this.bindPointer();
        this.onKeyDown = this.handleKey.bind(this);
        window.addEventListener('keydown', this.onKeyDown);
    }

    on(event: 'cellhover' | 'cellselect', cb: (c: number, r: number) => void): void;
    on(event: 'cancel', cb: () => void): void;
    on(event: InputEvent, cb: (...args: any[]) => void): void {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(cb);
    }

    off(event: InputEvent, cb: (...args: any[]) => void): void {
        this.listeners.get(event)?.delete(cb);
    }

    enable(): void {
        this.enabled = true;
    }

    disable(): void {
        this.enabled = false;
    }

    destroy(): void {
        this.enabled = false;
        window.removeEventListener('keydown', this.onKeyDown);
        this.listeners.clear();
    }

    private screenToCell(screenX: number, screenY: number): { c: number; r: number } | null {
        const local = this.world.toLocal({ x: screenX, y: screenY });
        const c = Math.floor(local.x / TILE_SIZE);
        const r = Math.floor(local.y / TILE_SIZE);
        if (c < 0 || c >= this.map.w || r < 0 || r >= this.map.h) return null;
        return { c, r };
    }

    private bindPointer(): void {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        this.app.stage.on('pointermove', (e: FederatedPointerEvent) => {
            if (!this.enabled || this.cursor.locked) return;
            const cell = this.screenToCell(e.globalX, e.globalY);
            if (!cell) return;
            const prev = this.cursor.cell;
            if (!prev || cell.c !== prev.c || cell.r !== prev.r) {
                this.emit('cellhover', cell.c, cell.r);
            }
        });

        this.app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
            if (!this.enabled) return;
            const cell = this.screenToCell(e.globalX, e.globalY);
            if (!cell) return;
            this.emit('cellselect', cell.c, cell.r);
        });
    }

    private handleKey(e: KeyboardEvent): void {
        if (!this.enabled) return;

        switch (e.key) {
            case 'ArrowUp': case 'w':
                this.nudge(0, -1);
                break;
            case 'ArrowDown': case 's':
                this.nudge(0, 1);
                break;
            case 'ArrowLeft': case 'a':
                this.nudge(-1, 0);
                break;
            case 'ArrowRight': case 'd':
                this.nudge(1, 0);
                break;
            case 'Enter': case ' ':
                if (this.cursor.cell) {
                    this.emit('cellselect', this.cursor.cell.c, this.cursor.cell.r);
                }
                break;
            case 'Escape':
                this.emit('cancel');
                break;
            default:
                return;
        }
        e.preventDefault();
    }

    private nudge(dc: number, dr: number): void {
        if (this.cursor.locked) return;
        const prev = this.cursor.cell ?? { c: 0, r: 0 };
        const c = Math.max(0, Math.min(this.map.w - 1, prev.c + dc));
        const r = Math.max(0, Math.min(this.map.h - 1, prev.r + dr));
        if (c !== prev.c || r !== prev.r || !this.cursor.cell) {
            this.emit('cellhover', c, r);
        }
    }

    private emit(event: InputEvent, ...args: any[]): void {
        this.listeners.get(event)?.forEach(cb => cb(...args));
    }
}
