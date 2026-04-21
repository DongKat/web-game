// Hold the state machine here and instantiate the main game components
import { Application, Container, Sprite, Graphics } from 'pixi.js';
import { GameMap } from '../map/GameMap';
import { Renderer } from '../renderer/Renderer';
import { KennySpriteProvider } from '../sprites/KennyTextureProvider';
import { InputManager } from '../core/InputManager';
import { DEFAULT_MAP_DATA_PATH, TILE_SIZE, SCALE } from '../shared/constants';
import type { TeamColor } from '../shared/constants';
import { Unit } from '../types/Unit';
import { Terrain } from '../types/Terrain';
import type { ITextureProvider } from '../sprites/ITextureProvider';

// Static unit stats lookup
const UNIT_STATS: Record<string, { hp: number; atk: number; def: number; mov: number; range: number }> = {
    Infantry:   { hp: 10, atk: 5, def: 1, mov: 3, range: 1 },
    Tank:       { hp: 10, atk: 7, def: 3, mov: 5, range: 1 },
    Artillery:  { hp: 10, atk: 9, def: 1, mov: 3, range: 3 },
};

type Point = { col: number; row: number };

export class Game {
    app: Application | null = null;
    gameMap: GameMap | null = null;
    renderer: Renderer | null = null;
    textureProvider: ITextureProvider | null = null;
    private worldContainer: Container | null = null;
    private uiContainer: Container | null = null;

    // Game state
    currentTeam: TeamColor = 'Red';
    private teams: TeamColor[] = ['Red', 'Blue'];
    private teamIndex: number = 0;
    private turnNumber: number = 1;

    // Cursor
    cursorCol: number = 0;
    cursorRow: number = 0;
    private cursorSprite: Sprite | null = null;

    // Selection state
    private selectedUnit: { col: number; row: number; unit: Unit } | null = null;
    private movementTiles: Point[] = [];
    private pathToTarget: Point[] = [];
    private highlightGraphics: Graphics | null = null;
    private pathGraphics: Graphics | null = null;

    // Action menu
    private actionMenuVisible: boolean = false;
    private actionMenuIndex: number = 0;
    private actionMenuItems: string[] = [];
    private pendingMoveTarget: Point | null = null;

    // HUD
    private hudElement: HTMLDivElement | null = null;

    constructor() { }

    async initialize(app: Application): Promise<void> {
        this.app = app;

        // Load spritesheet textures
        const textureProvider = KennySpriteProvider.getInstance();
        await textureProvider.loadAll();
        this.textureProvider = textureProvider;

        // Load map data
        this.gameMap = new GameMap();
        await this.gameMap.loadFromJSON(DEFAULT_MAP_DATA_PATH);

        // Create renderer and render terrain
        this.renderer = new Renderer(this.gameMap, textureProvider);
        this.renderer.intialize();
        this.renderer.renderTerrain();

        // Set up world container
        this.worldContainer = new Container();
        this.worldContainer.addChild(this.renderer.rootContainer);
        this.app.stage.addChild(this.worldContainer);

        // Set up UI overlay container on top
        this.uiContainer = new Container();
        this.app.stage.addChild(this.uiContainer);

        // Cursor sprite
        const cursorTexture = textureProvider.getUITexture('Cursor');
        this.cursorSprite = new Sprite(cursorTexture);
        this.cursorSprite.scale.set(SCALE);
        this.cursorSprite.texture.source.scaleMode = 'nearest';
        this.cursorSprite.zIndex = 1000;
        this.uiContainer.addChild(this.cursorSprite);

        // Graphics layers for highlights
        this.highlightGraphics = new Graphics();
        this.highlightGraphics.zIndex = 500;
        this.uiContainer.addChild(this.highlightGraphics);

        this.pathGraphics = new Graphics();
        this.pathGraphics.zIndex = 600;
        this.uiContainer.addChild(this.pathGraphics);

        // Set up input
        InputManager.getInstance().init(window, this.app.canvas);
        InputManager.getInstance().bindAction('move_up', ['ArrowUp', 'KeyW']);
        InputManager.getInstance().bindAction('move_down', ['ArrowDown', 'KeyS']);
        InputManager.getInstance().bindAction('move_left', ['ArrowLeft', 'KeyA']);
        InputManager.getInstance().bindAction('move_right', ['ArrowRight', 'KeyD']);
        InputManager.getInstance().bindAction('select', ['Enter', 'Space', 'KeyZ']);
        InputManager.getInstance().bindAction('cancel', ['Escape', 'KeyX']);
        InputManager.getInstance().bindAction('end_turn', ['KeyE']);

        // Create HUD
        this.createHUD();

        // Initial render
        this.renderer.update();
        this.updateCursorPosition();
        this.updateHUD();

        console.log('✅ Game initialized successfully');
    }

