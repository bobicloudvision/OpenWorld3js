/**
 * Regeneration Service
 * Handles out-of-combat health and power regeneration (WoW-style)
 */

import { getPlayerById, getActiveHeroForPlayer } from './playerService.js';
import { updatePlayerHeroStats } from './heroService.js';
import { getPlayerCombatState } from './combatService.js';
import { getDb } from './db.js';

// Track player regeneration state
const playerRegenState = new Map(); // playerId -> { lastCombat, lastRegen, isResting }

// Regeneration constants (WoW-inspired)
const REGEN_CONFIG = {
  HEALTH_REGEN_INTERVAL: 2000, // Regen every 2 seconds
  HEALTH_REGEN_PERCENT: 0.05, // 5% of max health per tick
  POWER_REGEN_INTERVAL: 2000, // Regen every 2 seconds
  POWER_REGEN_PERCENT: 0.03, // 3% of max power per tick
  OUT_OF_COMBAT_DELAY: 5000, // 5 seconds after combat to start regen
  RESTING_MULTIPLIER: 2, // 2x regen when resting
  MIN_HEALTH_REGEN: 5, // Minimum HP regen per tick
  MIN_POWER_REGEN: 3 // Minimum power regen per tick
};

/**
 * Mark player as entering combat
 * @param {number} playerId - Player ID
 */
export function enterCombat(playerId) {
  const state = playerRegenState.get(playerId) || {};
  state.lastCombat = Date.now();
  state.isResting = false; // Stop resting when combat starts
  playerRegenState.set(playerId, state);
}

/**
 * Mark player as leaving combat
 * @param {number} playerId - Player ID
 */
export function leaveCombat(playerId) {
  const state = playerRegenState.get(playerId) || {};
  state.lastCombat = Date.now();
  playerRegenState.set(playerId, state);
}

/**
 * Set player resting state
 * @param {number} playerId - Player ID
 * @param {boolean} resting - Is resting
 */
export function setResting(playerId, resting) {
  const state = playerRegenState.get(playerId) || {};
  
  // Can't rest in combat
  const inCombat = isInCombat(playerId);
  if (inCombat && resting) {
    return { success: false, error: 'Cannot rest while in combat' };
  }
  
  state.isResting = resting;
  playerRegenState.set(playerId, state);
  
  return { success: true, resting };
}

/**
 * Check if player is in combat
 * @param {number} playerId - Player ID
 * @returns {boolean}
 */
export function isInCombat(playerId) {
  const combatState = getPlayerCombatState(playerId);
  return combatState !== null;
}

/**
 * Check if player is out of combat long enough for regen
 * @param {number} playerId - Player ID
 * @returns {boolean}
 */
function canRegenerate(playerId) {
  // In combat = no regen
  if (isInCombat(playerId)) {
    return false;
  }
  
  const state = playerRegenState.get(playerId);
  if (!state || !state.lastCombat) {
    return true; // Never been in combat, can regen
  }
  
  const timeSinceCombat = Date.now() - state.lastCombat;
  return timeSinceCombat >= REGEN_CONFIG.OUT_OF_COMBAT_DELAY;
}

/**
 * Process regeneration for a player
 * @param {number} playerId - Player ID
 * @returns {Object|null} { healthGained, powerGained, newHealth, newPower } or null if no regen
 */
