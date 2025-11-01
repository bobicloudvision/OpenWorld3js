import { getPlayerIdBySocket } from '../services/sessionService.js';
import * as enemyService from '../services/enemyService.js';
import * as zoneService from '../services/zoneService.js';
import { getPlayerInGameSession, getAllPlayersInGameSession, getSocketIdByPlayerId } from '../services/multiplayerService.js';

/**
 * Register enemy-related socket handlers
 */
export function registerEnemyHandlers(socket, io) {
  /**
   * Get all enemies in player's current zone
   */
  socket.on('enemy:get-zone-enemies', (data, callback) => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      if (callback) callback({ ok: false, error: 'Not authenticated' });
      return;
    }
    
    const zoneId = zoneService.getPlayerZone(playerId);
    if (!zoneId) {
      if (callback) callback({ ok: false, error: 'Player not in a zone' });
      return;
    }
    
    const enemies = enemyService.getEnemiesInZone(zoneId);
    
    if (callback) {
      callback({ 
        ok: true, 
        enemies: enemies.map(e => ({
          id: e.id,
          name: e.name,
          health: e.health,
          maxHealth: e.maxHealth,
          power: e.power,
          maxPower: e.maxPower,
          attack: e.attack,
          defense: e.defense,
          position: e.position,
          alive: e.alive,
          type: e.type,
          magicTypes: e.magicTypes,
          statusEffects: e.statusEffects || [],
          model: e.model,
          modelScale: e.modelScale,
          modelRotation: e.modelRotation,
          facingAngle: e.facingAngle,
          playerVisible: e.playerVisible,
          currentAnimation: e.currentAnimation
        }))
      });
    }
  });
  
  /**
   * Initialize enemies in a zone
   * SECURITY: This should be admin-only or removed entirely in production
   * Currently disabled for security - enemies should be spawned by zone system or admin commands
   */
  socket.on('enemy:initialize', (data, callback) => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      if (callback) callback({ ok: false, error: 'Not authenticated' });
      return;
    }
    
    // SECURITY: Disable this endpoint - enemies should be managed server-side only
    // In production, enemies should be spawned by zone configuration or admin-only commands
    if (callback) {
      callback({ ok: false, error: 'Enemy spawning is disabled for security. Enemies are managed server-side.' });
    }
    
    // If you need this for development, uncomment and add admin check:
    /*
    // TODO: Add admin role check here
    // const player = getPlayerById(playerId);
    // if (!player || !player.is_admin) {
    //   if (callback) callback({ ok: false, error: 'Admin access required' });
    //   return;
    // }
    
    const { zoneId, enemyType, position, count = 1 } = data;
    
    // Validate inputs
    if (!zoneId || typeof zoneId !== 'number') {
      if (callback) callback({ ok: false, error: 'Invalid zoneId' });
      return;
    }
    
    if (!enemyType || typeof enemyType !== 'string') {
      if (callback) callback({ ok: false, error: 'Invalid enemyType' });
      return;
    }
    
    // Validate enemy type exists
    const validEnemyTypes = ['goblin-warrior', 'dark-mage', 'orc-berserker'];
    if (!validEnemyTypes.includes(enemyType)) {
      if (callback) callback({ ok: false, error: 'Invalid enemy type' });
      return;
    }
    
    // Limit count to prevent spam
    const maxCount = 10;
    const safeCount = Math.min(Math.max(1, Math.floor(count || 1)), maxCount);
    
    // Validate position if provided
    if (position && (!Array.isArray(position) || position.length !== 3)) {
      if (callback) callback({ ok: false, error: 'Invalid position format' });
      return;
    }
    
    // Check if player is in the zone they're trying to spawn enemies in
    const playerZone = zoneService.getPlayerZone(playerId);
    if (playerZone !== zoneId) {
      if (callback) callback({ ok: false, error: 'Can only spawn enemies in your current zone' });
      return;
    }
    
    const initializedEnemies = [];
    
    for (let i = 0; i < safeCount; i++) {
      const enemyId = `enemy-${zoneId}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      const spawnPosition = position || [
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 20
      ];
      
      const enemy = enemyService.initializeEnemy(enemyId, enemyType, zoneId, spawnPosition);
      initializedEnemies.push({
        id: enemy.id,
        name: enemy.name,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        position: enemy.position,
        type: enemy.type
      });
    }
    
    // Broadcast to all players in the zone
    const playersInZone = zoneService.getPlayersInZone(zoneId);
    playersInZone.forEach(playerData => {
      const socketId = getPlayerInGameSession(playerData.playerId)?.socketId;
      if (socketId) {
        io.to(socketId).emit('enemy:spawned', {
          enemies: initializedEnemies
        });
      }
    });
    
    if (callback) {
      callback({ ok: true, enemies: initializedEnemies });
    }
    */
  });
}