    private createHUD(): void {
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'game-hud';
        this.hudElement.innerHTML = `
            <div class="hud-turn">Turn <span id="hud-turn-num">1</span> — <span id="hud-team">Red</span></div>
            <div class="hud-info" id="hud-tile-info"></div>
            <div class="hud-controls">
                <span>Arrow/WASD: Move</span> <span>Z/Enter: Select</span>
                <span>X/Esc: Cancel</span> <span>E: End Turn</span>
            </div>
        `;
        document.body.appendChild(this.hudElement);
    }

    private updateHUD(): void {
        const turnNum = document.getElementById('hud-turn-num');
        const teamEl = document.getElementById('hud-team');
        const infoEl = document.getElementById('hud-tile-info');
        if (turnNum) turnNum.textContent = String(this.turnNumber);
        if (teamEl) {
            teamEl.textContent = this.currentTeam;
            teamEl.style.color = this.currentTeam === 'Red' ? '#ff6666' : '#6699ff';
        }
        if (infoEl && this.gameMap) {
            let info = `(${this.cursorCol}, ${this.cursorRow})`;
            const terrain = this.gameMap.getTile(this.cursorCol, this.cursorRow, 'Terrain');
            if (terrain instanceof Terrain) {
                info += ` ${terrain.data.terrainType} DEF+${terrain.data.defenseBonus}`;
            }
            const unit = this.gameMap.getTile(this.cursorCol, this.cursorRow, 'Unit');
            if (unit instanceof Unit) {
                info += ` | ${unit.data.team} ${unit.data.unitType} HP:${unit.data.healthPoint}`;
                if (unit.exhausted) info += ' (done)';
            }
            infoEl.textContent = info;
        }
    }

    private updateCursorPosition(): void {
        if (this.cursorSprite) {
            this.cursorSprite.x = this.cursorCol * TILE_SIZE * SCALE;
            this.cursorSprite.y = this.cursorRow * TILE_SIZE * SCALE;
        }
    }

