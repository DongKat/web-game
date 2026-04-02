

type KeyState = {
    down: boolean;
    pressed: boolean;
    released: boolean;
};

type MouseState = {
    x: number;
    y: number;
    down: boolean;
    pressed: boolean;
    released: boolean;
};
export class InputManager {
    private keys: Record<string, KeyState> = {};
    private mouse: MouseState = {
        x: 0,
        y: 0,
        down: false,
        pressed: false,
        released: false,
    };
    private bindings: Record<string, string[]> = {};

    // private bindings: Record<string, string[]> = {};
    private static instance: InputManager;

    private constructor() { }

    public static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    public init(
        window: Window,
        canvas: HTMLCanvasElement
    ): void {
        // Keyboard events
        window.addEventListener('keydown', (e) => { this.handleKeyDown(e); });
        window.addEventListener('keyup', (e) => { this.handleKeyUp(e); });

        // Mouse events
        canvas.addEventListener('mousemove', (e) => { this.handleMouseMove(e); });
        canvas.addEventListener('mousedown', (e) => { this.handleMouseDown(e); });
        canvas.addEventListener('mouseup', (e) => { this.handleMouseUp(e); });
    }

    bindAction(action: string, keys: string[]): void {
        this.bindings[action] = keys;
    }

    // Keyboard event handlers
    private handleKeyDown(event: KeyboardEvent): void {
        const code = event.code;
        if (!this.keys[code]) {
            this.keys[code] = {
                down: false,
                pressed: false,
                released: false,
            };
        }
        this.keys[code].down = !this.keys[code].down;
        this.keys[code].pressed = true;
    }

    private handleKeyUp(event: KeyboardEvent): void {
        const code = event.code;
        if (!this.keys[code]) {
            return;
        }
        this.keys[code].down = false;
        this.keys[code].released = true;
    }

    // Mouse event handlers
    private updateMousePosition(event: MouseEvent): void {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }

    private handleMouseMove(event: MouseEvent): void {
        // Handle mouse move events
        this.updateMousePosition(event);
    }

    private handleMouseDown(event: MouseEvent): void {
        this.mouse.down = true;
        this.mouse.pressed = true;
        this.updateMousePosition(event);
    }

    private handleMouseUp(event: MouseEvent): void {
        this.mouse.down = false;
        this.mouse.released = true;
        this.updateMousePosition(event);
    }

    // Keyboard state queries
    public isKeyPressed(key: string): boolean {
        return this.keys[key]?.pressed || false;
    }
    public isKeyDown(key: string): boolean {
        return this.keys[key]?.down || false;
    }
    public isKeyReleased(key: string): boolean {
        return this.keys[key]?.released || false;
    }

    // Keyboard action queries
    public isActionDown(action: string) {
        return this.bindings[action]?.some((k) => this.isKeyDown(k)) ?? false;
    }

    public isActionPressed(action: string) {
        return this.bindings[action]?.some((k) => this.isKeyPressed(k)) ?? false;
    }

    public isActionReleased(action: string) {
        return this.bindings[action]?.some((k) => this.isKeyReleased(k)) ?? false;
    }

    // Mouse queries
    public getMousePosition(): { x: number; y: number } {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    public isMouseDown(): boolean {
        return this.mouse.down;
    }
    public isMousePressed(): boolean {
        return this.mouse.pressed;
    }
    public isMouseReleased(): boolean {
        return this.mouse.released;
    }

    // Call this at the end of each frame to reset pressed/released states
    public update(): void {
        for (const key in this.keys) {
            this.keys[key].pressed = false;
            this.keys[key].released = false;
        }
        this.mouse.pressed = false;
        this.mouse.released = false;
    }
}