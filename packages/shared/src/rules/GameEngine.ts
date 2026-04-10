import type { GameState, UnitState, Point, TerrainType } from '../types/index.js';
import type { Command } from '../types/commands.js';
import type { GameEvent } from '../types/events.js';
import type { IGameRuleSet } from './IGameRuleSet.js';
import { Pathfinder } from './Pathfinder.js';

export interface CommandResult {
  newState: GameState;
  events: GameEvent[];
}

export class GameEngine {
  static applyCommand(
    state: GameState,
    command: Command,
    rules: IGameRuleSet,
  ): CommandResult {
    switch (command.type) {
      case 'move':
        return GameEngine.applyMove(state, command, rules);
      case 'attack':
        return GameEngine.applyAttack(state, command, rules);
      case 'wait':
        return GameEngine.applyWait(state, command);
      case 'capture':
        return GameEngine.applyCapture(state, command, rules);
      case 'build':
        return GameEngine.applyBuild(state, command, rules);
      case 'endTurn':
        return GameEngine.applyEndTurn(state, rules);
      case 'load':
        return GameEngine.applyLoad(state, command);
      case 'unload':
        return GameEngine.applyUnload(state, command);
      case 'join':
        return GameEngine.applyJoin(state, command);
      case 'coPower':
        return { newState: state, events: [] }; // TODO: implement CO powers
    }
  }

  static validateCommand(
    state: GameState,
    command: Command,
    playerId: string,
    rules: IGameRuleSet,
  ): string | null {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return 'Not your turn';
    }
    if (state.phase !== 'main') {
      return 'Cannot act during this phase';
    }
    if (state.winner) {
      return 'Game is over';
    }