/**
 * Start the enemy AI game loop
 * Processes enemy AI and broadcasts updates to clients
 */
let enemyGameLoop = null;
const TICK_RATE = 60; // 60 FPS
const TICK_INTERVAL = 1000 / TICK_RATE;

export function startEnemyGameLoop(io) {
  if (enemyGameLoop) {
    console.log('[enemy] Game loop already running');
    return;
  }
  
  let lastTime = Date.now();
  
  enemyGameLoop = setInterval(() => {
    const now = Date.now();
    const delta = (now - lastTime) / 1000; // Delta in seconds
    lastTime = now;
    
    // Get all active zones
    const zoneStats = zoneService.getAllZoneStats();
    
    // Process enemies in each zone
    for (const zoneId of Object.keys(zoneStats)) {
      const zoneIdNum = parseInt(zoneId);
      const results = enemyService.processEnemiesInZone(zoneIdNum, delta);
      
      if (results.length === 0) continue;
      
      // Group updates by zone for broadcasting
      const enemyUpdates = {};
      const enemyActions = [];
      
      for (const result of results) {
        const { enemy, action, damageDealt } = result;
        
        // Store enemy state update
        enemyUpdates[enemy.id] = {
          id: enemy.id,
          position: enemy.position,
          health: enemy.health,
          maxHealth: enemy.maxHealth,
          power: enemy.power,
          maxPower: enemy.maxPower,
          statusEffects: enemy.statusEffects || [],
          facingAngle: enemy.facingAngle,
          playerVisible: enemy.playerVisible,
          currentAnimation: enemy.currentAnimation,
          alive: enemy.alive
        };
        
        // Handle enemy actions (attacks)
        if (action && damageDealt) {
          enemyActions.push({
            enemyId: enemy.id,
            action,
            damageDealt
          });
          
          // Emit damage to target player
          const targetSocketId = getSocketIdByPlayerId(damageDealt.targetId);
          if (targetSocketId) {
            io.to(targetSocketId).emit('enemy:attack', {
              enemyId: enemy.id,
              enemyName: enemy.name,
              damage: damageDealt.damage,
              type: damageDealt.type
            });
          }
        }
      }
      
      // Broadcast enemy updates to all players in the zone
      const playersInZone = zoneService.getPlayersInZone(zoneIdNum);
      playersInZone.forEach(playerData => {
        const socketId = getSocketIdByPlayerId(playerData.playerId);
        if (socketId) {
          io.to(socketId).emit('enemy:state-update', {
            zoneId: zoneIdNum,
            enemies: Object.values(enemyUpdates)
          });
        }
      });
      
      // Remove dead enemies
      for (const result of results) {
        if (!result.enemy.alive) {
          enemyService.removeEnemy(result.enemy.id);
          
          // Broadcast enemy death
          playersInZone.forEach(playerData => {
            const socketId = getSocketIdByPlayerId(playerData.playerId);
            if (socketId) {
              io.to(socketId).emit('enemy:destroyed', {
                enemyId: result.enemy.id
              });
            }
          });
        }
      }
    }
  }, TICK_INTERVAL);
  
  console.log(`[enemy] Started enemy AI game loop at ${TICK_RATE} FPS`);
}

/**
 * Stop the enemy game loop
 */
export function stopEnemyGameLoop() {
  if (enemyGameLoop) {
    clearInterval(enemyGameLoop);
    enemyGameLoop = null;
    console.log('[enemy] Stopped enemy AI game loop');
  }
}