export function processPlayerRegeneration(playerId) {
  if (!canRegenerate(playerId)) {
    return null;
  }
  
  const activeHero = getActiveHeroForPlayer(playerId);
  if (!activeHero) {
    return null;
  }
  
  const state = playerRegenState.get(playerId) || {};
  const now = Date.now();
  const lastRegen = state.lastRegen || 0;
  
  // Check if enough time passed for health regen
  if (now - lastRegen < REGEN_CONFIG.HEALTH_REGEN_INTERVAL) {
    return null;
  }
  
  const currentHealth = activeHero.health || activeHero.maxHealth;
  const currentPower = activeHero.power || activeHero.maxPower;
  const maxHealth = activeHero.maxHealth || 100;
  const maxPower = activeHero.maxPower || 100;
  
  // Skip if already at full
  if (currentHealth >= maxHealth && currentPower >= maxPower) {
    return null;
  }
  
  // Calculate regen amounts
  const isResting = state.isResting || false;
  const multiplier = isResting ? REGEN_CONFIG.RESTING_MULTIPLIER : 1;
  
  const healthRegenAmount = Math.max(
    REGEN_CONFIG.MIN_HEALTH_REGEN,
    Math.floor(maxHealth * REGEN_CONFIG.HEALTH_REGEN_PERCENT * multiplier)
  );
  
  const powerRegenAmount = Math.max(
    REGEN_CONFIG.MIN_POWER_REGEN,
    Math.floor(maxPower * REGEN_CONFIG.POWER_REGEN_PERCENT * multiplier)
  );
  
  const newHealth = Math.min(maxHealth, currentHealth + healthRegenAmount);
  const newPower = Math.min(maxPower, currentPower + powerRegenAmount);
  
  const healthGained = newHealth - currentHealth;
  const powerGained = newPower - currentPower;
  
  // Update database
  if (healthGained > 0 || powerGained > 0) {
    updatePlayerHeroStats(playerId, {
      health: newHealth,
      power: newPower
    });
    
    state.lastRegen = now;
    playerRegenState.set(playerId, state);
    
    return {
      healthGained,
      powerGained,
      newHealth,
      newPower,
      maxHealth,
      maxPower,
      isResting
    };
  }
  
  return null;
}

/**
 * Get player regen state
 * @param {number} playerId - Player ID
 * @returns {Object}
 */
export function getRegenState(playerId) {
  const state = playerRegenState.get(playerId) || {};
  const inCombat = isInCombat(playerId);
  const canRegen = canRegenerate(playerId);
  
  return {
    inCombat,
    canRegenerate: canRegen,
    isResting: state.isResting || false,
    lastCombat: state.lastCombat || null,
    lastRegen: state.lastRegen || null
  };
}

/**
 * Clear player regen state (on disconnect)
 * @param {number} playerId - Player ID
 */
export function clearRegenState(playerId) {
  playerRegenState.delete(playerId);
}

/**
 * Process regeneration for ALL player heroes in the database
 * This runs globally for all heroes, not just online players (WoW-style)
 * @returns {Object} { processed, updated, totalHealthGained, totalPowerGained, updatedPlayers }
 */
