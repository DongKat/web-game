import type { Application } from 'pixi.js';
import type { StateHandler } from '../StateHandler';
import type { GameStateMachine } from '../GameStateMachine';
import { MainMenu } from '../../ui/MainMenu';
import { MapEditorState } from './MapEditorState';
import { DemoState } from './DemoState';

export class MainMenuState implements StateHandler {
    private menu: MainMenu | null = null;
    private stateMachine: GameStateMachine;

    constructor(stateMachine: GameStateMachine) {
        this.stateMachine = stateMachine;
    }

    enter(_app: Application): void {
        this.menu = new MainMenu();

        this.menu.onDemo = () => {
            this.stateMachine.changeState(new DemoState());
        };

        this.menu.onMapEditor = () => {
            this.stateMachine.changeState(new MapEditorState());
        };

        this.menu.onExit = () => {
            window.close();
            // Browser may block window.close() for non-script-opened tabs
            alert('You can close this tab to exit.');
        };

        this.menu.show();
    }

    exit(): void {
        if (this.menu) {
            this.menu.destroy();
            this.menu = null;
        }
    }

    update(_deltaTime: number): void {
        // No per-frame logic needed for the menu
    }
}
