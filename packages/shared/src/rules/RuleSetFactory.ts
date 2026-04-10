import type { GameRuleSetId } from '../types/index.js';
import type { IGameRuleSet } from './IGameRuleSet.js';
import { AW1RuleSet } from '../data/aw1/index.js';

const ruleSets: Record<GameRuleSetId, () => IGameRuleSet> = {
  aw1: () => new AW1RuleSet(),
  aw2: () => new AW1RuleSet(),   // TODO: AW2 specific rules
  awds: () => new AW1RuleSet(),  // TODO: AWDS specific rules
  awdor: () => new AW1RuleSet(), // TODO: AW:DoR specific rules
};

export function createRuleSet(id: GameRuleSetId): IGameRuleSet {
  const factory = ruleSets[id];
  if (!factory) throw new Error(`Unknown rule set: ${id}`);
  return factory();
}
