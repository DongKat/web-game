/src
  /core                # Pure game logic (no UI, no rendering)
    Game.ts
    TurnManager.ts
    Player.ts
    Types.ts

  /map                 # Grid + terrain
    Grid.ts
    Tile.ts
    MapLoader.ts

  /units               # Unit definitions and behavior
    Unit.ts
    UnitTypes.ts
    UnitFactory.ts

  /systems             # Game mechanics
    MovementSystem.ts
    CombatSystem.ts
    CaptureSystem.ts
    VisibilitySystem.ts

  /state               # Game state container
    GameState.ts
    StateSerializer.ts

  /input               # Player input handling
    InputHandler.ts
    Command.ts

  /ai                  # Optional AI logic
    SimpleAI.ts

  /render              # Rendering layer (canvas, DOM, etc.)
    Renderer.ts
    SpriteManager.ts
    Camera.ts

  /ui                  # UI elements (menus, HUD)
    HUD.ts
    Menu.ts

  /assets              # Static data (JSON configs)
    units.json
    maps.json

  /utils               # Helpers
    MathUtils.ts
    Pathfinding.ts

  index.ts             # Entry point