import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getPlayerById } from '../services/playerService.js';
import { getActiveHeroForPlayer } from '../services/playerService.js';
import {
  validateSpellCast,
  executeSpellCast,
  initializeCombatInstance,
  initializePlayerCombatState,
  processCombatTick,
  checkCombatConditions,
  endCombatInstance,
  getCombatInstance,
  getPlayerCombatState,
  updatePlayerPosition
} from '../services/combatService.js';
import {
  getPlayerInGameSession,
  updatePlayerPositionInGameSession
} from '../services/multiplayerService.js';
import { getSpellForCombat } from '../services/spellService.js';
import { enterCombat, leaveCombat } from '../services/regenerationService.js';

// Global shared combat instance for PvP (for testing - in production use matchmaking)
let globalCombatInstanceId = null;

// Global combat tick system that processes all active combat instances
let globalCombatTick = null;
const activeCombatInstances = new Set();

/**
 * Start global combat tick system
 */
function startGlobalCombatTick(io) {
  if (globalCombatTick) return; // Already running
  
  console.log('[combat] Starting global combat tick system');
  globalCombatTick = setInterval(() => {
    activeCombatInstances.forEach(combatInstanceId => {
      try {
        const combatInstance = getCombatInstance(combatInstanceId);
        if (!combatInstance || !combatInstance.state.active) {
          activeCombatInstances.delete(combatInstanceId);
          return;
        }
        
        // Process combat tick
        processCombatTick(combatInstanceId);
        
        // Check win/loss conditions
        const conditions = checkCombatConditions(combatInstanceId);
        if (conditions.ended) {
          console.log(`[combat] Combat ${combatInstanceId} ended:`, conditions);
          const playerResults = endCombatInstance(combatInstanceId, conditions.result);
          
          // Mark all players as leaving combat (enables regeneration)
          if (combatInstance?.participants?.players) {
            combatInstance.participants.players.forEach(pid => leaveCombat(pid));
          }
          
          // Broadcast combat ended
          io.to(`combat:${combatInstanceId}`).emit('combat:ended', {
            result: conditions.result,
            winners: conditions.winners,
            losers: conditions.losers,
            isMatchmaking: combatInstance.isMatchmaking || false
          });
          
          // Broadcast level-ups to individual players
          Object.entries(playerResults).forEach(([playerId, result]) => {
            if (result.leveledUp) {
              const playerSockets = Object.entries(io.sockets.sockets)
                .filter(([_, s]) => getPlayerIdBySocket(s.id) === Number(playerId))
                .map(([_, s]) => s);
              
              playerSockets.forEach(s => {
                s.emit('hero:level-up', {
                  oldLevel: result.oldLevel,
                  newLevel: result.newLevel,
                  newStats: result.newStats
                });
              });
            }
          });
          
          // Remove from active combats
          activeCombatInstances.delete(combatInstanceId);
          console.log(`[combat] Combat instance ${combatInstanceId} removed from active list`);
        }
      } catch (error) {
        console.error(`[combat] Error processing combat tick for ${combatInstanceId}:`, error);
      }
    });
  }, 1000); // Process every second
}

/**
 * Register a combat instance for global tick processing
 */
export function registerCombatInstance(combatInstanceId) {
  activeCombatInstances.add(combatInstanceId);
  console.log(`[combat] Registered combat instance ${combatInstanceId} for tick processing`);
}

/**
 * Register combat socket handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server instance
 */