    // BFS to find all reachable tiles within movement range
    private getMovementRange(col: number, row: number, range: number): Point[] {
        if (!this.gameMap) return [];
        const visited = new Map<string, number>();
        const queue: { col: number; row: number; cost: number }[] = [{ col, row, cost: 0 }];
        visited.set(`${col},${row}`, 0);
        const result: Point[] = [];

        while (queue.length > 0) {
            const curr = queue.shift()!;
            result.push({ col: curr.col, row: curr.row });

            const dirs = [
                { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
                { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
            ];

            for (const d of dirs) {
                const nc = curr.col + d.dc;
                const nr = curr.row + d.dr;
                if (!this.gameMap.inBounds(nc, nr)) continue;

                const terrain = this.gameMap.getTile(nc, nr, 'Terrain');
                if (!terrain || !(terrain instanceof Terrain) || !terrain.data.passable) continue;

                const moveCost = curr.cost + terrain.data.movementCost;
                if (moveCost > range) continue;

                const key = `${nc},${nr}`;
                if (visited.has(key) && visited.get(key)! <= moveCost) continue;

                // Can't move through enemy units
                const occupant = this.gameMap.getTile(nc, nr, 'Unit');
                if (occupant instanceof Unit && occupant.data.team !== this.currentTeam) continue;

                visited.set(key, moveCost);
                queue.push({ col: nc, row: nr, cost: moveCost });
            }
        }

        return result;
    }

    // BFS shortest path from start to goal within movement tiles
    private findPath(start: Point, goal: Point): Point[] {
        if (!this.gameMap) return [];
        const queue: Point[][] = [[start]];
        const visited = new Set<string>();
        visited.add(`${start.col},${start.row}`);

        while (queue.length > 0) {
            const path = queue.shift()!;
            const curr = path[path.length - 1];

            if (curr.col === goal.col && curr.row === goal.row) return path;

            const dirs = [
                { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
                { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
            ];

            for (const d of dirs) {
                const nc = curr.col + d.dc;
                const nr = curr.row + d.dr;
                const key = `${nc},${nr}`;
                if (visited.has(key)) continue;
                if (!this.movementTiles.some(t => t.col === nc && t.row === nr)) continue;
                // Can't path through enemy units
                const occupant = this.gameMap.getTile(nc, nr, 'Unit');
                if (occupant instanceof Unit && occupant.data.team !== this.currentTeam) continue;

                visited.add(key);
                queue.push([...path, { col: nc, row: nr }]);
            }
        }

        return [];
    }

    private drawMovementHighlights(): void {
        if (!this.highlightGraphics) return;
        this.highlightGraphics.clear();
        const tilePixel = TILE_SIZE * SCALE;

        for (const tile of this.movementTiles) {
            this.highlightGraphics.rect(
                tile.col * tilePixel, tile.row * tilePixel,
                tilePixel, tilePixel,
            );
        }
        this.highlightGraphics.fill({ color: 0x3399ff, alpha: 0.3 });
        this.highlightGraphics.stroke({ color: 0x3399ff, alpha: 0.5, width: 1 });
    }

    private drawPath(): void {
        if (!this.pathGraphics || !this.textureProvider) return;
        this.pathGraphics.clear();

        // Remove old path sprites
        while (this.pathGraphics.children.length > 0) {
            this.pathGraphics.removeChildAt(0);
        }

        if (this.pathToTarget.length <= 1) return;

        const tilePixel = TILE_SIZE * SCALE;

        for (let i = 0; i < this.pathToTarget.length; i++) {
            const p = this.pathToTarget[i];
            const prev = i > 0 ? this.pathToTarget[i - 1] : null;
            const next = i < this.pathToTarget.length - 1 ? this.pathToTarget[i + 1] : null;

            if (i === 0) continue; // skip start

            // Draw a small arrow/dot indicator
            const cx = p.col * tilePixel + tilePixel / 2;
            const cy = p.row * tilePixel + tilePixel / 2;

            if (!next) {
                // endpoint — draw larger circle
                this.pathGraphics.circle(cx, cy, tilePixel * 0.25);
                this.pathGraphics.fill({ color: 0xffff00, alpha: 0.7 });
            } else {
                // intermediate — draw line segments
                this.pathGraphics.circle(cx, cy, tilePixel * 0.12);
                this.pathGraphics.fill({ color: 0xffff00, alpha: 0.5 });
            }

            // Draw connecting line from prev
            if (prev) {
                const px = prev.col * tilePixel + tilePixel / 2;
                const py = prev.row * tilePixel + tilePixel / 2;
                this.pathGraphics.moveTo(px, py);
                this.pathGraphics.lineTo(cx, cy);
                this.pathGraphics.stroke({ color: 0xffff00, alpha: 0.6, width: 3 });
            }
        }
    }

    private clearSelection(): void {
        this.selectedUnit = null;
        this.movementTiles = [];
        this.pathToTarget = [];
        this.highlightGraphics?.clear();
        this.pathGraphics?.clear();
        while (this.pathGraphics && this.pathGraphics.children.length > 0) {
            this.pathGraphics.removeChildAt(0);
        }
        this.hideActionMenu();
    }

    private showActionMenu(items: string[]): void {
        this.actionMenuVisible = true;
        this.actionMenuItems = items;
        this.actionMenuIndex = 0;
        this.renderActionMenu();
    }

    private hideActionMenu(): void {
        this.actionMenuVisible = false;
        this.actionMenuItems = [];
        this.actionMenuIndex = 0;
        // Remove action menu element
        const el = document.getElementById('action-menu');
        if (el) el.remove();
    }

    private renderActionMenu(): void {
        let el = document.getElementById('action-menu');
        if (!el) {
            el = document.createElement('div');
            el.id = 'action-menu';
            document.body.appendChild(el);
        }
        const tilePixel = TILE_SIZE * SCALE;
        const target = this.pendingMoveTarget ?? { col: this.cursorCol, row: this.cursorRow };
        el.style.left = `${(target.col + 1) * tilePixel + 8}px`;
        el.style.top = `${target.row * tilePixel}px`;

        el.innerHTML = this.actionMenuItems.map((item, i) =>
            `<div class="action-item${i === this.actionMenuIndex ? ' selected' : ''}">${item}</div>`
        ).join('');
    }

    private canAttackFrom(fromCol: number, fromRow: number, unit: Unit): Point[] {
        if (!this.gameMap) return [];
        const targets: Point[] = [];
        const range = UNIT_STATS[unit.data.unitType]?.range ?? unit.data.attackRange;

        for (let dr = -range; dr <= range; dr++) {
            for (let dc = -range; dc <= range; dc++) {
                if (Math.abs(dr) + Math.abs(dc) > range || (dr === 0 && dc === 0)) continue;
                const nc = fromCol + dc;
                const nr = fromRow + dr;
                if (!this.gameMap.inBounds(nc, nr)) continue;
                const target = this.gameMap.getTile(nc, nr, 'Unit');
                if (target instanceof Unit && target.data.team !== unit.data.team) {
                    targets.push({ col: nc, row: nr });
                }
            }
        }
        return targets;
    }

    private performAttack(attacker: Unit, defender: Unit): void {
        const atkStats = UNIT_STATS[attacker.data.unitType] ?? { atk: attacker.data.attackPower, def: 0 };
        const defStats = UNIT_STATS[defender.data.unitType] ?? { atk: defender.data.attackPower, def: 0 };

        // Damage = attacker ATK - defender DEF (min 1), scaled by HP ratio
        const atkDmg = Math.max(1, Math.round((atkStats.atk - defStats.def) * (attacker.data.healthPoint / 10)));
        defender.data.healthPoint = Math.max(0, defender.data.healthPoint - atkDmg);

        console.log(`⚔️ ${attacker.data.team} ${attacker.data.unitType} deals ${atkDmg} dmg → ${defender.data.team} ${defender.data.unitType} HP:${defender.data.healthPoint}`);

        // Counter attack if defender survives and in range
        if (defender.data.healthPoint > 0) {
            const defRange = UNIT_STATS[defender.data.unitType]?.range ?? defender.data.attackRange;
            if (defRange >= 1) { // simplified: always counter if alive and melee range
                const counterDmg = Math.max(1, Math.round((defStats.atk - atkStats.def) * (defender.data.healthPoint / 10)));
                attacker.data.healthPoint = Math.max(0, attacker.data.healthPoint - counterDmg);
                console.log(`🔄 Counter: ${defender.data.team} ${defender.data.unitType} deals ${counterDmg} → HP:${attacker.data.healthPoint}`);
            }
        }
    }

    private removeDeadUnits(): void {
        if (!this.gameMap) return;
        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const unit = this.gameMap.getTile(col, row, 'Unit');
                if (unit instanceof Unit && unit.data.healthPoint <= 0) {
                    this.gameMap.setTile(col, row, 'Unit', null);
                }
            }
        }
    }

    private endTurn(): void {
        if (!this.gameMap) return;
        // Reset exhaustion for current team
        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const unit = this.gameMap.getTile(col, row, 'Unit');
                if (unit instanceof Unit && unit.data.team === this.currentTeam) {
                    unit.exhausted = false;
                }
            }
        }

        // Switch team
        this.teamIndex = (this.teamIndex + 1) % this.teams.length;
        this.currentTeam = this.teams[this.teamIndex];
        if (this.teamIndex === 0) this.turnNumber++;

        this.clearSelection();
        console.log(`🔄 Turn ${this.turnNumber} — ${this.currentTeam}'s turn`);
    }

