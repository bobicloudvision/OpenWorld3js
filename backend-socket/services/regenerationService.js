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

// Regeneration constants (Time-based, not tick-based)
// Full health recovery = 5 minutes = 300 seconds
// Health per second = maxHealth / 300 seconds
// Check every 5 seconds to apply regen
const REGEN_CONFIG = {
  HEALTH_REGEN_INTERVAL: 5000, // Check every 5 seconds
  HEALTH_REGEN_TIME: 300, // Seconds to full health (5 minutes)
  POWER_REGEN_INTERVAL: 5000, // Check every 5 seconds  
  POWER_REGEN_TIME: 300, // Seconds to full power (5 minutes)
  OUT_OF_COMBAT_DELAY: 10000, // 10 seconds after combat to start regen
  RESTING_MULTIPLIER: 2, // 2x regen when resting (2.5 min when resting)
  MIN_HEALTH_REGEN: 1, // Minimum HP regen per tick
  MIN_POWER_REGEN: 1 // Minimum power regen per tick
};

/**
 * Mark player as entering combat
 * @param {number} playerId - Player ID
 */
export function enterCombat(playerId) {
  const db = getDb();
  const now = new Date().toISOString();
  
  try {
    db.prepare(`
      UPDATE player_heroes
      SET last_combat_at = ?, is_resting = 0
      WHERE player_id = ?
    `).run(now, playerId);
    
    // Also update memory state for quick access
    const state = playerRegenState.get(playerId) || {};
    state.lastCombat = Date.now();
    state.isResting = false;
    playerRegenState.set(playerId, state);
  } catch (error) {
    console.error('[regeneration] Error entering combat:', error);
  }
}

/**
 * Mark player as leaving combat
 * @param {number} playerId - Player ID
 */
export function leaveCombat(playerId) {
  const db = getDb();
  const now = new Date().toISOString();
  
  try {
    db.prepare(`
      UPDATE player_heroes
      SET last_combat_at = ?
      WHERE player_id = ?
    `).run(now, playerId);
    
    // Also update memory state
    const state = playerRegenState.get(playerId) || {};
    state.lastCombat = Date.now();
    playerRegenState.set(playerId, state);
  } catch (error) {
    console.error('[regeneration] Error leaving combat:', error);
  }
}

/**
 * Set player resting state
 * @param {number} playerId - Player ID
 * @param {boolean} resting - Is resting
 */
export function setResting(playerId, resting) {
  const db = getDb();
  
  // Can't rest in combat
  const inCombat = isInCombat(playerId);
  if (inCombat && resting) {
    return { success: false, error: 'Cannot rest while in combat' };
  }
  
  try {
    db.prepare(`
      UPDATE player_heroes
      SET is_resting = ?
      WHERE player_id = ?
    `).run(resting ? 1 : 0, playerId);
    
    // Also update memory state
    const state = playerRegenState.get(playerId) || {};
    state.isResting = resting;
    playerRegenState.set(playerId, state);
    
    return { success: true, resting };
  } catch (error) {
    console.error('[regeneration] Error setting resting state:', error);
    return { success: false, error: 'Database error' };
  }
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
  
  // Calculate regen amounts based on time elapsed
  const secondsElapsed = (now - lastRegen) / 1000;
  const isResting = state.isResting || false;
  const multiplier = isResting ? REGEN_CONFIG.RESTING_MULTIPLIER : 1;
  
  // HP per second = maxHealth / regenTime, then multiply by seconds elapsed
  const healthRegenAmount = Math.max(
    REGEN_CONFIG.MIN_HEALTH_REGEN,
    Math.floor((maxHealth / REGEN_CONFIG.HEALTH_REGEN_TIME) * secondsElapsed * multiplier)
  );
  
  const powerRegenAmount = Math.max(
    REGEN_CONFIG.MIN_POWER_REGEN,
    Math.floor((maxPower / REGEN_CONFIG.POWER_REGEN_TIME) * secondsElapsed * multiplier)
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
    // Include regeneration tracking columns
    const stmt = db.prepare(`
      SELECT 
        id,
        player_id,
        health,
        COALESCE(max_health, 100) as max_health,
        power,
        COALESCE(max_power, 100) as max_power,
        last_regen_at,
        last_combat_at,
        is_resting
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
      SET health = ?, power = ?, last_regen_at = ?
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
      
      // Check if out of combat long enough (from database)
      if (hero.last_combat_at) {
        const lastCombatTime = new Date(hero.last_combat_at).getTime();
        const timeSinceCombat = Date.now() - lastCombatTime;
        if (timeSinceCombat < REGEN_CONFIG.OUT_OF_COMBAT_DELAY) {
          console.log(`[regen-service] Skipping Player${hero.player_id} - too soon after combat (${Math.floor(timeSinceCombat/1000)}s)`);
          return; // Not enough time since combat
        }
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
      
      // Calculate time elapsed since last regen (catch-up for offline players!)
      const now = Date.now();
      let secondsElapsed;
      
      if (hero.last_regen_at) {
        // Has regenerated before - calculate time since last regen
        const lastRegenTime = new Date(hero.last_regen_at).getTime();
        secondsElapsed = Math.min((now - lastRegenTime) / 1000, 600); // Cap at 10 minutes catch-up
        
        // If not enough time passed, skip
        if (secondsElapsed < REGEN_CONFIG.HEALTH_REGEN_INTERVAL / 1000) {
          return;
        }
      } else {
        // First time regenerating - use the regen interval
        secondsElapsed = REGEN_CONFIG.HEALTH_REGEN_INTERVAL / 1000;
      }
      
      // Get resting state from database (prefer) or memory
      const isResting = hero.is_resting ? true : false;
      const multiplier = isResting ? REGEN_CONFIG.RESTING_MULTIPLIER : 1;
      
      // Calculate regen amounts based on actual time elapsed
      const healthRegenAmount = Math.max(
        REGEN_CONFIG.MIN_HEALTH_REGEN,
        Math.floor((maxHealth / REGEN_CONFIG.HEALTH_REGEN_TIME) * secondsElapsed * multiplier)
      );
      
      const powerRegenAmount = Math.max(
        REGEN_CONFIG.MIN_POWER_REGEN,
        Math.floor((maxPower / REGEN_CONFIG.POWER_REGEN_TIME) * secondsElapsed * multiplier)
      );
      
      const newHealth = Math.min(maxHealth, currentHealth + healthRegenAmount);
      const newPower = Math.min(maxPower, currentPower + powerRegenAmount);
      
      const healthGained = newHealth - currentHealth;
      const powerGained = newPower - currentPower;
      
      // Update database if there's any change
      if (healthGained > 0 || powerGained > 0) {
        const nowISO = new Date().toISOString();
        updateStmt.run(newHealth, newPower, nowISO, hero.id);
        updated++;
        totalHealthGained += healthGained;
        totalPowerGained += powerGained;
        
        console.log(`[regen-service] ✅ Player${hero.player_id}: +${healthGained} HP (${currentHealth}->${newHealth}/${maxHealth}), +${powerGained} Power (${currentPower}->${newPower}/${maxPower})${isResting ? ' [RESTING]' : ''} [${Math.floor(secondsElapsed)}s]`);
        
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

