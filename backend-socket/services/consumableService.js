/**
 * Consumable Service
 * Handles food, potions, and other consumable items (WoW-style)
 */

import { getActiveHeroForPlayer } from './playerService.js';
import { updatePlayerHeroStats } from './heroService.js';
import { isInCombat } from './regenerationService.js';

// Consumable definitions (can be moved to database later)
const CONSUMABLES = {
  'bread': {
    id: 'bread',
    name: 'Bread',
    type: 'food',
    healthRestore: 30,
    powerRestore: 0,
    castTime: 3000, // 3 seconds to eat
    cooldown: 1000,
    requiresOutOfCombat: true,
    description: 'Restores 30 health over 3 seconds. Must sit to eat.'
  },
  'water': {
    id: 'water',
    name: 'Water',
    type: 'drink',
    healthRestore: 0,
    powerRestore: 40,
    castTime: 3000, // 3 seconds to drink
    cooldown: 1000,
    requiresOutOfCombat: true,
    description: 'Restores 40 power over 3 seconds. Must sit to drink.'
  },
  'meal': {
    id: 'meal',
    name: 'Hearty Meal',
    type: 'food',
    healthRestore: 50,
    powerRestore: 30,
    castTime: 5000, // 5 seconds
    cooldown: 1000,
    requiresOutOfCombat: true,
    description: 'Restores 50 health and 30 power over 5 seconds.'
  },
  'health_potion': {
    id: 'health_potion',
    name: 'Health Potion',
    type: 'potion',
    healthRestore: 50,
    powerRestore: 0,
    castTime: 0, // Instant
    cooldown: 30000, // 30 second cooldown
    requiresOutOfCombat: false, // Can use in combat!
    description: 'Instantly restores 50 health. Can be used in combat.'
  },
  'mana_potion': {
    id: 'mana_potion',
    name: 'Mana Potion',
    type: 'potion',
    healthRestore: 0,
    powerRestore: 60,
    castTime: 0, // Instant
    cooldown: 30000, // 30 second cooldown
    requiresOutOfCombat: false,
    description: 'Instantly restores 60 power. Can be used in combat.'
  },
  'bandage': {
    id: 'bandage',
    name: 'Bandage',
    type: 'medical',
    healthRestore: 40,
    powerRestore: 0,
    castTime: 4000, // 4 seconds to apply
    cooldown: 60000, // 1 minute cooldown
    requiresOutOfCombat: false, // Can use in combat, but channeled
    interruptible: true, // Taking damage interrupts
    description: 'Restores 40 health over 4 seconds. Interrupted by damage.'
  }
};

// Track player consumable state
const playerConsumableState = new Map(); // playerId -> { lastUsed: {consumableId: timestamp}, channeling: consumableId }

/**
 * Get all available consumables
 * @returns {Array}
 */
export function getAllConsumables() {
  return Object.values(CONSUMABLES);
}

/**
 * Get consumable by ID
 * @param {string} consumableId - Consumable ID
 * @returns {Object|null}
 */
export function getConsumable(consumableId) {
  return CONSUMABLES[consumableId] || null;
}

/**
 * Use a consumable
 * @param {number} playerId - Player ID
 * @param {string} consumableId - Consumable ID
 * @returns {Object} { success, error?, castTime?, healthRestored?, powerRestored? }
 */
