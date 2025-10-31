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

        // Initialize player state
        const playerSession = getPlayerInGameSession(socket.id);
        const initialPosition = playerSession?.position || [0, 0, 0];
        
        const playerStats = activeHero ? {
          health: activeHero.health || 100,
          maxHealth: activeHero.maxHealth || 100,
          power: activeHero.power || 100,
          maxPower: activeHero.maxPower || 100,
          attack: activeHero.attack || 15,
          defense: activeHero.defense || 5,
          position: initialPosition // Initialize with current position
        } : {
          position: initialPosition
        };

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
      console.log('[combat:cast-spell] Active hero:', {
        hasHero: !!currentActiveHero,
        heroLevel: currentActiveHero?.level,
        spellCount: currentActiveHero?.spells?.length,
        spellKeys: currentActiveHero?.spells?.map(s => s.key)
      });

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
      
      console.log('[combat:cast-spell] Positions:', {
        playerPosition,
        combatPosition,
        targetPosition
      });

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
      
      console.log('[combat:cast-spell] Broadcasting result:', broadcastData);
      io.to(`combat:${combatInstanceId}`).emit('combat:action-resolved', broadcastData);
      // Also emit directly to the caster to ensure delivery
      socket.emit('combat:action-resolved', broadcastData);
      // Acknowledge back to the emitter
      if (typeof ack === 'function') ack({ ok: true, result: broadcastData });

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

