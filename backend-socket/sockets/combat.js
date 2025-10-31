import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getPlayerById } from '../services/playerService.js';
import { getActiveHeroForPlayer } from '../services/playerService.js';
import {
  validateSpellCast,
  executeSpellCast,
  processCombatTick,
  checkCombatConditions,
  endCombatInstance,
  getCombatInstance,
  getPlayerCombatState,
  updatePlayerPosition,
  markPlayerDisconnected,
  markPlayerReconnected,
  getActiveCombatForPlayer
} from '../services/combatService.js';
import {
  getPlayerInGameSession
} from '../services/multiplayerService.js';
import { getSpellForCombat } from '../services/spellService.js';
import { leaveCombat } from '../services/regenerationService.js';

// Global combat tick system that processes all active combat instances (matchmaking only)
let globalCombatTick = null;
const activeCombatInstances = new Set();

// Store combat instance IDs per socket (persists across handler re-registrations)
const socketCombatInstances = new Map(); // socketId -> combatInstanceId

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
        
        // Broadcast combat state update
        broadcastCombatState(io, combatInstanceId);
        
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
            winners: conditions.winners || [],
            losers: conditions.losers || [],
            isMatchmaking: combatInstance.isMatchmaking || false,
            abandoned: conditions.result === 'abandoned'
          });
          
          // Broadcast level-ups to individual players
          Object.entries(playerResults).forEach(([playerId, result]) => {
            const playerSockets = Object.entries(io.sockets.sockets)
              .filter(([_, s]) => getPlayerIdBySocket(s.id) === Number(playerId))
              .map(([_, s]) => s);
            
            playerSockets.forEach(s => {
              // Emit player level-up (account-wide)
              if (result.playerLeveledUp) {
                s.emit('player:level-up', {
                  oldLevel: result.playerOldLevel,
                  newLevel: result.playerNewLevel,
                  experienceGained: result.experienceGained
                });
              }
              
              // Emit hero level-up (hero-specific)
              if (result.heroLeveledUp) {
                s.emit('hero:level-up', {
                  oldLevel: result.heroOldLevel,
                  newLevel: result.heroNewLevel,
                  experienceGained: result.experienceGained
                });
              }
            });
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
 * Register combat socket handlers (Matchmaking Combat Only)
 * These handlers support matchmaking-initiated combat.
 * World/manual combat has been removed.
 * 
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

  console.log(`[combat] 🔧 Registering combat handlers for socket ${socket.id}, player ${playerId}`);

  /**
   * Check if player has active combat (for reconnect/refresh)
   */
  socket.on('combat:check-active', (ack) => {
    try {
      const activeCombat = getActiveCombatForPlayer(playerId);
      
      if (activeCombat) {
        console.log(`[combat] Player ${playerId} has active combat: ${activeCombat.combatInstanceId}`);
        if (typeof ack === 'function') {
          ack({ 
            ok: true, 
            hasActiveCombat: true,
            combat: activeCombat
          });
        }
      } else {
        console.log(`[combat] Player ${playerId} has no active combat`);
        if (typeof ack === 'function') {
          ack({ 
            ok: true, 
            hasActiveCombat: false,
            combat: null
          });
        }
      }
    } catch (error) {
      console.error('[combat] Error checking active combat:', error);
      if (typeof ack === 'function') {
        ack({ ok: false, error: error.message });
      }
    }
  });

  /**
   * Decline/Abandon active combat (when player chooses not to rejoin)
   */
  socket.on('combat:decline-rejoin', (ack) => {
    try {
      const activeCombat = getActiveCombatForPlayer(playerId);
      
      if (!activeCombat) {
        console.log(`[combat] Player ${playerId} tried to decline but has no active combat`);
        if (typeof ack === 'function') {
          ack({ ok: true, message: 'No active combat to decline' });
        }
        return;
      }

      const combatInstanceId = activeCombat.combatInstanceId;
      console.log(`[combat] 🚫 Player ${playerId} declined to rejoin combat ${combatInstanceId}`);
      
      // Mark player as disconnected (starts/continues abandon timer)
      markPlayerDisconnected(playerId);
      
      // Mark player as leaving combat (enables regeneration)
      leaveCombat(playerId);
      
      // Remove from socket combat tracking
      socketCombatInstances.delete(socket.id);
      
      if (typeof ack === 'function') {
        ack({ 
          ok: true, 
          message: 'Combat declined, marked as disconnected' 
        });
      }
    } catch (error) {
      console.error('[combat] Error declining combat:', error);
      if (typeof ack === 'function') {
        ack({ ok: false, error: error.message });
      }
    }
  });

  // Get combat instance ID from Map (persists across re-registrations)
  const getCombatInstanceId = () => {
    const id = socketCombatInstances.get(socket.id);
    // console.log(`[combat] getCombatInstanceId for socket ${socket.id}:`, id, 'Map size:', socketCombatInstances.size);
    return id;
  };
  const setCombatInstanceId = (id) => {
    socketCombatInstances.set(socket.id, id);
    console.log(`[combat] Map after set:`, Array.from(socketCombatInstances.entries()));
  };
  const clearCombatInstanceId = () => {
    console.log(`[combat] 🗑️ CLEARING combatInstanceId for socket ${socket.id}`);
    console.trace('[combat] Clear called from:');
    socketCombatInstances.delete(socket.id);
  };

  /**
   * Join matchmaking combat instance
   * Used when a player is placed in a matchmaking battle
   */
  socket.on('combat:join-matchmaking', (data, ack) => {
    console.log(`[combat] 🎯 combat:join-matchmaking handler called for player ${playerId}`);
    console.log(`[combat] Received combat:join-matchmaking from player ${playerId}:`, data);
    try {
      const { combatInstanceId: instanceId } = data;
      
      if (!instanceId) {
        const error = 'Combat instance ID required';
        console.error('[combat] ❌ Missing combatInstanceId in data:', data);
        socket.emit('combat:error', { message: error });
        if (typeof ack === 'function') ack({ ok: false, error });
        return;
      }

      // Verify combat instance exists
      const instance = getCombatInstance(instanceId);
      if (!instance || !instance.state.active) {
        const error = 'Combat instance not found or inactive';
        console.error(`[combat] ❌ Instance check failed for ${instanceId}:`, { 
          exists: !!instance, 
          active: instance?.state?.active,
          instanceId 
        });
        socket.emit('combat:error', { message: error });
        if (typeof ack === 'function') ack({ ok: false, error });
        return;
      }

      // Verify player is a participant
      const isParticipant = instance.participants.players?.includes(playerId);
      if (!isParticipant) {
        const error = 'Player not a participant in this combat';
        console.error(`[combat] ❌ Player ${playerId} not a participant in ${instanceId}. Participants:`, instance.participants.players);
        socket.emit('combat:error', { message: error });
        if (typeof ack === 'function') ack({ ok: false, error });
        return;
      }

      // Set combat instance for this socket
      setCombatInstanceId(instanceId);
      console.log(`[combat] Set combatInstanceId for socket ${socket.id} to:`, instanceId);

      // Join socket room for combat instance
      socket.join(`combat:${instanceId}`);

      // Mark player as reconnected (cancels abandon timer if running)
      markPlayerReconnected(playerId);

      // Send initial combat state
      socket.emit('combat:joined', {
        combatInstanceId: instanceId,
        combatState: getCombatState(instanceId)
      });

      console.log(`[combat] ✅ Player ${playerId} successfully joined matchmaking combat: ${instanceId}`);

      // Notify other players in combat
      socket.to(`combat:${instanceId}`).emit('combat:player-joined', {
        playerId,
        combatInstanceId: instanceId
      });

      if (typeof ack === 'function') ack({ ok: true, combatInstanceId: instanceId });
    } catch (error) {
      console.error('[combat] Error joining matchmaking combat:', error);
      socket.emit('combat:error', { message: 'Failed to join matchmaking combat' });
      if (typeof ack === 'function') ack({ ok: false, error: error.message });
    }
  });

  /**
   * Cast spell
   */
  socket.on('combat:cast-spell', (data, ack) => {
    try {
      const { spellKey, targetPosition } = data;

      const combatInstanceId = getCombatInstanceId();
      console.log('[combat:cast-spell] Received:', { spellKey, targetPosition, playerId });
      console.log('[combat:cast-spell] Current combatInstanceId:', combatInstanceId);

      if (!combatInstanceId) {
        console.error('[combat:cast-spell] ❌ No combat instance set for this socket');
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
          winners: conditions.winners || [],
          losers: conditions.losers || [],
          isMatchmaking: combatInstance.isMatchmaking || false,
          abandoned: conditions.result === 'abandoned'
        });
        
        // Broadcast level-ups to individual players
        Object.entries(playerResults).forEach(([playerId, result]) => {
          const playerSockets = Object.entries(io.sockets.sockets)
            .filter(([_, s]) => getPlayerIdBySocket(s.id) === Number(playerId))
            .map(([_, s]) => s);
          
          playerSockets.forEach(s => {
            // Emit player level-up (account-wide)
            if (result.playerLeveledUp) {
              s.emit('player:level-up', {
                oldLevel: result.playerOldLevel,
                newLevel: result.playerNewLevel,
                experienceGained: result.experienceGained
              });
            }
            
            // Emit hero level-up (hero-specific)
            if (result.heroLeveledUp) {
              s.emit('hero:level-up', {
                oldLevel: result.heroOldLevel,
                newLevel: result.heroNewLevel,
                experienceGained: result.experienceGained
              });
            }
          });
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
    const combatInstanceId = getCombatInstanceId();
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
    console.log(`[combat] ⬅️ combat:leave called for player ${playerId}, socket ${socket.id}`);
    const combatInstanceId = getCombatInstanceId();
    if (combatInstanceId) {
      socket.leave(`combat:${combatInstanceId}`);
      
      // Mark player as disconnected (starts abandon timer if all players leave)
      markPlayerDisconnected(playerId);
      
      socket.to(`combat:${combatInstanceId}`).emit('combat:player-left', {
        playerId,
        combatInstanceId
      });

      // Mark player as leaving combat (enables regeneration)
      leaveCombat(playerId);

      clearCombatInstanceId();
    }
    
    // Note: Combat tick cleanup is handled by global tick system
  });

  /**
   * Request current combat state
   */
  socket.on('combat:state-request', () => {
    const combatInstanceId = getCombatInstanceId();
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
    console.log(`[combat] 🔌 disconnect called for player ${playerId}, socket ${socket.id}`);
    const combatInstanceId = getCombatInstanceId();
    if (combatInstanceId) {
      // Mark player as disconnected (starts abandon timer if all players leave)
      markPlayerDisconnected(playerId);
      
      socket.to(`combat:${combatInstanceId}`).emit('combat:player-left', {
        playerId,
        combatInstanceId
      });
      clearCombatInstanceId();
    }
    
    // Note: Combat tick cleanup is handled by global tick system
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



