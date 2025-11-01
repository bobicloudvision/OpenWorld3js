/**
 * Enemy Service
 * Handles enemy AI, movement, detection, and combat behavior
 * Runs on the server to prevent cheating and ensure consistency
 */

import { getAllPlayersInGameSession } from './multiplayerService.js';
import * as zoneService from './zoneService.js';

// In-memory enemy state storage
const enemies = new Map(); // enemyId -> EnemyState

// Enemy configurations
const ENEMY_CONFIGS = {
  'goblin-warrior': {
    name: 'Goblin Warrior',
    health: 60,
    maxHealth: 60,
    power: 50,
    maxPower: 50,
    attack: 12,
    defense: 3,
    type: 'melee',
    magicTypes: ['fire'],
    attackCooldown: 2000,
    model: '/models/avatars/GanfaulMAure.glb',
    modelScale: 1,
    modelRotation: [0, -Math.PI / 2, 0]
  },
  'dark-mage': {
    name: 'Dark Mage',
    health: 40,
    maxHealth: 40,
    power: 80,
    maxPower: 80,
    attack: 8,
    defense: 2,
    type: 'caster',
    magicTypes: ['ice', 'lightning'],
    attackCooldown: 3000,
    model: '/models/avatars/NightshadeJFriedrich.glb',
    modelScale: 1,
    modelRotation: [0, -Math.PI / 2, 0]
  },
  'orc-berserker': {
    name: 'Orc Berserker',
    health: 120,
    maxHealth: 120,
    power: 30,
    maxPower: 30,
    attack: 20,
    defense: 8,
    type: 'tank',
    magicTypes: [],
    attackCooldown: 1500,
    model: '/models/avatars/WarrokWKurniawan.glb',
    modelScale: 1,
    modelRotation: [0, -Math.PI / 2, 0]
  }
};

/**
 * Initialize an enemy in a zone
 * SECURITY: Only call from trusted server-side code
 * @param {string} enemyId - Unique enemy ID
 * @param {string} enemyType - Enemy type key (e.g., 'goblin-warrior')
 * @param {number} zoneId - Zone ID where enemy spawns
 * @param {Array<number>} position - Initial position [x, y, z]
 * @returns {Object} Enemy state
 */
export function initializeEnemy(enemyId, enemyType, zoneId, position = null) {
  // Validate enemy type - only allow predefined types
  const validEnemyTypes = Object.keys(ENEMY_CONFIGS);
  if (!validEnemyTypes.includes(enemyType)) {
    console.warn(`[enemyService] Invalid enemy type: ${enemyType}, defaulting to goblin-warrior`);
    enemyType = 'goblin-warrior';
  }
  
  const config = ENEMY_CONFIGS[enemyType] || ENEMY_CONFIGS['goblin-warrior'];
  
  // Validate position
  if (!Array.isArray(position) || position.length < 3) {
    position = [0, 0, 0];
  }
  
  // Ensure position values are valid numbers
  position = position.map(val => (typeof val === 'number' && isFinite(val)) ? val : 0);
  
  const enemy = {
    id: enemyId,
    name: config.name,
    health: config.health,
    maxHealth: config.maxHealth,
    power: config.power,
    maxPower: config.maxPower,
    attack: config.attack,
    defense: config.defense,
    position: position || [0, 0, 0],
    alive: true,
    type: config.type,
    magicTypes: config.magicTypes,
    lastAttack: 0,
    attackCooldown: config.attackCooldown,
    statusEffects: [],
    zoneId,
    model: config.model,
    modelScale: config.modelScale,
    modelRotation: config.modelRotation,
    
    // AI state
    facingAngle: Math.random() * Math.PI * 2,
    wanderDirection: {
      x: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
      changeTime: Date.now() + Math.random() * 3000 + 2000
    },
    playerVisible: false,
    lastPosition: [...(position || [0, 0, 0])],
    isMoving: false,
    currentAnimation: 'idle'
  };
  
  enemies.set(enemyId, enemy);
  console.log(`[enemyService] Initialized enemy ${enemyId} (${enemy.name}) in zone ${zoneId}`);
  
  return enemy;
}

