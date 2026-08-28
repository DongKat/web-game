


    
const CursorMode = {
    Hover: 0,
    Attack: 1,
    Move: 2,
    Select: 3,
} as const

type CursorMode = (typeof CursorMode)[keyof typeof CursorMode]


export class Cursor {
    cell: { c: number, r: number } | null
    mode: CursorMode
    locked: boolean

    constructor(cell: { c: number, r: number } | null) {
        this.cell = cell
        this.mode = CursorMode.Hover
        this.locked = false
    }

    
    setMode(mode: CursorMode): void        // swaps sprite texture
    {
        this.mode = mode
    }
    lock(): void {             // freeze position
        this.locked = true
    }

    unlock(): void {           // resume following pointer
        this.locked = false
    }

    on(event: 'hover' | 'select', _callback: () => void): void {
        this.mode = event === 'hover' ? CursorMode.Hover : CursorMode.Select
    }
    
}