export function registerCombatHandlers(socket, io) {
  // Start global tick system if not already running
  startGlobalCombatTick(io);
  const playerId = getPlayerIdBySocket(socket.id);
  if (!playerId) {
    return; // Player not authenticated
  }

  // Get player's active hero and stats
  const player = getPlayerById(playerId);
  const activeHero = getActiveHeroForPlayer(playerId);

  // Initialize combat state when player joins (if not already in combat)
  let combatInstanceId = null;
  let combatTickInterval = null;

  /**
   * Join combat instance
   */
  socket.on('combat:join', async (data) => {
    try {
      // For testing: use a single global combat instance so all players fight each other
      // Check if global instance exists and is active
      if (globalCombatInstanceId) {
        const instance = getCombatInstance(globalCombatInstanceId);
        if (instance && instance.state.active) {
          combatInstanceId = globalCombatInstanceId;
          
          // Add this player to the existing instance
          instance.participants.players = instance.participants.players || [];
          const alreadyParticipant = instance.participants.players.includes(playerId);
          if (!alreadyParticipant) {
            instance.participants.players.push(playerId);
            
            const playerSession = getPlayerInGameSession(socket.id);
            const initialPosition = playerSession?.position || [0, 0, 0];
            const stats = activeHero ? {
              health: Math.min(activeHero.health || activeHero.maxHealth || 100, activeHero.maxHealth || 100), // Load from DB, clamped
              maxHealth: activeHero.maxHealth || 100,
              power: Math.min(activeHero.power || 100, activeHero.maxPower || 100),
              maxPower: activeHero.maxPower || 100,
              attack: activeHero.attack || 15,
              defense: activeHero.defense || 5,
              position: initialPosition
            } : { position: initialPosition };
            initializePlayerCombatState(playerId, combatInstanceId, stats);
          }
        } else {
          globalCombatInstanceId = null; // Reset if instance is gone
        }
      }
      
      // If no global instance, create one
      if (!combatInstanceId) {
        combatInstanceId = initializeCombatInstance(
          'pvp',
          {
            players: [playerId],
            enemies: data.enemyIds || []
          },
          {
            center: data.zoneCenter || [0, 0, 0],
            radius: data.zoneRadius || 100
          }
        );
        globalCombatInstanceId = combatInstanceId;
        
        // Register with global tick system
        registerCombatInstance(combatInstanceId);

        // Initialize player state
        const playerSession = getPlayerInGameSession(socket.id);
        const initialPosition = playerSession?.position || [0, 0, 0];
        
        const playerStats = activeHero ? {
          health: Math.min(activeHero.health || activeHero.maxHealth || 100, activeHero.maxHealth || 100), // Load from DB, clamped
          maxHealth: activeHero.maxHealth || 100,
          power: Math.min(activeHero.power || 100, activeHero.maxPower || 100),
          maxPower: activeHero.maxPower || 100,
          attack: activeHero.attack || 15,
          defense: activeHero.defense || 5,
          position: initialPosition // Initialize with current position
        } : {
          position: initialPosition
        };

        initializePlayerCombatState(playerId, combatInstanceId, playerStats);
      }

      // Mark player as entering combat (stops regeneration)
      enterCombat(playerId);

      // Join socket room for combat instance
      socket.join(`combat:${combatInstanceId}`);

      // Start combat tick processing
      if (!combatTickInterval) {
        combatTickInterval = setInterval(() => {
          if (combatInstanceId) {
            processCombatTick(combatInstanceId);
            
            // Check win/loss conditions
            const conditions = checkCombatConditions(combatInstanceId);
            if (conditions.ended) {
              const playerResults = endCombatInstance(combatInstanceId, conditions.result);
              
              // Mark all players as leaving combat (enables regeneration)
              const combatInstance = getCombatInstance(combatInstanceId);
              if (combatInstance?.participants?.players) {
                combatInstance.participants.players.forEach(pid => leaveCombat(pid));
              }
              
              // Broadcast combat ended
              io.to(`combat:${combatInstanceId}`).emit('combat:ended', {
                result: conditions.result,
                winners: conditions.winners,
                losers: conditions.losers,
                isMatchmaking: combatInstance.isMatchmaking || false
              });
              
              // Broadcast level-ups to individual players
              Object.entries(playerResults).forEach(([playerId, result]) => {
                if (result.leveledUp) {
                  const playerSockets = Object.entries(io.sockets.sockets)
                    .filter(([_, s]) => getPlayerIdBySocket(s.id) === Number(playerId))
                    .map(([_, s]) => s);
                  
                  playerSockets.forEach(s => {
                    s.emit('hero:level-up', {
                      oldLevel: result.oldLevel,
                      newLevel: result.newLevel,
                      experienceGained: result.experienceGained
                    });
                  });
                }
              });
              
              if (combatTickInterval) {
                clearInterval(combatTickInterval);
                combatTickInterval = null;
              }
            }
            
            // Broadcast combat state update
            broadcastCombatState(io, combatInstanceId);
          }
        }, 100); // 10 ticks per second
      }

      // Send initial combat state
      socket.emit('combat:joined', {
        combatInstanceId,
        combatState: getCombatState(combatInstanceId)
      });

      console.log(`[combat] Player ${playerId} (${getPlayerById(playerId)?.name || 'unknown'}) joined combat instance: ${combatInstanceId}`);

      // Notify other players in combat
      socket.to(`combat:${combatInstanceId}`).emit('combat:player-joined', {
        playerId,
        combatInstanceId
      });
    } catch (error) {
      console.error('Error joining combat:', error);
      socket.emit('combat:error', { message: 'Failed to join combat' });
    }
  });

  /**
   * Cast spell
   */
  socket.on('combat:cast-spell', (data, ack) => {
    try {
      const { spellKey, targetPosition } = data;

      console.log('[combat:cast-spell] Received:', { spellKey, targetPosition, playerId });

      if (!combatInstanceId) {
        console.log('[combat:cast-spell] No combat instance');
        socket.emit('combat:error', { message: 'Not in active combat' });
        if (typeof ack === 'function') ack({ ok: false, error: 'Not in active combat' });
        return;
      }

      // Re-fetch active hero to ensure we have latest data
      const currentActiveHero = getActiveHeroForPlayer(playerId);
      // console.log('[combat:cast-spell] Active hero:', {
      //   hasHero: !!currentActiveHero,
      //   heroLevel: currentActiveHero?.level,
      //   spellCount: currentActiveHero?.spells?.length,
      //   spellKeys: currentActiveHero?.spells?.map(s => s.key)
      // });

      // Get spell definition from database
      const heroSpell = currentActiveHero?.spells?.find(s => s.key === spellKey);
      if (!heroSpell) {
        console.log('[combat:cast-spell] Spell not in hero list:', spellKey);
        socket.emit('combat:error', { message: 'Spell not available to this hero' });
        if (typeof ack === 'function') ack({ ok: false, error: 'Spell not available to this hero' });
        return;
      }
      
      const heroLevel = currentActiveHero?.level || 1;
      const spell = getSpellForCombat(spellKey, heroLevel);
      if (!spell) {
        console.log('[combat:cast-spell] Spell definition not found in database:', spellKey);
        socket.emit('combat:error', { message: 'Spell definition not found' });
        if (typeof ack === 'function') ack({ ok: false, error: 'Spell definition not found' });
        return;
      }
      
      console.log('[combat:cast-spell] Spell stats:', {
        name: spell.name,
        damage: spell.damage,
        powerCost: spell.powerCost,
        range: spell.range,
        affectRange: spell.affectRange
      });

      // Get player position
      const playerSession = getPlayerInGameSession(socket.id);
      const playerPosition = playerSession?.position || [0, 0, 0];

      // Get player combat state for position
      const playerState = getPlayerCombatState(playerId);
      const combatPosition = playerState?.position || playerPosition;
      
      // console.log('[combat:cast-spell] Positions:', {
      //   playerPosition,
      //   combatPosition,
      //   targetPosition
      // });

      // Validate spell cast
      const validation = validateSpellCast(
        playerId,
        spellKey,
        targetPosition,
        combatPosition,
        spell
      );

      if (!validation.success) {
        socket.emit('combat:error', { message: validation.error });
        if (typeof ack === 'function') ack({ ok: false, error: validation.error });
        return;
      }

      // Execute spell cast
      const result = executeSpellCast(
        playerId,
        spellKey,
        targetPosition,
        combatPosition,
        spell
      );

      if (!result.success) {
        socket.emit('combat:error', { message: result.error || 'Failed to cast spell' });
        if (typeof ack === 'function') ack({ ok: false, error: result.error || 'Failed to cast spell' });
        return;
      }

      // Log attack summary for visibility (attacker -> target names with +/- damage/heal and remaining HP when available)
      try {
        const attackerName = (getPlayerById(playerId)?.name) || `player:${playerId}`;
        const targetsSummary = Array.isArray(result.affectedTargets)
          ? result.affectedTargets.map(t => {
              const targetId = (t && (t.targetId ?? t.id ?? t.playerId)) ?? 'unknown';
              const isPlayer = t && t.targetType === 'player';
              const name = isPlayer ? (getPlayerById(targetId)?.name || `player:${targetId}`) : `enemy:${targetId}`;
              const hasHeal = typeof t.heal === 'number' && t.heal > 0;
              const hasDmg = typeof t.damage === 'number' && t.damage > 0;
              const signPart = hasHeal ? `+${t.heal}` : (hasDmg ? `-${t.damage}` : '0');
              let hpPart = '';
              if (isPlayer) {
                const targetState = getPlayerCombatState(targetId);
                if (targetState && typeof targetState.health === 'number') {
                  hpPart = ` (${targetState.health}/${targetState.maxHealth || '?'})`;
                }
              }
              return `${name} ${signPart}${hpPart}`;
            }).join(', ')
          : 'no targets in range';
        console.log(`[combat] ${attackerName} -> ${targetsSummary} using ${spellKey}`);
      } catch (_) {}

      // Broadcast result to all players in combat
      const broadcastData = {
        actorId: playerId,
        actionType: 'spell-cast',
        spellKey,
        targetPosition,
        affectedTargets: result.affectedTargets,
        aoeRadius: spell.affectRange, // include AoE for client VFX sizing
        timestamp: Date.now()
      };
      
      // console.log('[combat:cast-spell] Broadcasting result:', broadcastData);
      io.to(`combat:${combatInstanceId}`).emit('combat:action-resolved', broadcastData);
      // Also emit directly to the caster to ensure delivery
      socket.emit('combat:action-resolved', broadcastData);
      // Acknowledge back to the emitter
      if (typeof ack === 'function') ack({ ok: true, result: broadcastData });

      // If no targets were hit, log AoE radius and distances to other players/enemies for debugging
      try {
        const noHits = !Array.isArray(result.affectedTargets) || result.affectedTargets.length === 0;
        if (noHits) {
          const instance = getCombatInstance(combatInstanceId);
          const aoe = spell.affectRange ?? 0;
          const players = instance?.participants?.players || [];
          const enemies = instance?.participants?.enemies || [];
          const playerDistances = players
            .filter(pid => pid !== playerId)
            .map(pid => {
              const st = getPlayerCombatState(pid);
              const name = getPlayerById(pid)?.name || `player:${pid}`;
              if (!st?.position) return `${name}: pos?`;
              const dx = (targetPosition?.[0] ?? 0) - st.position[0];
              const dz = (targetPosition?.[2] ?? 0) - st.position[2];
              const dist = Math.sqrt(dx * dx + dz * dz);
              return `${name}: ${dist.toFixed(2)}m`; 
            });
          const enemyDistances = enemies.map(eid => {
            const est = getPlayerCombatState(eid); // will be undefined for enemies; just to keep structure consistent
            const name = `enemy:${eid}`;
            // enemy positions are stored in combatService enemy state; expose via getCombatInstance snapshot is not available here
            // so we log unknown when we can't access position directly from this module
            return `${name}: pos?`;
          });
          console.log(`[combat] No targets hit. AoE=${aoe}m. players=${players.length}, enemies=${enemies.length}. Player distances: ${playerDistances.join(', ')}. Enemy distances: ${enemyDistances.join(', ')}`);
        }
      } catch (_) {}

      // Check win/loss conditions after action
      const conditions = checkCombatConditions(combatInstanceId);
      if (conditions.ended) {
        const playerResults = endCombatInstance(combatInstanceId, conditions.result);
        
        // Mark all players as leaving combat (enables regeneration)
        const combatInstance = getCombatInstance(combatInstanceId);
        if (combatInstance?.participants?.players) {
          combatInstance.participants.players.forEach(pid => leaveCombat(pid));
        }
        
        // Broadcast combat ended
        io.to(`combat:${combatInstanceId}`).emit('combat:ended', {
          result: conditions.result,
          winners: conditions.winners,
          losers: conditions.losers,
          isMatchmaking: combatInstance.isMatchmaking || false
        });
        
        // Broadcast level-ups to individual players
        Object.entries(playerResults).forEach(([playerId, result]) => {
          if (result.leveledUp) {
            const playerSockets = Object.entries(io.sockets.sockets)
              .filter(([_, s]) => getPlayerIdBySocket(s.id) === Number(playerId))
              .map(([_, s]) => s);
            
            playerSockets.forEach(s => {
              s.emit('hero:level-up', {
                oldLevel: result.oldLevel,
                newLevel: result.newLevel,
                experienceGained: result.experienceGained
              });
            });
          }
        });
      }
      console.log('Spell cast result:', result);
    } catch (error) {
      console.error('Error casting spell:', error);
      socket.emit('combat:error', { message: 'Failed to cast spell' });
      if (typeof ack === 'function') ack({ ok: false, error: 'Failed to cast spell' });
    }
  });

  /**
   * Update player position in combat
   */
  socket.on('combat:position-update', (data) => {
    if (!combatInstanceId) return;

    const { position } = data;
    if (!Array.isArray(position) || position.length !== 3) return;

    updatePlayerPosition(playerId, position);

    // Broadcast position to other players in combat
    socket.to(`combat:${combatInstanceId}`).emit('combat:position-changed', {
      playerId,
      position,
      timestamp: Date.now()
    });
  });

  /**
   * Leave combat
   */
  socket.on('combat:leave', () => {
    if (combatInstanceId) {
      socket.leave(`combat:${combatInstanceId}`);
      
      socket.to(`combat:${combatInstanceId}`).emit('combat:player-left', {
        playerId,
        combatInstanceId
      });

      // Mark player as leaving combat (enables regeneration)
      leaveCombat(playerId);

      combatInstanceId = null;
    }

    if (combatTickInterval) {
      clearInterval(combatTickInterval);
      combatTickInterval = null;
    }
  });

  /**
   * Request current combat state
   */
  socket.on('combat:state-request', () => {
    if (!combatInstanceId) {
      socket.emit('combat:state', null);
      return;
    }

    socket.emit('combat:state', {
      combatInstanceId,
      combatState: getCombatState(combatInstanceId)
    });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    if (combatInstanceId) {
      socket.to(`combat:${combatInstanceId}`).emit('combat:player-left', {
        playerId,
        combatInstanceId
      });
    }

    if (combatTickInterval) {
      clearInterval(combatTickInterval);
      combatTickInterval = null;
    }
  });
}

