import type { GameDefs } from './defsLoader';
import type { GameMapManager } from './gameMapManager';
import type { Player } from './player';
import type { TurnManager } from './turnManager';

const TEAM_COLORS: Record<string, string> = {
    blue: '#4a9eff',
    red: '#ff4a4a',
    green: '#4aff6a',
    yellow: '#ffe04a',
};

function teamColor(team: string): string {
    return TEAM_COLORS[team] ?? '#ccc';
}

export class UIManager {
    private readonly root: HTMLElement;
    private readonly topBar: HTMLElement;
    private readonly bottomPanel: HTMLElement;
    private readonly winOverlay: HTMLElement;

    private readonly turnLabel: HTMLElement;
    private readonly playerLabel: HTMLElement;
    private readonly fundsLabel: HTMLElement;
    private readonly phaseLabel: HTMLElement;

    private readonly terrainInfo: HTMLElement;
    private readonly unitInfo: HTMLElement;

    private readonly manager: GameMapManager;
    private readonly gameDefs: GameDefs;

    constructor(parent: HTMLElement, manager: GameMapManager, gameDefs: GameDefs) {
        this.manager = manager;
        this.gameDefs = gameDefs;

        this.root = document.createElement('div');
        this.root.id = 'game-ui';
        parent.appendChild(this.root);

        this.topBar = this.el('div', 'ui-top-bar');
        this.turnLabel = this.el('span', 'ui-turn');
        this.playerLabel = this.el('span', 'ui-player');
        this.fundsLabel = this.el('span', 'ui-funds');
        this.phaseLabel = this.el('span', 'ui-phase');
        this.topBar.append(this.turnLabel, this.playerLabel, this.fundsLabel, this.phaseLabel);

        this.bottomPanel = this.el('div', 'ui-bottom-panel');
        this.terrainInfo = this.el('div', 'ui-terrain-info');
        this.unitInfo = this.el('div', 'ui-unit-info');
        this.bottomPanel.append(this.terrainInfo, this.unitInfo);

        this.winOverlay = this.el('div', 'ui-win-overlay');
        this.winOverlay.style.display = 'none';

        this.root.append(this.topBar, this.bottomPanel, this.winOverlay);

        this.injectStyles();
    }

    updateTurn(tm: TurnManager): void {
        const player = tm.activePlayer;
        this.turnLabel.textContent = `Turn ${tm.turnCount}`;
        this.playerLabel.textContent = player.name;
        this.playerLabel.style.color = teamColor(player.team);
        this.fundsLabel.textContent = `$${player.funds}`;
    }

    updatePhase(phase: string): void {
        this.phaseLabel.textContent = phase;
    }

    updateHover(c: number, r: number, tm: TurnManager): void {
        const terrainType = this.manager.map.at(c, r);
        const terrainDef = this.gameDefs.terrains.get(terrainType);
        if (terrainDef) {
            this.terrainInfo.innerHTML =
                `<span class="ui-label">${terrainDef.name}</span>` +
                `<span class="ui-stat">DEF +${terrainDef.defenseBonus}</span>`;
        } else {
            this.terrainInfo.innerHTML = `<span class="ui-label">${terrainType}</span>`;
        }

        const unit = this.manager.unitAt(c, r);
        if (unit) {
            const unitDef = this.gameDefs.units.get(unit.type);
            const unitState = tm.getUnitState(c, r);
            const hp = unitState?.hp ?? 0;
            const name = unitDef?.name ?? unit.type;
            const color = teamColor(unit.team ?? '');
            this.unitInfo.innerHTML =
                `<span class="ui-label" style="color:${color}">${name}</span>` +
                `<span class="ui-stat">HP</span>` +
                `<div class="ui-hp-bar"><div class="ui-hp-fill" style="width:${hp}%;background:${hpColor(hp)}"></div></div>`;
        } else {
            this.unitInfo.innerHTML = '';
        }

        this.bottomPanel.style.display = 'flex';
    }

    hideHover(): void {
        this.bottomPanel.style.display = 'none';
    }

    showWinner(player: Player): void {
        this.winOverlay.innerHTML =
            `<div class="ui-win-box">` +
            `<div class="ui-win-title" style="color:${teamColor(player.team)}">${player.name} wins!</div>` +
            `</div>`;
        this.winOverlay.style.display = 'flex';
    }

    private el(tag: string, className: string): HTMLElement {
        const el = document.createElement(tag);
        el.className = className;
        return el;
    }

    private injectStyles(): void {
        if (document.getElementById('ui-manager-styles')) return;
        const style = document.createElement('style');
        style.id = 'ui-manager-styles';
        style.textContent = `
            #app {
                position: relative;
            }
            #game-ui {
                position: absolute;
                inset: 0;
                pointer-events: none;
                font-family: 'Segoe UI', system-ui, sans-serif;
                font-size: 14px;
                color: #eee;
                z-index: 10;
            }
            #game-ui * { pointer-events: none; }

            .ui-top-bar {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 8px 16px;
                background: rgba(0,0,0,0.7);
            }
            .ui-turn {
                font-weight: bold;
                font-size: 16px;
            }
            .ui-player {
                font-weight: bold;
                font-size: 16px;
            }
            .ui-funds {
                margin-left: auto;
                font-weight: bold;
                color: #ffe04a;
            }
            .ui-phase {
                padding: 2px 8px;
                border-radius: 4px;
                background: rgba(255,255,255,0.15);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .ui-bottom-panel {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                padding: 8px 16px;
                background: rgba(0,0,0,0.7);
            }
            .ui-terrain-info, .ui-unit-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .ui-label {
                font-weight: bold;
                text-transform: capitalize;
            }
            .ui-stat {
                font-size: 12px;
                color: #aaa;
            }
            .ui-hp-bar {
                width: 60px;
                height: 6px;
                background: #333;
                border-radius: 3px;
                overflow: hidden;
            }
            .ui-hp-fill {
                height: 100%;
                transition: width 0.2s;
                border-radius: 3px;
            }

            .ui-win-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.6);
            }
            .ui-win-box {
                padding: 32px 64px;
                background: rgba(0,0,0,0.85);
                border-radius: 8px;
                text-align: center;
            }
            .ui-win-title {
                font-size: 32px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
}

function hpColor(hp: number): string {
    if (hp > 60) return '#4aff6a';
    if (hp > 30) return '#ffe04a';
    return '#ff4a4a';
}