export function processAllHeroesRegeneration(prioritizedPlayerIds = []) {
  const db = getDb();
  
  try {
    // First, check ALL heroes in database for debugging
    const allHeroesStmt = db.prepare(`
      SELECT 
        id,
        player_id,
        COALESCE(health, max_health, 100) as health,
        COALESCE(max_health, 100) as max_health,
        COALESCE(power, max_power, 100) as power,
        COALESCE(max_power, 100) as max_power
      FROM player_heroes
    `);
    const allHeroes = allHeroesStmt.all();
    console.log(`[regen-service] Total heroes in DB: ${allHeroes.length}`);
    if (allHeroes.length > 0) {
      console.log(`[regen-service] All heroes:`, allHeroes.map(h => `Player${h.player_id}(HP:${h.health}/${h.max_health}, Power:${h.power}/${h.max_power})`).join(', '));
    }
    
    // Get all player heroes that are not at full health or power
    // Handle NULL max values by using defaults (100 for both)
    const stmt = db.prepare(`
      SELECT 
        id,
        player_id,
        health,
        COALESCE(max_health, 100) as max_health,
        power,
        COALESCE(max_power, 100) as max_power
      FROM player_heroes
      WHERE health < COALESCE(max_health, 100) 
         OR power < COALESCE(max_power, 100)
         OR health IS NULL
         OR power IS NULL
    `);
    
    const heroes = stmt.all();
    
    console.log(`[regen-service] Found ${heroes.length} heroes needing regeneration (health < max OR power < max)`);
    if (heroes.length > 0) {
      console.log(`[regen-service] Heroes needing regen:`, heroes.map(h => `Player${h.player_id}(${h.health}/${h.max_health} HP, ${h.power}/${h.max_power} Power)`).join(', '));
    }
    
    if (heroes.length === 0) {
      return { processed: 0, updated: 0, totalHealthGained: 0, totalPowerGained: 0, updatedPlayers: [] };
    }
    
    let updated = 0;
    let totalHealthGained = 0;
    let totalPowerGained = 0;
    const updatedPlayers = []; // Track which players had regeneration
    
    const updateStmt = db.prepare(`
      UPDATE player_heroes
      SET health = ?, power = ?
      WHERE id = ?
    `);
    
    // If prioritization provided, process online players first
    const prioritizedSet = new Set(Array.isArray(prioritizedPlayerIds) ? prioritizedPlayerIds : []);
    const prioritizedHeroes = heroes.filter(h => prioritizedSet.has(h.player_id));
    const remainingHeroes = heroes.filter(h => !prioritizedSet.has(h.player_id));
    
    console.log(`[regen-service] Prioritizing ${prioritizedHeroes.length} online heroes, ${remainingHeroes.length} offline heroes`);

    const processHero = (hero) => {
      // Check if this player/hero is in active combat
      const inCombat = isInCombat(hero.player_id);
      if (inCombat) {
        console.log(`[regen-service] Skipping Player${hero.player_id} - in combat`);
        return; // Skip heroes in combat
      }
      
      const maxHealth = hero.max_health || 100;
      const maxPower = hero.max_power || 100;
      // If health/power is NULL, set to max (fresh hero)
      const currentHealth = hero.health !== null ? hero.health : maxHealth;
      const currentPower = hero.power !== null ? hero.power : maxPower;
      
      // Skip if already at full
      if (currentHealth >= maxHealth && currentPower >= maxPower) {
        return;
      }
      
      // Check if player is resting (for online players)
      const state = playerRegenState.get(hero.player_id) || {};
      const isResting = state.isResting || false;
      const multiplier = isResting ? REGEN_CONFIG.RESTING_MULTIPLIER : 1;
      
      // Calculate regen amounts
      const healthRegenAmount = Math.max(
        REGEN_CONFIG.MIN_HEALTH_REGEN,
        Math.floor(maxHealth * REGEN_CONFIG.HEALTH_REGEN_PERCENT * multiplier)
      );
      
      const powerRegenAmount = Math.max(
        REGEN_CONFIG.MIN_POWER_REGEN,
        Math.floor(maxPower * REGEN_CONFIG.POWER_REGEN_PERCENT * multiplier)
      );
      
      const newHealth = Math.min(maxHealth, currentHealth + healthRegenAmount);
      const newPower = Math.min(maxPower, currentPower + powerRegenAmount);
      
      const healthGained = newHealth - currentHealth;
      const powerGained = newPower - currentPower;
      
      // Update database if there's any change
      if (healthGained > 0 || powerGained > 0) {
        updateStmt.run(newHealth, newPower, hero.id);
        updated++;
        totalHealthGained += healthGained;
        totalPowerGained += powerGained;
        
        console.log(`[regen-service] ✅ Player${hero.player_id}: +${healthGained} HP (${currentHealth}->${newHealth}/${maxHealth}), +${powerGained} Power (${currentPower}->${newPower}/${maxPower})${isResting ? ' [RESTING]' : ''}`);
        
        // Track this player's update
        updatedPlayers.push({
          playerId: hero.player_id,
          heroId: hero.id,
          healthGained,
          powerGained,
          newHealth,
          newPower,
          maxHealth,
          maxPower,
          isResting
        });
      }
    };

    // Process prioritized heroes first, then the rest
    prioritizedHeroes.forEach(processHero);
    remainingHeroes.forEach(processHero);
    
    return {
      processed: heroes.length,
      updated,
      totalHealthGained,
      totalPowerGained,
      updatedPlayers
    };
  } catch (error) {
    console.error('[regeneration] Error processing all heroes:', error);
    return { processed: 0, updated: 0, totalHealthGained: 0, totalPowerGained: 0, updatedPlayers: [] };
  }
}