    gameLoop(_deltaTime: number): void {
        const input = InputManager.getInstance();

        if (this.actionMenuVisible) {
            this.handleActionMenu(input);
        } else if (this.selectedUnit) {
            this.handleUnitSelected(input);
        } else {
            this.handleCursorMode(input);
        }

        this.updateCursorPosition();
        this.renderer?.update();
        this.updateHUD();
        input.update();
    }

    private handleCursorMode(input: InputManager): void {
        if (!this.gameMap) return;
        let moved = false;

        if (input.isActionPressed('move_up') && this.cursorRow > 0) { this.cursorRow--; moved = true; }
        if (input.isActionPressed('move_down') && this.cursorRow < this.gameMap.mapHeight - 1) { this.cursorRow++; moved = true; }
        if (input.isActionPressed('move_left') && this.cursorCol > 0) { this.cursorCol--; moved = true; }
        if (input.isActionPressed('move_right') && this.cursorCol < this.gameMap.mapWidth - 1) { this.cursorCol++; moved = true; }

        if (moved) {
            // no-op, cursor position updated in main loop
        }

        if (input.isActionPressed('select')) {
            const unit = this.gameMap.getTile(this.cursorCol, this.cursorRow, 'Unit');
            if (unit instanceof Unit && unit.data.team === this.currentTeam && !unit.exhausted) {
                // Select this unit
                this.selectedUnit = { col: this.cursorCol, row: this.cursorRow, unit };
                const stats = UNIT_STATS[unit.data.unitType];
                const movRange = stats?.mov ?? unit.data.movementRange;
                this.movementTiles = this.getMovementRange(this.cursorCol, this.cursorRow, movRange);
                this.drawMovementHighlights();
            }
        }

        if (input.isActionPressed('end_turn')) {
            this.endTurn();
        }
    }