/**
 * Get enemy by ID
 */
export function getEnemy(enemyId) {
  return enemies.get(enemyId) || null;
}

/**
 * Get all enemies in a zone
 */
export function getEnemiesInZone(zoneId) {
  return Array.from(enemies.values()).filter(e => e.alive && e.zoneId === zoneId);
}

/**
 * Get all alive enemies
 */
export function getAllEnemies() {
  return Array.from(enemies.values()).filter(e => e.alive);
}

/**
 * Update enemy position
 */
export function updateEnemyPosition(enemyId, position) {
  const enemy = enemies.get(enemyId);
  if (!enemy) return false;
  
  enemy.position = position;
  enemy.lastPosition = [...position];
  return true;
}

/**
 * Apply damage to enemy
 */
export function damageEnemy(enemyId, damage) {
  const enemy = enemies.get(enemyId);
  if (!enemy || !enemy.alive) return false;
  
  enemy.health = Math.max(0, enemy.health - damage);
  enemy.alive = enemy.health > 0;
  
  return true;
}

/**
 * Add status effect to enemy
 */
export function addStatusEffect(enemyId, effect) {
  const enemy = enemies.get(enemyId);
  if (!enemy || !enemy.alive) return false;
  
  if (!enemy.statusEffects) {
    enemy.statusEffects = [];
  }
  
  // Remove existing effect of same type
  enemy.statusEffects = enemy.statusEffects.filter(e => e.type !== effect.type);
  
  // Add new effect
  enemy.statusEffects.push({
    ...effect,
    appliedAt: Date.now()
  });
  
  return true;
}

/**
 * Remove enemy
 */
export function removeEnemy(enemyId) {
  return enemies.delete(enemyId);
}

/**
 * Remove all enemies from a zone
 */
export function removeEnemiesFromZone(zoneId) {
  const toRemove = [];
  for (const [enemyId, enemy] of enemies.entries()) {
    if (enemy.zoneId === zoneId) {
      toRemove.push(enemyId);
    }
  }
  
  toRemove.forEach(id => enemies.delete(id));
  console.log(`[enemyService] Removed ${toRemove.length} enemies from zone ${zoneId}`);
}

// AI Constants
const ATTACK_RANGE = 3;
const MAGIC_RANGE = 8;
const DETECTION_RANGE = 25;
const FOV_ANGLE = Math.PI * 0.75; // 135 degrees

/**
 * Get movement speed based on enemy type
 */
function getMovementSpeed(enemyType) {
  switch(enemyType) {
    case 'melee': return 2.5;
    case 'caster': return 1.5;
    case 'tank': return 1.8;
    default: return 2.0;
  }
}

/**
 * Check if player is in enemy's field of view
 */
function isPlayerInFOV(enemyPos, playerPos, facingAngle) {
  const toPlayerX = playerPos[0] - enemyPos[0];
  const toPlayerZ = playerPos[2] - enemyPos[2];
  
  const angleToPlayer = Math.atan2(toPlayerZ, toPlayerX);
  
  let angleDiff = angleToPlayer - facingAngle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  return Math.abs(angleDiff) <= FOV_ANGLE / 2;
}

/**
 * Check if enemy has a status effect
 */
function hasStatusEffect(enemy, effectType) {
  return enemy.statusEffects?.some(effect => effect.type === effectType) || false;
}

/**
 * Get status effect of specific type
 */
function getStatusEffect(enemy, effectType) {
  return enemy.statusEffects?.find(effect => effect.type === effectType);
}

/**
 * Update status effects (remove expired ones)
 */
function updateStatusEffects(enemy, now) {
  if (!enemy.statusEffects || enemy.statusEffects.length === 0) return;
  
  enemy.statusEffects = enemy.statusEffects.filter(effect => {
    if (effect.duration) {
      return (now - effect.appliedAt) < effect.duration;
    }
    return true; // Effects without duration don't expire
  });
}

/**
 * Process poison damage
 */