export function useConsumable(playerId, consumableId) {
  const consumable = getConsumable(consumableId);
  if (!consumable) {
    return { success: false, error: 'Consumable not found' };
  }
  
  // Check if in combat
  const inCombat = isInCombat(playerId);
  if (inCombat && consumable.requiresOutOfCombat) {
    return { success: false, error: `Cannot use ${consumable.name} while in combat` };
  }
  
  // Check cooldown
  const state = playerConsumableState.get(playerId) || { lastUsed: {}, channeling: null };
  const lastUsed = state.lastUsed[consumableId] || 0;
  const now = Date.now();
  const timeSinceUse = now - lastUsed;
  
  if (timeSinceUse < consumable.cooldown) {
    const remaining = Math.ceil((consumable.cooldown - timeSinceUse) / 1000);
    return { success: false, error: `${consumable.name} on cooldown (${remaining}s remaining)` };
  }
  
  // Check if already channeling
  if (state.channeling) {
    return { success: false, error: 'Already using another consumable' };
  }
  
  // Get player's hero
  const activeHero = getActiveHeroForPlayer(playerId);
  if (!activeHero) {
    return { success: false, error: 'No active hero' };
  }
  
  const currentHealth = activeHero.health || 0;
  const currentPower = activeHero.power || 0;
  const maxHealth = activeHero.maxHealth || 100;
  const maxPower = activeHero.maxPower || 100;
  
  // Check if already at full
  if (consumable.healthRestore > 0 && currentHealth >= maxHealth) {
    return { success: false, error: 'Already at full health' };
  }
  if (consumable.powerRestore > 0 && currentPower >= maxPower) {
    return { success: false, error: 'Already at full power' };
  }
  
  // Instant consumables
  if (consumable.castTime === 0) {
    const newHealth = Math.min(maxHealth, currentHealth + consumable.healthRestore);
    const newPower = Math.min(maxPower, currentPower + consumable.powerRestore);
    
    const result = updatePlayerHeroStats(playerId, {
      health: newHealth,
      power: newPower
    });
    
    if (result.success) {
      // Update cooldown
      state.lastUsed[consumableId] = now;
      playerConsumableState.set(playerId, state);
      
      return {
        success: true,
        consumableId,
        consumableName: consumable.name,
        instant: true,
        healthRestored: newHealth - currentHealth,
        powerRestored: newPower - currentPower,
        newHealth,
        newPower,
        maxHealth,
        maxPower
      };
    }
    
    return { success: false, error: 'Failed to update stats' };
  }
  
  // Channeled consumables (food, drinks, bandages)
  state.channeling = consumableId;
  state.channelingStarted = now;
  playerConsumableState.set(playerId, state);
  
  return {
    success: true,
    consumableId,
    consumableName: consumable.name,
    channeling: true,
    castTime: consumable.castTime,
    healthToRestore: consumable.healthRestore,
    powerToRestore: consumable.powerRestore,
    interruptible: consumable.interruptible || false
  };
}

/**
 * Complete channeled consumable
 * @param {number} playerId - Player ID
 * @returns {Object}
 */
export function completeChanneling(playerId) {
  const state = playerConsumableState.get(playerId);
  if (!state || !state.channeling) {
    return { success: false, error: 'Not channeling any consumable' };
  }
  
  const consumable = getConsumable(state.channeling);
  if (!consumable) {
    cancelChanneling(playerId);
    return { success: false, error: 'Consumable not found' };
  }
  
  // Get player's hero
  const activeHero = getActiveHeroForPlayer(playerId);
  if (!activeHero) {
    cancelChanneling(playerId);
    return { success: false, error: 'No active hero' };
  }
  
  const currentHealth = activeHero.health || 0;
  const currentPower = activeHero.power || 0;
  const maxHealth = activeHero.maxHealth || 100;
  const maxPower = activeHero.maxPower || 100;
  
  const newHealth = Math.min(maxHealth, currentHealth + consumable.healthRestore);
  const newPower = Math.min(maxPower, currentPower + consumable.powerRestore);
  
  const result = updatePlayerHeroStats(playerId, {
    health: newHealth,
    power: newPower
  });
  
  if (result.success) {
    // Update cooldown
    state.lastUsed[state.channeling] = Date.now();
    state.channeling = null;
    state.channelingStarted = null;
    playerConsumableState.set(playerId, state);
    
    return {
      success: true,
      consumableId: consumable.id,
      consumableName: consumable.name,
      healthRestored: newHealth - currentHealth,
      powerRestored: newPower - currentPower,
      newHealth,
      newPower,
      maxHealth,
      maxPower
    };
  }
  
  cancelChanneling(playerId);
  return { success: false, error: 'Failed to update stats' };
}

/**
 * Cancel/interrupt channeled consumable
 * @param {number} playerId - Player ID
 * @returns {Object}
 */
export function cancelChanneling(playerId) {
  const state = playerConsumableState.get(playerId);
  if (!state || !state.channeling) {
    return { success: false, error: 'Not channeling any consumable' };
  }
  
  const consumableId = state.channeling;
  state.channeling = null;
  state.channelingStarted = null;
  playerConsumableState.set(playerId, state);
  
  return {
    success: true,
    consumableId,
    interrupted: true
  };
}

/**
 * Get player consumable state
 * @param {number} playerId - Player ID
 * @returns {Object}
 */
export function getConsumableState(playerId) {
  const state = playerConsumableState.get(playerId) || { lastUsed: {}, channeling: null };
  const now = Date.now();
  
  const cooldowns = {};
  Object.keys(CONSUMABLES).forEach(consumableId => {
    const lastUsed = state.lastUsed[consumableId] || 0;
    const cooldown = CONSUMABLES[consumableId].cooldown;
    const remaining = Math.max(0, cooldown - (now - lastUsed));
    cooldowns[consumableId] = remaining;
  });
  
  return {
    channeling: state.channeling,
    channelingStarted: state.channelingStarted,
    cooldowns
  };
}

/**
 * Clear player consumable state (on disconnect)
 * @param {number} playerId - Player ID
 */
export function clearConsumableState(playerId) {
  playerConsumableState.delete(playerId);
}

