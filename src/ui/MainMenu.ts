export class MainMenu {
    private container: HTMLDivElement;
    onDemo: (() => void) | null = null;
    onMapEditor: (() => void) | null = null;
    onExit: (() => void) | null = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'main-menu';
        this.container.innerHTML = `
            <div class="menu-content">
                <h1 class="menu-title">Web Game</h1>
                <div class="menu-buttons">
                    <button class="menu-btn" id="btn-demo">Demo</button>
                    <button class="menu-btn" id="btn-map-editor">Map Editor</button>
                    <button class="menu-btn" id="btn-exit">Exit</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);

        this.container.querySelector('#btn-demo')!.addEventListener('click', () => {
            this.onDemo?.();
        });

        this.container.querySelector('#btn-map-editor')!.addEventListener('click', () => {
            this.onMapEditor?.();
        });

        this.container.querySelector('#btn-exit')!.addEventListener('click', () => {
            this.onExit?.();
        });
    }

    show(): void {
        this.container.style.display = 'flex';
    }

    hide(): void {
        this.container.style.display = 'none';
    }

    destroy(): void {
        this.container.remove();
    }
}