function processPoisonDamage(enemy, now) {
  const poisonEffect = getStatusEffect(enemy, 'poison');
  if (!poisonEffect) return 0;
  
  const tickRate = poisonEffect.tickRate || 1000;
  const lastTick = enemy.lastPoisonTick || 0;
  
  if (now - lastTick >= tickRate) {
    enemy.lastPoisonTick = now;
    const tickDamage = poisonEffect.tickDamage || 5;
    return tickDamage;
  }
  
  return 0;
}

/**
 * Process enemy AI and movement for a single enemy
 * @param {Object} enemy - Enemy state
 * @param {number} delta - Time delta in seconds (for frame-based updates)
 * @param {Array} playersInZone - Array of player data in the zone
 * @returns {Object} Updated enemy state and actions
 */
export function processEnemyAI(enemy, delta, playersInZone) {
  if (!enemy.alive) return null;
  
  const now = Date.now();
  
  // Update status effects
  updateStatusEffects(enemy, now);
  
  // Check for freeze effect
  const isFrozen = hasStatusEffect(enemy, 'freeze');
  
  // Check for slow effect
  const slowEffect = getStatusEffect(enemy, 'slow');
  const slowMultiplier = slowEffect ? (1 - (slowEffect.slowPercent || 50) / 100) : 1;
  
  // Process poison damage
  const poisonDamage = processPoisonDamage(enemy, now);
  if (poisonDamage > 0) {
    enemy.health = Math.max(0, enemy.health - poisonDamage);
    enemy.alive = enemy.health > 0;
  }
  
  // If frozen, skip movement and actions
  if (isFrozen) {
    enemy.currentAnimation = 'idle';
    return {
      enemy,
      action: null,
      damageDealt: null
    };
  }
  
  // Find nearest player in detection range
  let nearestPlayer = null;
  let minDistance = Infinity;
  
  for (const player of playersInZone) {
    // Get player's actual position
    const playerPosition = player.position;
    
    if (!playerPosition || !Array.isArray(playerPosition) || playerPosition.length < 3) continue;
    
    const distance = Math.sqrt(
      Math.pow(enemy.position[0] - playerPosition[0], 2) +
      Math.pow(enemy.position[2] - playerPosition[2], 2)
    );
    
    if (distance < minDistance && distance <= DETECTION_RANGE) {
      // Check if player is in FOV
      if (isPlayerInFOV(enemy.position, playerPosition, enemy.facingAngle)) {
        nearestPlayer = { ...player, position: playerPosition, distance };
        minDistance = distance;
      }
    }
  }
  
  enemy.playerVisible = !!nearestPlayer;
  let action = null;
  let damageDealt = null;
  
  if (nearestPlayer) {
    // Player detected - react
    const distanceToPlayer = nearestPlayer.distance;
    const playerPos = nearestPlayer.position;
    
    if (distanceToPlayer <= ATTACK_RANGE) {
      // In melee range - attack
      const angleToPlayer = Math.atan2(
        playerPos[2] - enemy.position[2],
        playerPos[0] - enemy.position[0]
      );
      enemy.facingAngle = angleToPlayer;
      
      if (now - enemy.lastAttack >= enemy.attackCooldown) {
        const damage = Math.max(1, enemy.attack - 5);
        action = 'attack';
        damageDealt = {
          targetId: nearestPlayer.playerId || nearestPlayer.socketId,
          damage,
          type: 'melee'
        };
        enemy.lastAttack = now;
        enemy.currentAnimation = 'attack';
      } else {
        enemy.currentAnimation = 'idle';
      }
    } else if (distanceToPlayer <= MAGIC_RANGE && enemy.magicTypes.length > 0) {
      // In magic range - cast
      const angleToPlayer = Math.atan2(
        playerPos[2] - enemy.position[2],
        playerPos[0] - enemy.position[0]
      );
      enemy.facingAngle = angleToPlayer;
      
      if (now - enemy.lastAttack >= enemy.attackCooldown) {
        const magicDamage = Math.max(1, enemy.attack + 5);
        action = 'cast';
        damageDealt = {
          targetId: nearestPlayer.playerId || nearestPlayer.socketId,
          damage: magicDamage,
          type: 'magic'
        };
        enemy.lastAttack = now;
        enemy.currentAnimation = 'cast';
      } else {
        enemy.currentAnimation = 'idle';
      }
    } else {
      // Move towards player (chasing)
      const directionX = playerPos[0] - enemy.position[0];
      const directionZ = playerPos[2] - enemy.position[2];
      const magnitude = Math.sqrt(directionX * directionX + directionZ * directionZ);
      
      if (magnitude > 0) {
        enemy.facingAngle = Math.atan2(directionZ, directionX);
        
        const normalizedX = directionX / magnitude;
        const normalizedZ = directionZ / magnitude;
        
        const movementSpeed = getMovementSpeed(enemy.type);
        const moveX = normalizedX * movementSpeed * slowMultiplier * delta;
        const moveZ = normalizedZ * movementSpeed * slowMultiplier * delta;
        
        enemy.position[0] += moveX;
        enemy.position[2] += moveZ;
        enemy.currentAnimation = 'walk';
      } else {
        enemy.currentAnimation = 'idle';
      }
    }
  } else {
    // Player not detected - wander
    if (now >= enemy.wanderDirection.changeTime) {
      enemy.wanderDirection = {
        x: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
        changeTime: now + Math.random() * 3000 + 2000
      };
    }
    
    const magnitude = Math.sqrt(
      enemy.wanderDirection.x * enemy.wanderDirection.x +
      enemy.wanderDirection.z * enemy.wanderDirection.z
    );
    
    if (magnitude > 0) {
      const normalizedX = enemy.wanderDirection.x / magnitude;
      const normalizedZ = enemy.wanderDirection.z / magnitude;
      
      enemy.facingAngle = Math.atan2(normalizedZ, normalizedX);
      
      const movementSpeed = getMovementSpeed(enemy.type);
      const wanderSpeed = movementSpeed * 0.4;
      const moveX = normalizedX * wanderSpeed * slowMultiplier * delta;
      const moveZ = normalizedZ * wanderSpeed * slowMultiplier * delta;
      
      enemy.position[0] += moveX;
      enemy.position[2] += moveZ;
      enemy.currentAnimation = 'walk';
    } else {
      enemy.currentAnimation = 'idle';
    }
  }
  
  // Detect actual movement
  const movementThreshold = 0.001;
  const positionChanged = Math.abs(enemy.position[0] - enemy.lastPosition[0]) > movementThreshold ||
                         Math.abs(enemy.position[2] - enemy.lastPosition[2]) > movementThreshold;
  
  enemy.isMoving = positionChanged;
  enemy.lastPosition = [...enemy.position];
  
  return {
    enemy,
    action,
    damageDealt
  };
}

