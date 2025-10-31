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

/**
 * Register combat socket handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server instance
 */
export function registerCombatHandlers(socket, io) {
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
      // Get or create combat instance
      if (data.combatInstanceId) {
        const instance = getCombatInstance(data.combatInstanceId);
        if (!instance || !instance.state.active) {
          socket.emit('combat:error', { message: 'Combat instance not found or inactive' });
          return;
        }
        combatInstanceId = data.combatInstanceId;
      } else {
        // Create new combat instance (PvE for now)
        combatInstanceId = initializeCombatInstance(
          'pve',
          {
            players: [playerId],
            enemies: data.enemyIds || []
          },
          {
            center: data.zoneCenter || [0, 0, 0],
            radius: data.zoneRadius || 100
          }
        );

        // Initialize player state
        const playerStats = activeHero ? {
          health: activeHero.health || 100,
          maxHealth: activeHero.maxHealth || 100,
          power: activeHero.power || 100,
          maxPower: activeHero.maxPower || 100,
          attack: activeHero.attack || 15,
          defense: activeHero.defense || 5
        } : {};

        initializePlayerCombatState(playerId, combatInstanceId, playerStats);
      }

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
              endCombatInstance(combatInstanceId, conditions.result);
              io.to(`combat:${combatInstanceId}`).emit('combat:ended', {
                result: conditions.result,
                winners: conditions.winners,
                losers: conditions.losers
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
  socket.on('combat:cast-spell', (data) => {
    try {
      const { spellKey, targetPosition } = data;

      if (!combatInstanceId) {
        socket.emit('combat:error', { message: 'Not in active combat' });
        return;
      }

      // Get spell definition from database
      // First check if spell exists in hero's spell list
      const heroSpell = activeHero?.spells?.find(s => s.key === spellKey);
      if (!heroSpell) {
        socket.emit('combat:error', { message: 'Spell not available to this hero' });
        return;
      }
      
      // Get scaled spell stats for hero's level
      const heroLevel = activeHero?.level || 1;
      const spell = getSpellForCombat(spellKey, heroLevel);
      if (!spell) {
        socket.emit('combat:error', { message: 'Spell definition not found' });
        return;
      }

      // Get player position
      const playerSession = getPlayerInGameSession(socket.id);
      const playerPosition = playerSession?.position || [0, 0, 0];

      // Get player combat state for position
      const playerState = getPlayerCombatState(playerId);
      const combatPosition = playerState?.position || playerPosition;

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
        return;
      }

      // Broadcast result to all players in combat
      io.to(`combat:${combatInstanceId}`).emit('combat:action-resolved', {
        actorId: playerId,
        actionType: 'spell-cast',
        spellKey,
        targetPosition,
        affectedTargets: result.affectedTargets,
        timestamp: Date.now()
      });

      // Check win/loss conditions after action
      const conditions = checkCombatConditions(combatInstanceId);
      if (conditions.ended) {
        endCombatInstance(combatInstanceId, conditions.result);
        io.to(`combat:${combatInstanceId}`).emit('combat:ended', {
          result: conditions.result,
          winners: conditions.winners,
          losers: conditions.losers
        });
      }
    } catch (error) {
      console.error('Error casting spell:', error);
      socket.emit('combat:error', { message: 'Failed to cast spell' });
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

