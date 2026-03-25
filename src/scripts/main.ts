import { Board } from "../components/Board.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
if (!canvas) {
    throw new Error("Canvas element not found");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
    throw new Error("Canvas context not obtained");
}

// Create a 10x10 board with 40px tiles
const board = new Board(10, 10, 40);

// Set some initial terrain
for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
        // Simple procedural noise-like pattern for variety
        const rand = Math.random();
        if (rand < 0.1) {
            board.setTile("terrain", x, y, 0);
        } else if (rand < 0.2) {
            board.setTile("terrain", x, y, 1);
        } else if (rand < 0.35) {
            board.setTile("terrain", x, y, 2);
        } else {
            board.setTile("terrain", x, y, 3);
        }
    }
}

// Add some roads
for (let x = 0; x < 10; x++) {
    board.setTile("terrain", x, 5, 4);
}
for (let y = 0; y < 10; y++) {
    board.setTile("terrain", 5, y, 5);
}

// Add some buildings
board.setTile("building", 2, 2, 2);
board.setTile("building", 7, 7, 3);

// Resize canvas to match board size
canvas.width = board.width * board.tileSize;
canvas.height = board.height * board.tileSize;

// Initial render
board.render(ctx);

console.log("Board initialized and rendered!");