    switch (command.type) {
      case 'move': {
        const unit = state.units.find(u => u.id === command.unitId);
        if (!unit) return 'Unit not found';
        if (unit.owner !== playerId) return 'Not your unit';
        if (unit.hasMoved) return 'Unit already moved';
        if (command.path.length < 2) return 'Path too short';
        return null;
      }
      case 'attack': {
        const attacker = state.units.find(u => u.id === command.attackerId);
        const defender = state.units.find(u => u.id === command.defenderId);
        if (!attacker) return 'Attacker not found';
        if (!defender) return 'Defender not found';
        if (attacker.owner !== playerId) return 'Not your unit';
        if (attacker.hasActed) return 'Unit already acted';
        if (!rules.canAttack(attacker.type, defender.type)) return 'Cannot attack this unit type';
        return null;
      }
      case 'wait': {
        const unit = state.units.find(u => u.id === command.unitId);
        if (!unit) return 'Unit not found';
        if (unit.owner !== playerId) return 'Not your unit';
        if (unit.hasActed) return 'Unit already acted';
        return null;
      }
      case 'capture': {
        const unit = state.units.find(u => u.id === command.unitId);
        if (!unit) return 'Unit not found';
        if (unit.owner !== playerId) return 'Not your unit';
        const unitStats = rules.getUnitStats(unit.type);
        if (!unitStats.canCapture) return 'This unit cannot capture';
        const building = state.buildings.find(b => b.id === command.buildingId);
        if (!building) return 'Building not found';
        if (building.owner === playerId) return 'Already own this building';
        return null;
      }
      case 'build': {
        const building = state.buildings.find(b => b.id === command.buildingId);
        if (!building) return 'Building not found';
        if (building.owner !== playerId) return 'Not your building';
        const buildable = rules.getBuildableUnits(building.type);
        if (!buildable.includes(command.unitType)) return 'Cannot build this unit here';
        const cost = rules.getUnitCost(command.unitType);
        if (currentPlayer.funds < cost) return 'Insufficient funds';
        const occupied = state.units.some(u =>
          u.position.col === building.position.col && u.position.row === building.position.row
        );
        if (occupied) return 'Building tile is occupied';
        return null;
      }
      case 'endTurn':
        return null;
      case 'load': {
        const unit = state.units.find(u => u.id === command.unitId);
        const transport = state.units.find(u => u.id === command.transportId);
        if (!unit || !transport) return 'Unit not found';
        if (unit.owner !== playerId) return 'Not your unit';
        return null;
      }
      case 'unload': {
        const transport = state.units.find(u => u.id === command.transportId);
        if (!transport) return 'Transport not found';
        if (transport.owner !== playerId) return 'Not your unit';
        if (!transport.loaded.includes(command.unitId)) return 'Unit not loaded';
        return null;
      }
      case 'join': {
        const unit = state.units.find(u => u.id === command.unitId);
        const target = state.units.find(u => u.id === command.targetId);
        if (!unit || !target) return 'Unit not found';
        if (unit.owner !== playerId || target.owner !== playerId) return 'Not your units';
        if (unit.type !== target.type) return 'Units must be same type';
        return null;
      }
      case 'coPower':
        return null; // TODO
    }
  }

  // ── Command Handlers ──

  private static applyMove(
    state: GameState,
    command: { type: 'move'; unitId: string; path: Point[] },
    _rules: IGameRuleSet,
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const unit = newState.units.find(u => u.id === command.unitId)!;
    const dest = command.path[command.path.length - 1]!;

    unit.position = { col: dest.col, row: dest.row };
    unit.hasMoved = true;
    unit.fuel -= command.path.length - 1;

    return {
      newState,
      events: [{ type: 'unitMoved', unitId: command.unitId, path: command.path }],
    };
  }

  private static applyAttack(
    state: GameState,
    command: { type: 'attack'; attackerId: string; defenderId: string },
    rules: IGameRuleSet,
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const attacker = newState.units.find(u => u.id === command.attackerId)!;
    const defender = newState.units.find(u => u.id === command.defenderId)!;
    const events: GameEvent[] = [];

    const atkTerrain = GameEngine.getTerrainAt(newState, attacker.position);
    const defTerrain = GameEngine.getTerrainAt(newState, defender.position);

    // Primary attack
    const damage = rules.calculateDamage(attacker, defender, atkTerrain, defTerrain, false);
    defender.hp -= damage;
    attacker.ammo = Math.max(0, attacker.ammo - 1);

    events.push({
      type: 'unitDamaged',
      unitId: defender.id,
      damage,
      newHp: Math.max(0, defender.hp),
    });

    if (defender.hp <= 0) {
      newState.units = newState.units.filter(u => u.id !== defender.id);
      events.push({ type: 'unitDestroyed', unitId: defender.id });
    } else {
      // Counter-attack (only for direct combat and if defender is adjacent)
      const dist = Math.abs(attacker.position.col - defender.position.col) +
        Math.abs(attacker.position.row - defender.position.row);
      const atkRange = rules.getAttackRange(attacker.type);
      const defRange = rules.getAttackRange(defender.type);

      if (dist === 1 && defRange.min === 1 && rules.canAttack(defender.type, attacker.type)) {
        const counterDamage = rules.calculateDamage(defender, attacker, defTerrain, atkTerrain, true);
        attacker.hp -= counterDamage;
        defender.ammo = Math.max(0, defender.ammo - 1);

        events.push({
          type: 'unitDamaged',
          unitId: attacker.id,
          damage: counterDamage,
          newHp: Math.max(0, attacker.hp),
        });

        if (attacker.hp <= 0) {
          newState.units = newState.units.filter(u => u.id !== attacker.id);
          events.push({ type: 'unitDestroyed', unitId: attacker.id });
        }
      }
    }

    // Mark attacker as acted
    const survivingAttacker = newState.units.find(u => u.id === command.attackerId);
    if (survivingAttacker) {
      survivingAttacker.hasActed = true;
    }

    // Check victory
    const victoryEvent = GameEngine.checkVictory(newState);
    if (victoryEvent) events.push(victoryEvent);

    return { newState, events };
  }

  private static applyWait(
    state: GameState,
    command: { type: 'wait'; unitId: string },
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const unit = newState.units.find(u => u.id === command.unitId)!;
    unit.hasActed = true;
    unit.captureProgress = 0; // reset capture if waiting elsewhere

    return {
      newState,
      events: [{ type: 'unitWaited', unitId: command.unitId }],
    };
  }

  private static applyCapture(
    state: GameState,
    command: { type: 'capture'; unitId: string; buildingId: string },
    _rules: IGameRuleSet,
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const unit = newState.units.find(u => u.id === command.unitId)!;
    const building = newState.buildings.find(b => b.id === command.buildingId)!;
    const events: GameEvent[] = [];

    // Capture points reduced by unit HP (displayed as 1-10)
    const captureValue = Math.ceil(unit.hp / 10);
    building.capturePoints -= captureValue;

    if (building.capturePoints <= 0) {
      building.capturePoints = 20;
      building.owner = unit.owner;
      events.push({
        type: 'buildingCaptured',
        buildingId: building.id,
        newOwner: unit.owner,
      });

      // Check HQ capture victory
      if (building.type === 'hq') {
        const victoryEvent = GameEngine.checkVictory(newState);
        if (victoryEvent) events.push(victoryEvent);
      }
    } else {
      unit.captureProgress = 20 - building.capturePoints;
      events.push({
        type: 'captureProgress',
        buildingId: building.id,
        unitId: unit.id,
        remainingPoints: building.capturePoints,
      });
    }

    unit.hasActed = true;

    return { newState, events };
  }

  private static applyBuild(
    state: GameState,
    command: { type: 'build'; buildingId: string; unitType: string },
    rules: IGameRuleSet,
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const building = newState.buildings.find(b => b.id === command.buildingId)!;
    const player = newState.players.find(p => p.id === building.owner)!;
    const cost = rules.getUnitCost(command.unitType as any);
    const events: GameEvent[] = [];

    player.funds -= cost;
    events.push({ type: 'fundsChanged', playerId: player.id, newFunds: player.funds });

    const unitStats = rules.getUnitStats(command.unitType as any);
    const newUnit: UnitState = {
      id: `unit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: command.unitType as any,
      owner: player.id,
      hp: 100,
      ammo: unitStats.maxAmmo,
      fuel: unitStats.maxFuel,
      position: { col: building.position.col, row: building.position.row },
      hasMoved: true,
      hasActed: true,
      isHidden: false,
      captureProgress: 0,
      loaded: [],
    };

    newState.units.push(newUnit);
    events.push({ type: 'unitCreated', unit: newUnit });

    return { newState, events };
  }

  private static applyEndTurn(
    state: GameState,
    rules: IGameRuleSet,
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const events: GameEvent[] = [];

    // Reset all current player's units
    for (const unit of newState.units) {
      if (unit.owner === newState.players[newState.currentPlayerIndex]!.id) {
        unit.hasMoved = false;
        unit.hasActed = false;
      }
    }

    // Advance to next non-eliminated player
    let nextIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
    while (newState.players[nextIndex]!.eliminated && nextIndex !== newState.currentPlayerIndex) {
      nextIndex = (nextIndex + 1) % newState.players.length;
    }

    if (nextIndex <= newState.currentPlayerIndex) {
      newState.turn++;
    }
    newState.currentPlayerIndex = nextIndex;
    const nextPlayer = newState.players[nextIndex]!;

    // Income phase
    const ownedProperties = newState.buildings.filter(b => b.owner === nextPlayer.id);
    const income = ownedProperties.length * rules.getIncomePerProperty();
    if (income > 0) {
      nextPlayer.funds += income;
      events.push({
        type: 'income',
        playerId: nextPlayer.id,
        amount: income,
        newFunds: nextPlayer.funds,
      });
    }

    // Repair & resupply units on owned buildings
    for (const unit of newState.units) {
      if (unit.owner !== nextPlayer.id) continue;
      const building = ownedProperties.find(
        b => b.position.col === unit.position.col && b.position.row === unit.position.row
      );
      if (building) {
        const terrainStats = rules.getTerrainStats(building.type);
        if (terrainStats.canRepair.includes(unit.type)) {
          const repairAmount = rules.getRepairAmount();
          const oldHp = unit.hp;
          unit.hp = Math.min(100, unit.hp + repairAmount);
          // Repair costs funds
          const repairCost = Math.ceil((unit.hp - oldHp) / 10) * rules.getUnitCost(unit.type) / 10;
          nextPlayer.funds = Math.max(0, nextPlayer.funds - repairCost);
        }
        // Resupply
        const unitStats = rules.getUnitStats(unit.type);
        unit.fuel = unitStats.maxFuel;
        unit.ammo = unitStats.maxAmmo;
      }

      // Daily fuel consumption
      unit.fuel -= rules.getFuelCostPerTurn(unit.type);
      if (unit.fuel <= 0) {
        // Air/naval units crash/sink
        const unitStats = rules.getUnitStats(unit.type);
        if (unitStats.movementClass === 'air' || unitStats.movementClass === 'ship') {
          newState.units = newState.units.filter(u => u.id !== unit.id);
          events.push({ type: 'unitDestroyed', unitId: unit.id });
        }
      }
    }

    events.push({
      type: 'turnChanged',
      turn: newState.turn,
      currentPlayerIndex: newState.currentPlayerIndex,
      playerId: nextPlayer.id,
    });

    // Check turn limit
    if (newState.config.turnLimit && newState.turn > newState.config.turnLimit) {
      events.push({
        type: 'gameOver',
        winnerId: '', // draw
        reason: 'turnLimit',
      });
    }

    return { newState, events };
  }

  private static applyLoad(
    state: GameState,
    command: { type: 'load'; unitId: string; transportId: string },
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const unit = newState.units.find(u => u.id === command.unitId)!;
    const transport = newState.units.find(u => u.id === command.transportId)!;

    transport.loaded.push(unit.id);
    // Remove unit from map (it's inside the transport now)
    newState.units = newState.units.filter(u => u.id !== unit.id);

    return {
      newState,
      events: [{ type: 'unitLoaded', unitId: unit.id, transportId: transport.id }],
    };
  }

  private static applyUnload(
    state: GameState,
    command: { type: 'unload'; transportId: string; unitId: string; position: Point },
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const transport = newState.units.find(u => u.id === command.transportId)!;

    transport.loaded = transport.loaded.filter(id => id !== command.unitId);

    // For unloading, we need to re-create the unit at the new position
    // In a full implementation, we'd store the unit data somewhere
    // For now, this is a simplified version
    return {
      newState,
      events: [{
        type: 'unitUnloaded',
        unitId: command.unitId,
        transportId: transport.id,
        position: command.position,
      }],
    };
  }

  private static applyJoin(
    state: GameState,
    command: { type: 'join'; unitId: string; targetId: string },
  ): CommandResult {
    const newState = GameEngine.cloneState(state);
    const unit = newState.units.find(u => u.id === command.unitId)!;
    const target = newState.units.find(u => u.id === command.targetId)!;

    target.hp = Math.min(100, target.hp + unit.hp);
    target.ammo = Math.min(target.ammo + unit.ammo, 99);
    newState.units = newState.units.filter(u => u.id !== unit.id);

    return {
      newState,
      events: [{ type: 'unitJoined', unitId: unit.id, targetId: target.id, newHp: target.hp }],
    };
  }

  // ── Helpers ──

  static cloneState(state: GameState): GameState {
    return JSON.parse(JSON.stringify(state)) as GameState;
  }

  private static getTerrainAt(state: GameState, pos: Point): TerrainType {
    // Check buildings first (they overlay terrain)
    const building = state.buildings.find(
      b => b.position.col === pos.col && b.position.row === pos.row
    );
    if (building) return building.type;
    return 'plain'; // TODO: read from actual terrain grid once MapDefinition is part of state
  }

  private static checkVictory(state: GameState): GameOverEvent | null {
    for (const player of state.players) {
      if (player.eliminated) continue;

      // Check if player has any units left
      const hasUnits = state.units.some(u => u.owner === player.id);
      // Check if player has HQ
      const hasHQ = state.buildings.some(
        b => b.type === 'hq' && b.owner === player.id
      );

      if (!hasUnits && !hasHQ) {
        player.eliminated = true;
      }
    }

    const activePlayers = state.players.filter(p => !p.eliminated);
    if (activePlayers.length === 1) {
      state.winner = activePlayers[0]!.id;
      return {
        type: 'gameOver',
        winnerId: activePlayers[0]!.id,
        reason: 'allUnitsDestroyed',
      };
    }

    return null;
  }
}

type GameOverEvent = {
  type: 'gameOver';
  winnerId: string;
  reason: 'hqCaptured' | 'allUnitsDestroyed' | 'surrender' | 'turnLimit';
};