/**
 * Process all enemies in a zone
 * @param {number} zoneId - Zone ID
 * @param {number} delta - Time delta in seconds
 */
export function processEnemiesInZone(zoneId, delta) {
  const zoneEnemies = getEnemiesInZone(zoneId);
  if (zoneEnemies.length === 0) return [];
  
  // Get all players in the zone
  const zonePlayerData = zoneService.getPlayersInZone(zoneId);
  const playersInGameSession = getAllPlayersInGameSession();
  
  // Combine zone player data with game session data
  const playersInZone = [];
  for (const zonePlayer of zonePlayerData) {
    const gameSessionPlayer = playersInGameSession.find(p => p.playerId === zonePlayer.playerId);
    if (gameSessionPlayer) {
      // Use game session position if available, otherwise use zone position
      playersInZone.push({
        playerId: zonePlayer.playerId,
        socketId: gameSessionPlayer.socketId,
        position: gameSessionPlayer.position || zonePlayer.position,
        name: gameSessionPlayer.name
      });
    } else {
      // Fallback to zone position if not in game session
      playersInZone.push({
        playerId: zonePlayer.playerId,
        position: zonePlayer.position,
        name: `Player ${zonePlayer.playerId}`
      });
    }
  }
  
  const results = [];
  
  for (const enemy of zoneEnemies) {
    const result = processEnemyAI(enemy, delta, playersInZone);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}