/**
 * Get combat state for broadcast
 * @param {string} combatInstanceId - Combat instance ID
 * @returns {Object}
 */
function getCombatState(combatInstanceId) {
  const combatInstance = getCombatInstance(combatInstanceId);
  if (!combatInstance) return null;

  const state = {
    combatInstanceId,
    combatType: combatInstance.combatType,
    participants: {
      players: combatInstance.participants.players?.map(playerId => {
        const playerState = getPlayerCombatState(playerId);
        return playerState ? {
          playerId,
          health: playerState.health,
          maxHealth: playerState.maxHealth,
          power: playerState.power,
          maxPower: playerState.maxPower,
          position: playerState.position,
          statusEffects: playerState.statusEffects || []
        } : null;
      }).filter(Boolean) || [],
      enemies: [] // TODO: Add enemy states
    },
    zone: combatInstance.zone,
    state: combatInstance.state
  };

  return state;
}

/**
 * Broadcast combat state to all players in combat
 * @param {Server} io - Socket.IO server
 * @param {string} combatInstanceId - Combat instance ID
 */
function broadcastCombatState(io, combatInstanceId) {
  const combatState = getCombatState(combatInstanceId);
  if (combatState) {
    io.to(`combat:${combatInstanceId}`).emit('combat:state-update', combatState);
  }
}