    private handleUnitSelected(input: InputManager): void {
        if (!this.gameMap || !this.selectedUnit) return;

        if (input.isActionPressed('move_up') && this.cursorRow > 0) this.cursorRow--;
        if (input.isActionPressed('move_down') && this.cursorRow < this.gameMap.mapHeight - 1) this.cursorRow++;
        if (input.isActionPressed('move_left') && this.cursorCol > 0) this.cursorCol--;
        if (input.isActionPressed('move_right') && this.cursorCol < this.gameMap.mapWidth - 1) this.cursorCol++;

        // Update path preview
        const isInRange = this.movementTiles.some(t => t.col === this.cursorCol && t.row === this.cursorRow);
        if (isInRange) {
            const start = { col: this.selectedUnit.col, row: this.selectedUnit.row };
            this.pathToTarget = this.findPath(start, { col: this.cursorCol, row: this.cursorRow });
            this.drawPath();
        } else {
            this.pathToTarget = [];
            this.pathGraphics?.clear();
        }

        if (input.isActionPressed('select') && isInRange) {
            const occupant = this.gameMap.getTile(this.cursorCol, this.cursorRow, 'Unit');
            const isSelf = this.cursorCol === this.selectedUnit.col && this.cursorRow === this.selectedUnit.row;
            if (!occupant || isSelf) {
                // Move here, then show action menu
                this.pendingMoveTarget = { col: this.cursorCol, row: this.cursorRow };
                const attacks = this.canAttackFrom(this.cursorCol, this.cursorRow, this.selectedUnit.unit);
                const items: string[] = [];
                if (attacks.length > 0) items.push('Attack');
                items.push('Wait');
                this.showActionMenu(items);
            }
        }

        if (input.isActionPressed('cancel')) {
            this.clearSelection();
        }
    }

    private handleActionMenu(input: InputManager): void {
        if (input.isActionPressed('move_up') && this.actionMenuIndex > 0) {
            this.actionMenuIndex--;
            this.renderActionMenu();
        }
        if (input.isActionPressed('move_down') && this.actionMenuIndex < this.actionMenuItems.length - 1) {
            this.actionMenuIndex++;
            this.renderActionMenu();
        }

        if (input.isActionPressed('select')) {
            const action = this.actionMenuItems[this.actionMenuIndex];
            this.executeAction(action);
        }

        if (input.isActionPressed('cancel')) {
            this.hideActionMenu();
            // Go back to unit selected mode without moving
        }
    }

    private executeAction(action: string): void {
        if (!this.gameMap || !this.selectedUnit || !this.pendingMoveTarget) return;

        const fromCol = this.selectedUnit.col;
        const fromRow = this.selectedUnit.row;
        const toCol = this.pendingMoveTarget.col;
        const toRow = this.pendingMoveTarget.row;
        const unit = this.selectedUnit.unit;

        // Move the unit
        if (fromCol !== toCol || fromRow !== toRow) {
            this.gameMap.setTile(fromCol, fromRow, 'Unit', null);
            this.gameMap.setTile(toCol, toRow, 'Unit', unit);
        }

        if (action === 'Attack') {
            // Find attackable targets from new position
            const targets = this.canAttackFrom(toCol, toRow, unit);
            if (targets.length > 0) {
                // Auto-attack closest target (simple)
                const target = targets[0];
                const defender = this.gameMap.getTile(target.col, target.row, 'Unit');
                if (defender instanceof Unit) {
                    this.performAttack(unit, defender);
                    this.removeDeadUnits();
                }
            }
        }

        // Exhaust unit
        unit.exhausted = true;
        this.clearSelection();
        this.cursorCol = toCol;
        this.cursorRow = toRow;

        // Check win condition
        this.checkWinCondition();
    }

    private checkWinCondition(): void {
        if (!this.gameMap) return;
        const remaining = new Set<TeamColor>();
        for (let row = 0; row < this.gameMap.mapHeight; row++) {
            for (let col = 0; col < this.gameMap.mapWidth; col++) {
                const unit = this.gameMap.getTile(col, row, 'Unit');
                if (unit instanceof Unit) {
                    remaining.add(unit.data.team);
                }
            }
        }
        if (remaining.size === 1) {
            const winner = [...remaining][0];
            console.log(`🏆 ${winner} wins!`);
            setTimeout(() => alert(`${winner} wins!`), 100);
        }
    }

    destroyHUD(): void {
        this.hudElement?.remove();
        const menu = document.getElementById('action-menu');
        if (menu) menu.remove();
    }
}