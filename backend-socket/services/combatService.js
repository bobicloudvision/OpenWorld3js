/**
 * Combat Service
 * Handles all combat logic, validation, and state management
 */

import { updatePlayerHeroCombatStats } from './heroService.js';
import * as zoneService from './zoneService.js';
import { saveCombatMatch } from './combatHistoryService.js';
import { getActiveHeroForPlayer, updatePlayerExperience } from './playerService.js';

// Combat state storage (in-memory, move to Redis for production)
const combatInstances = new Map(); // combatInstanceId -> CombatInstance
const playerCombatState = new Map(); // playerId -> PlayerCombatState
const enemyCombatState = new Map(); // enemyId -> EnemyCombatState

/**
 * Initialize combat instance
 * @param {string} combatType - 'pvp' | 'pve' | 'team_pvp' | 'team_pve'
 * @param {Object} participants - { teams: [], players: [], enemies: [] }
 * @param {Object} zone - { center: [x,y,z], radius: number }
 * @param {number} zoneId - Zone ID where combat takes place
 * @param {boolean} isMatchmaking - Whether this is a matchmaking battle
 * @returns {string} combatInstanceId
 */
export function initializeCombatInstance(combatType, participants, zone, zoneId = null, isMatchmaking = false) {
  const combatInstanceId = `combat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const combatInstance = {
    combatInstanceId,
    combatType,
    participants,
    zone,
    zoneId,
    isMatchmaking,
    state: {
      active: true,
      startTime: Date.now(),
      endTime: null,
      emptyStartTime: null // Track when combat became empty (all players disconnected)
    },
    activeParticipants: new Set(participants.players || []), // Track actively connected players
    combatLog: []
  };
  
  combatInstances.set(combatInstanceId, combatInstance);
  
  // Register combat with zone service
  if (zoneId) {
    zoneService.registerCombatInZone(zoneId, combatInstanceId);
  }
  
  // Initialize participant states
  if (participants.players) {
    participants.players.forEach(playerId => {
      // Fetch player's current hero stats from database (preserves health/power between combats)
      const activeHero = getActiveHeroForPlayer(playerId);
      if (activeHero) {
        // Safety check: Don't allow defeated heroes to enter combat
        if (activeHero.health <= 0) {
          console.error(`[combat] Player ${playerId} tried to enter combat with 0 health! Skipping...`);
          return;
        }
        
        const initialStats = {
          health: activeHero.health,
          maxHealth: activeHero.maxHealth,
          power: activeHero.power,
          maxPower: activeHero.maxPower,
          attack: activeHero.attack,
          defense: activeHero.defense,
          playerHeroId: activeHero.playerHeroId // Track hero ID for combat history
        };
        initializePlayerCombatState(playerId, combatInstanceId, initialStats);
      } else {
        // Fallback: initialize with default stats if no active hero
        console.warn(`[combat] Player ${playerId} has no active hero, using defaults`);
        initializePlayerCombatState(playerId, combatInstanceId);
      }
    });
  }
  
  if (participants.enemies) {
    participants.enemies.forEach(enemyId => {
      initializeEnemyCombatState(enemyId, combatInstanceId);
    });
  }
  
  return combatInstanceId;
}

/**
 * Validate spell cast action
 * @param {number} playerId - Player ID
 * @param {string} spellKey - Spell key identifier
 * @param {Array<number>} targetPosition - [x, y, z] target position
 * @param {Array<number>} playerPosition - [x, y, z] player position
 * @param {Object} spell - Spell definition
 * @returns {{success: boolean, error?: string}}
 */
export function validateSpellCast(playerId, spellKey, targetPosition, playerPosition, spell) {
  // Check if player is in active combat
  const playerState = playerCombatState.get(playerId);
  if (!playerState || !playerState.combatInstanceId) {
    return { success: false, error: 'Player not in combat' };
  }
  
  // Check if player is alive
  if (playerState.health <= 0) {
    return { success: false, error: 'Cannot cast spell - player is defeated' };
  }
  
  // Check power cost
  if (playerState.power < spell.powerCost) {
    return { success: false, error: 'Not enough power' };
  }
  
  // Check cooldown
  const lastCast = playerState.spellCooldowns?.[spellKey] || 0;
  const now = Date.now();
  if (now - lastCast < spell.cooldown) {
    const remaining = spell.cooldown - (now - lastCast);
    return { 
      success: false, 
      error: `${spell.name} is on cooldown (${Math.ceil(remaining / 1000)}s remaining)` 
    };
  }
  
  // Check range
  const distance = calculateDistance(playerPosition, targetPosition);
  if (distance > spell.range) {
    return { 
      success: false, 
      error: `Target is too far! Range: ${spell.range}m, Distance: ${Math.round(distance * 10) / 10}m` 
    };
  }
  
  return { success: true };
}

/**
 * Execute spell cast
 * @param {number} playerId - Player ID
 * @param {string} spellKey - Spell key
 * @param {Array<number>} targetPosition - [x, y, z]
 * @param {Array<number>} playerPosition - [x, y, z]
 * @param {Object} spell - Spell definition
 * @returns {Object} Combat result
 */
export function executeSpellCast(playerId, spellKey, targetPosition, playerPosition, spell) {
  const playerState = playerCombatState.get(playerId);
  if (!playerState) {
    return { success: false, error: 'Player state not found' };
  }
  
  // Safety check: verify player is alive and has enough resources
  if (playerState.health <= 0) {
    return { success: false, error: 'Player is defeated' };
  }
  
  if (playerState.power < spell.powerCost) {
    return { success: false, error: 'Not enough power' };
  }
  
  const combatInstance = combatInstances.get(playerState.combatInstanceId);
  if (!combatInstance || !combatInstance.state.active) {
    return { success: false, error: 'Combat instance not active' };
  }
  
  // Deduct power and set cooldown
  playerState.power = Math.max(0, playerState.power - spell.powerCost);
  playerState.spellCooldowns = playerState.spellCooldowns || {};
  playerState.spellCooldowns[spellKey] = Date.now();
  
  // Find targets in AoE range
  const aoeRadius = spell.affectRange || 0;
  const affectedTargets = [];
  
  // Check enemies in range
  if (combatInstance.participants.enemies) {
    combatInstance.participants.enemies.forEach(enemyId => {
      const enemyState = enemyCombatState.get(enemyId);
      if (!enemyState || !enemyState.alive) return;
      
      const distance = calculateDistance(targetPosition, enemyState.position);
      if (distance <= aoeRadius) {
        const damage = calculateDamage(spell, playerState, enemyState);
        // Support both statusEffect (single) and statusEffects (array) from database
        const effects = spell.statusEffects && spell.statusEffects.length > 0
          ? spell.statusEffects
          : (spell.statusEffect ? [spell.statusEffect] : []);
        
        affectedTargets.push({
          targetId: enemyId,
          targetType: 'enemy',
          damage,
          effects,
          position: enemyState.position
        });
      }
    });
  }
  
  // Check players in range (for healing and damage in all game modes)
  if (combatInstance.participants.players) {
    combatInstance.participants.players.forEach(targetPlayerId => {
      // Allow self-targeting for healing spells
      const isHealingSpell = spell.damage < 0;
      if (targetPlayerId === playerId && !isHealingSpell) {
        return; // Can't damage self
      }
      
      const targetState = playerCombatState.get(targetPlayerId);
      if (!targetState) return;
      
      const distance = calculateDistance(targetPosition, targetState.position);
      if (distance <= aoeRadius) {
        // For PvE, only allow healing allies
        if (combatInstance.combatType === 'pve' || combatInstance.combatType === 'team_pve') {
          if (!isHealingSpell) return; // No player damage in PvE
        }
        
        // For PvP, check team (TODO: implement proper team checking)
        // For now, allow all actions
        
        const damage = spell.damage > 0 ? calculateDamage(spell, playerState, targetState) : 0;
        const heal = isHealingSpell ? Math.abs(spell.damage) : 0;
        // Support both statusEffect (single) and statusEffects (array) from database
        const effects = spell.statusEffects && spell.statusEffects.length > 0
          ? spell.statusEffects
          : (spell.statusEffect ? [spell.statusEffect] : []);
        
        affectedTargets.push({
          targetId: targetPlayerId,
          targetType: 'player',
          damage,
          heal,
          effects,
          position: targetState.position
        });
      }
    });
  }
  
  // Apply damage/healing
  affectedTargets.forEach(target => {
    applyDamageOrHealing(target);
    
    // Apply status effects
    if (target.effects && target.effects.length > 0) {
      target.effects.forEach(effect => {
        applyStatusEffect(target.targetId, target.targetType, effect, spellKey);
      });
    }
    
    // Handle special effects (knockback, lifesteal, etc.)
    if (target.effects && target.effects.some(e => e.type === 'knockback')) {
      const knockbackEffect = target.effects.find(e => e.type === 'knockback');
      applyKnockback(target.targetId, target.targetType, playerPosition, knockbackEffect.force);
    }
    
    if (target.effects && target.effects.some(e => e.type === 'lifesteal')) {
      const lifestealEffect = target.effects.find(e => e.type === 'lifesteal');
      const healAmount = Math.floor(target.damage * (lifestealEffect.healPercent / 100));
      if (target.targetType === 'enemy') {
        healPlayer(playerId, healAmount);
      }
    }
  });
  
  // Log combat action
  logCombatAction(combatInstance.combatInstanceId, {
    actorId: playerId,
    actorType: 'player',
    actionType: 'spell-cast',
    spellKey,
    targetPosition,
    affectedTargets: affectedTargets.map(t => ({
      targetId: t.targetId,
      targetType: t.targetType,
      damage: t.damage,
      heal: t.heal || 0
    })),
    timestamp: Date.now()
  });
  
  return {
    success: true,
    actorId: playerId,
    actionType: 'spell-cast',
    spellKey,
    targetPosition,
    affectedTargets
  };
}

/**
 * Calculate damage
 * @param {Object} spell - Spell definition
 * @param {Object} attacker - Attacker state
 * @param {Object} defender - Defender state
 * @returns {number} Damage amount
 */
function calculateDamage(spell, attacker, defender) {
  let damage = spell.damage || 0;
  
  // Add attacker's attack stat
  if (attacker.attack) {
    damage += Math.floor(attacker.attack * 0.1); // 10% of attack adds to spell damage
  }
  
  // Reduce by defender's defense
  if (defender.defense) {
    damage = Math.max(1, damage - Math.floor(defender.defense * 0.5)); // Defense reduces damage
  }
  
  return Math.max(1, Math.floor(damage));
}

/**
 * Apply damage or healing to target
 * @param {Object} target - Target info { targetId, targetType, damage, heal }
 */
function applyDamageOrHealing(target) {
  if (target.targetType === 'enemy') {
    const enemyState = enemyCombatState.get(target.targetId);
    if (enemyState) {
      enemyState.health = Math.max(0, enemyState.health - (target.damage || 0));
      if (target.heal) {
        enemyState.health = Math.min(enemyState.maxHealth, enemyState.health + target.heal);
      }
      enemyState.alive = enemyState.health > 0;
    }
  } else if (target.targetType === 'player') {
    const playerState = playerCombatState.get(target.targetId);
    if (playerState) {
      playerState.health = Math.max(0, playerState.health - (target.damage || 0));
      if (target.heal) {
        playerState.health = Math.min(playerState.maxHealth, playerState.health + target.heal);
      }
    }
  }
}

/**
 * Apply status effect to target
 * @param {number|string} targetId - Target ID
 * @param {string} targetType - 'player' | 'enemy'
 * @param {Object} effect - Effect definition
 * @param {string} sourceSpell - Spell that applied the effect
 */
function applyStatusEffect(targetId, targetType, effect, sourceSpell) {
  const state = targetType === 'player' 
    ? playerCombatState.get(targetId)
    : enemyCombatState.get(targetId);
  
  if (!state) return;
  
  state.statusEffects = state.statusEffects || [];
  
  const now = Date.now();
  const newEffect = {
    ...effect,
    sourceSpell,
    appliedAt: now,
    expiresAt: now + (effect.duration || 0)
  };
  
  state.statusEffects.push(newEffect);
}

/**
 * Apply knockback to target
 * @param {number|string} targetId - Target ID
 * @param {string} targetType - 'player' | 'enemy'
 * @param {Array<number>} sourcePosition - [x, y, z] source position
 * @param {number} force - Knockback force
 */
function applyKnockback(targetId, targetType, sourcePosition, force) {
  const state = targetType === 'player'
    ? playerCombatState.get(targetId)
    : enemyCombatState.get(targetId);
  
  if (!state) return;
  
  const dx = state.position[0] - sourcePosition[0];
  const dz = state.position[2] - sourcePosition[2];
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  if (distance === 0) return;
  
  const newX = state.position[0] + (dx / distance) * force;
  const newZ = state.position[2] + (dz / distance) * force;
  
  state.position = [newX, state.position[1], newZ];
}

/**
 * Heal player
 * @param {number} playerId - Player ID
 * @param {number} amount - Heal amount
 */
function healPlayer(playerId, amount) {
  const playerState = playerCombatState.get(playerId);
  if (playerState) {
    playerState.health = Math.min(playerState.maxHealth, playerState.health + amount);
  }
}

/**
 * Initialize player combat state
 * @param {number} playerId - Player ID
 * @param {string} combatInstanceId - Combat instance ID
 * @param {Object} initialStats - Initial stats (from database)
 */
export function initializePlayerCombatState(playerId, combatInstanceId, initialStats = {}) {
  const maxHealth = initialStats.maxHealth || 100;
  const maxPower = initialStats.maxPower || 100;
  
  // Health: if provided, use it; otherwise start at full health
  // Power: clamp to maxPower (carried over from database)
  const health = initialStats.health !== undefined ? initialStats.health : maxHealth;
  const power = Math.min(initialStats.power || maxPower, maxPower);
  
  playerCombatState.set(playerId, {
    playerId,
    combatInstanceId,
    health,
    maxHealth,
    power,
    maxPower,
    attack: initialStats.attack || 15,
    defense: initialStats.defense || 5,
    position: initialStats.position || [0, 0, 0],
    spellCooldowns: {},
    statusEffects: [],
    playerHeroId: initialStats.playerHeroId || null // Track hero ID for combat history
  });
}

/**
 * Initialize enemy combat state
 * @param {string} enemyId - Enemy ID
 * @param {string} combatInstanceId - Combat instance ID
 * @param {Object} initialStats - Initial stats
 */
export function initializeEnemyCombatState(enemyId, combatInstanceId, initialStats = {}) {
  const maxHealth = initialStats.maxHealth || 60;
  
  // Ensure health never exceeds max health
  const health = Math.min(initialStats.health || 60, maxHealth);
  
  enemyCombatState.set(enemyId, {
    enemyId,
    combatInstanceId,
    health,
    maxHealth,
    attack: initialStats.attack || 12,
    defense: initialStats.defense || 3,
    position: initialStats.position || [0, 0, 0],
    alive: true,
    statusEffects: []
  });
}

/**
 * Process combat tick (update status effects, regen power, etc.)
 * @param {string} combatInstanceId - Combat instance ID
 */
export function processCombatTick(combatInstanceId) {
  const combatInstance = combatInstances.get(combatInstanceId);
  if (!combatInstance || !combatInstance.state.active) return;
  
  const now = Date.now();
  
  // Check if combat should be ended due to all players leaving
  checkAbandonedCombat(combatInstanceId, now);
  
  // Process player status effects (poison, etc.)
  if (combatInstance.participants.players) {
    combatInstance.participants.players.forEach(playerId => {
      const playerState = playerCombatState.get(playerId);
      if (!playerState) return;
      
      // Regenerate power
      if (playerState.power < playerState.maxPower) {
        playerState.power = Math.min(playerState.maxPower, playerState.power + 1);
      }
      
      // Process status effects
      processStatusEffects(playerId, 'player', playerState, now);
    });
  }
  
  // Process enemy status effects
  if (combatInstance.participants.enemies) {
    combatInstance.participants.enemies.forEach(enemyId => {
      const enemyState = enemyCombatState.get(enemyId);
      if (!enemyState || !enemyState.alive) return;
      
      processStatusEffects(enemyId, 'enemy', enemyState, now);
    });
  }
}

/**
 * Process status effects for a combatant
 * @param {number|string} targetId - Target ID
 * @param {string} targetType - 'player' | 'enemy'
 * @param {Object} state - Combat state
 * @param {number} now - Current timestamp
 */
function processStatusEffects(targetId, targetType, state, now) {
  if (!state.statusEffects || state.statusEffects.length === 0) return;
  
  // Remove expired effects
  state.statusEffects = state.statusEffects.filter(effect => {
    if (!effect.expiresAt) return true; // Permanent effects
    return effect.expiresAt > now;
  });
  
  // Process poison damage
  state.statusEffects.forEach(effect => {
    if (effect.type === 'poison') {
      const lastTick = effect.lastTick || effect.appliedAt;
      if (now - lastTick >= (effect.tickRate || 1000)) {
        const poisonDamage = effect.tickDamage || 5;
        if (targetType === 'enemy') {
          const enemyState = enemyCombatState.get(targetId);
          if (enemyState) {
            enemyState.health = Math.max(0, enemyState.health - poisonDamage);
            enemyState.alive = enemyState.health > 0;
          }
        } else {
          const playerState = playerCombatState.get(targetId);
          if (playerState) {
            playerState.health = Math.max(0, playerState.health - poisonDamage);
          }
        }
        effect.lastTick = now;
      }
    }
  });
}

/**
 * Mark player as disconnected from combat
 * @param {number} playerId - Player ID
 */
export function markPlayerDisconnected(playerId) {
  const playerState = playerCombatState.get(playerId);
  if (!playerState || !playerState.combatInstanceId) return;
  
  const combatInstance = combatInstances.get(playerState.combatInstanceId);
  if (!combatInstance) return;
  
  // Remove from active participants
  combatInstance.activeParticipants.delete(playerId);
  
  // If combat is now empty, start the abandon timer
  if (combatInstance.activeParticipants.size === 0) {
    combatInstance.state.emptyStartTime = Date.now();
    console.log(`[combat] Combat ${playerState.combatInstanceId} is now empty - 15s abandon timer started`);
  }
  
  console.log(`[combat] Player ${playerId} disconnected from combat ${playerState.combatInstanceId} (${combatInstance.activeParticipants.size} players remaining)`);
}

/**
 * Mark player as reconnected to combat
 * @param {number} playerId - Player ID
 */
export function markPlayerReconnected(playerId) {
  const playerState = playerCombatState.get(playerId);
  if (!playerState || !playerState.combatInstanceId) return;
  
  const combatInstance = combatInstances.get(playerState.combatInstanceId);
  if (!combatInstance) return;
  
  // Add back to active participants
  combatInstance.activeParticipants.add(playerId);
  
  // Cancel abandon timer if it was running
  if (combatInstance.state.emptyStartTime !== null) {
    combatInstance.state.emptyStartTime = null;
    console.log(`[combat] Combat ${playerState.combatInstanceId} abandon timer cancelled - player ${playerId} reconnected`);
  }
  
  console.log(`[combat] Player ${playerId} reconnected to combat ${playerState.combatInstanceId} (${combatInstance.activeParticipants.size} players active)`);
}

/**
 * Check if combat should be ended due to abandonment
 * @param {string} combatInstanceId - Combat instance ID
 * @param {number} now - Current timestamp
 * @returns {boolean} Whether combat was abandoned and ended
 */
function checkAbandonedCombat(combatInstanceId, now) {
  const combatInstance = combatInstances.get(combatInstanceId);
  if (!combatInstance || !combatInstance.state.active) return false;
  
  // If combat is not empty, nothing to check
  if (combatInstance.activeParticipants.size > 0) {
    combatInstance.state.emptyStartTime = null;
    return false;
  }
  
  // If combat just became empty, start the timer
  if (combatInstance.state.emptyStartTime === null) {
    combatInstance.state.emptyStartTime = now;
    console.log(`[combat] Combat ${combatInstanceId} empty timer started`);
    return false;
  }
  
  // Check if 15 seconds have passed
  const emptyDuration = now - combatInstance.state.emptyStartTime;
  const ABANDON_TIMEOUT = 15000; // 15 seconds
  
  if (emptyDuration >= ABANDON_TIMEOUT) {
    console.log(`[combat] Combat ${combatInstanceId} abandoned - no players for 15 seconds, ending combat`);
    endCombatInstance(combatInstanceId, 'abandoned');
    return true;
  }
  
  return false;
}

/**
 * Check combat win/loss conditions
 * @param {string} combatInstanceId - Combat instance ID
 * @returns {{ended: boolean, result?: string, winners?: [], losers?: []}}
 */
export function checkCombatConditions(combatInstanceId) {
  const combatInstance = combatInstances.get(combatInstanceId);
  if (!combatInstance || !combatInstance.state.active) {
    return { ended: false };
  }
  
  // Check if all enemies defeated (PvE) — only if there are enemies present
  if ((combatInstance.combatType === 'pve' || combatInstance.combatType === 'team_pve') &&
      Array.isArray(combatInstance.participants.enemies) &&
      combatInstance.participants.enemies.length > 0) {
    const allEnemiesDead = combatInstance.participants.enemies?.every(enemyId => {
      const enemyState = enemyCombatState.get(enemyId);
      return !enemyState || !enemyState.alive;
    });
    
    if (allEnemiesDead) {
      console.log('[combat] PvE Victory - All enemies defeated');
      return {
        ended: true,
        result: 'victory',
        winners: combatInstance.participants.players || [],
        losers: combatInstance.participants.enemies || []
      };
    }
  }
  
  // PvP: Check if only one player (or team) remains alive
  if (combatInstance.combatType === 'pvp' || combatInstance.combatType === 'team_pvp') {
    const players = combatInstance.participants.players || [];
    
    // Get alive and dead players
    const alivePlayers = players.filter(playerId => {
      const playerState = playerCombatState.get(playerId);
      return playerState && playerState.health > 0;
    });
    
    const deadPlayers = players.filter(playerId => {
      const playerState = playerCombatState.get(playerId);
      return !playerState || playerState.health <= 0;
    });
    
    // Debug logging
    console.log(`[combat] PvP Check - Total: ${players.length}, Alive: ${alivePlayers.length}, Dead: ${deadPlayers.length}`);
    players.forEach(playerId => {
      const playerState = playerCombatState.get(playerId);
      console.log(`[combat]   Player ${playerId}: HP ${playerState?.health || 0}/${playerState?.maxHealth || 0}`);
    });
    
    // If all players are dead (shouldn't happen but handle it)
    if (alivePlayers.length === 0) {
      console.log('[combat] PvP Draw - All players defeated');
      return {
        ended: true,
        result: 'draw',
        winners: [],
        losers: players
      };
    }
    
    // If only one player alive = they win
    if (alivePlayers.length === 1 && deadPlayers.length > 0) {
      console.log(`[combat] PvP Victory - Player ${alivePlayers[0]} wins!`);
      return {
        ended: true,
        result: 'victory',
        winners: alivePlayers,
        losers: deadPlayers
      };
    }
    
    // If multiple players alive, combat continues
    console.log('[combat] PvP continues - multiple players still alive');
    return { ended: false };
  }
  
  // Check if all players defeated (fallback for PvE without enemies)
  const allPlayersDead = combatInstance.participants.players?.every(playerId => {
    const playerState = playerCombatState.get(playerId);
    return !playerState || playerState.health <= 0;
  });
  
  if (allPlayersDead) {
    console.log('[combat] Defeat - All players defeated');
    return {
      ended: true,
      result: 'defeat',
      winners: combatInstance.participants.enemies || [],
      losers: combatInstance.participants.players || []
    };
  }
  
  return { ended: false };
}

/**
 * Calculate experience gained from combat
 * @param {Object} combatInstance - Combat instance
 * @param {string} playerId - Player ID
 * @param {string} result - Combat result ('victory' | 'defeat' | 'draw')
 * @returns {number} Experience points gained
 */
function calculateExperienceGained(combatInstance, playerId, result) {
  let baseExp = 0;
  
  // Base experience from combat duration (1 exp per 10 seconds)
  const duration = (combatInstance.state.endTime - combatInstance.state.startTime) / 1000;
  baseExp += Math.floor(duration / 10);
  
  // Bonus for victory
  if (result === 'victory') {
    baseExp += 50;
  } else if (result === 'draw') {
    baseExp += 25;
  } else {
    baseExp += 10; // Small consolation for defeat
  }
  
  // Bonus for enemies defeated (PvE)
  if (combatInstance.participants.enemies && combatInstance.participants.enemies.length > 0) {
    const enemiesDefeated = combatInstance.participants.enemies.filter(enemyId => {
      const enemyState = enemyCombatState.get(enemyId);
      return enemyState && !enemyState.alive;
    }).length;
    baseExp += enemiesDefeated * 20;
  }
  
  // Bonus for PvP participation
  if (combatInstance.combatType === 'pvp' || combatInstance.combatType === 'team_pvp') {
    const otherPlayers = (combatInstance.participants.players || []).filter(pid => pid !== playerId).length;
    baseExp += otherPlayers * 30;
  }
  
  return Math.max(10, baseExp); // Minimum 10 exp
}

/**
 * End combat instance
 * @param {string} combatInstanceId - Combat instance ID
 * @param {string} result - 'victory' | 'defeat' | 'draw'
 * @returns {Object} Player results including level-ups { playerId: { playerLeveledUp, playerOldLevel, playerNewLevel, heroLeveledUp, heroOldLevel, heroNewLevel, experienceGained } }
 */
export function endCombatInstance(combatInstanceId, result) {
  const combatInstance = combatInstances.get(combatInstanceId);
  if (!combatInstance) return {};
  
  combatInstance.state.active = false;
  combatInstance.state.endTime = Date.now();
  
  // Unregister combat from zone service
  if (combatInstance.zoneId) {
    zoneService.unregisterCombatFromZone(combatInstance.zoneId, combatInstanceId);
  }
  
  const playerResults = {};
  
  // Save final combat stats to database for all players
  if (combatInstance.participants.players) {
    combatInstance.participants.players.forEach(playerId => {
      const playerState = playerCombatState.get(playerId);
      if (playerState) {
        // Calculate experience gained
        const experienceGained = calculateExperienceGained(combatInstance, playerId, result);
        
        // Update PLAYER experience and level (account-wide progression)
        const playerLevelResult = updatePlayerExperience(playerId, experienceGained);
        
        // Prepare combat stats to save (WoW-style: health persists between combats)
        const combatStats = {
          health: playerState.health, // Save current health (damage persists!)
          power: playerState.power,
          experienceGained
        };
        
        // Update HERO combat stats (hero-specific progression)
        const heroLevelResult = updatePlayerHeroCombatStats(playerId, combatStats);
        
        if (heroLevelResult.success || playerLevelResult.success) {
          console.log(`[combat] Saved combat results for player ${playerId}: HP=${playerState.health}/${playerState.maxHealth}, Power=${playerState.power}, EXP=+${experienceGained}`);
          
          if (playerLevelResult.leveledUp) {
            console.log(`[combat] 🎉 Player ${playerId} LEVEL UP! ${playerLevelResult.oldLevel} -> ${playerLevelResult.newLevel}`);
          }
          
          if (heroLevelResult.leveledUp) {
            console.log(`[combat] ⚔️ Hero LEVEL UP! -> ${heroLevelResult.newLevel}`);
          }
          
          // Store level-up info for broadcasting (both player and hero)
          playerResults[playerId] = {
            // Player level info
            playerLeveledUp: playerLevelResult.leveledUp || false,
            playerOldLevel: playerLevelResult.oldLevel,
            playerNewLevel: playerLevelResult.newLevel,
            
            // Hero level info
            heroLeveledUp: heroLevelResult.leveledUp || false,
            heroOldLevel: heroLevelResult.leveledUp ? heroLevelResult.newLevel - 1 : undefined,
            heroNewLevel: heroLevelResult.newLevel,
            
            // Experience gained (same for both)
            experienceGained
          };
        }
      }
    });
  }
  
  // Save combat match to history database
  try {
    const winners = [];
    const losers = [];
    
    // Determine winners and losers based on their health
    combatInstance.participants.players?.forEach(playerId => {
      const playerState = playerCombatState.get(playerId);
      if (playerState && playerState.health > 0) {
        winners.push(playerId);
      } else {
        losers.push(playerId);
      }
    });
    
    // If no winners (all dead), it's a draw
    if (winners.length === 0) {
      losers.forEach(pid => winners.push(pid));
      losers.length = 0;
    }
    
    // Build player results with detailed stats
    const detailedPlayerResults = {};
    combatInstance.participants.players?.forEach(playerId => {
      const playerState = playerCombatState.get(playerId);
      const playerResult = playerResults[playerId] || {};
      
      detailedPlayerResults[playerId] = {
        ...playerResult,
        health: playerState?.health || 0,
        maxHealth: playerState?.maxHealth || 100,
        power: playerState?.power || 0,
        maxPower: playerState?.maxPower || 100,
        // Player level (account-wide)
        playerLevel: playerResult.playerNewLevel || 1,
        playerOldLevel: playerResult.playerOldLevel || 1,
        playerLeveledUp: playerResult.playerLeveledUp || false,
        // Hero level (hero-specific)
        heroLevel: playerResult.heroNewLevel || 1,
        heroOldLevel: playerResult.heroOldLevel || 1,
        heroLeveledUp: playerResult.heroLeveledUp || false,
        // Other stats
        activeHeroId: playerState?.playerHeroId || null,
        damageDealt: 0, // TODO: Track in combat state
        damageTaken: 0, // TODO: Track in combat state
        healingDone: 0, // TODO: Track in combat state
        spellsCast: 0, // TODO: Track in combat state
        kills: 0,
        deaths: playerState?.health > 0 ? 0 : 1,
      };
    });
    
    const matchType = combatInstance.isMatchmaking ? 'matchmaking' : 'world';
    
    saveCombatMatch({
      combatInstanceId,
      combatType: combatInstance.combatType,
      matchType,
      queueType: combatInstance.queueType || null,
      zoneId: combatInstance.zoneId,
      result,
      winners,
      losers,
      startTime: combatInstance.state.startTime,
      endTime: combatInstance.state.endTime,
      stats: {},
      playerResults: detailedPlayerResults
    });
  } catch (error) {
    console.error('[combat] Error saving combat history:', error);
  }
  
  return playerResults;
  
  // Clean up after delay (for final state broadcasts)
  setTimeout(() => {
    combatInstances.delete(combatInstanceId);
    
    // Clean up participant states
    if (combatInstance.participants.players) {
      combatInstance.participants.players.forEach(playerId => {
        playerCombatState.delete(playerId);
      });
    }
    
    if (combatInstance.participants.enemies) {
      combatInstance.participants.enemies.forEach(enemyId => {
        enemyCombatState.delete(enemyId);
      });
    }
  }, 5000); // Keep state for 5 seconds after combat ends
}

/**
 * Get combat instance
 * @param {string} combatInstanceId - Combat instance ID
 * @returns {Object|null}
 */
export function getCombatInstance(combatInstanceId) {
  return combatInstances.get(combatInstanceId) || null;
}

/**
 * Get player combat state
 * @param {number} playerId - Player ID
 * @returns {Object|null}
 */
export function getPlayerCombatState(playerId) {
  return playerCombatState.get(playerId) || null;
}

/**
 * Update player position in combat
 * @param {number} playerId - Player ID
 * @param {Array<number>} position - [x, y, z]
 */
export function updatePlayerPosition(playerId, position) {
  const playerState = playerCombatState.get(playerId);
  if (playerState) {
    playerState.position = position;
  }
}

/**
 * Log combat action
 * @param {string} combatInstanceId - Combat instance ID
 * @param {Object} action - Action data
 */
function logCombatAction(combatInstanceId, action) {
  const combatInstance = combatInstances.get(combatInstanceId);
  if (combatInstance) {
    combatInstance.combatLog.push(action);
    // Keep only last 100 actions
    if (combatInstance.combatLog.length > 100) {
      combatInstance.combatLog.shift();
    }
  }
}

/**
 * Calculate distance between two positions
 * @param {Array<number>} pos1 - [x, y, z]
 * @param {Array<number>} pos2 - [x, y, z]
 * @returns {number}
 */
function calculateDistance(pos1, pos2) {
  const dx = pos1[0] - pos2[0];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Get all active combat instances
 * @returns {Map} Map of combat instances
 */
export function getAllCombatInstances() {
  return combatInstances;
}

/**
 * Get active combat instance for a player
 * @param {number} playerId - Player ID
 * @returns {Object|null} Combat instance info if player is in active combat
 */
export function getActiveCombatForPlayer(playerId) {
  const playerState = playerCombatState.get(playerId);
  if (!playerState || !playerState.combatInstanceId) {
    return null;
  }
  
  const combatInstance = combatInstances.get(playerState.combatInstanceId);
  if (!combatInstance || !combatInstance.state.active) {
    return null;
  }
  
  return {
    combatInstanceId: combatInstance.combatInstanceId,
    combatType: combatInstance.combatType,
    isMatchmaking: combatInstance.isMatchmaking || false,
    zone: combatInstance.zone,
    zoneId: combatInstance.zoneId,
    startTime: combatInstance.state.startTime,
    participants: combatInstance.participants,
    playerState: {
      health: playerState.health,
      maxHealth: playerState.maxHealth,
      power: playerState.power,
      maxPower: playerState.maxPower
    }
  };
}

