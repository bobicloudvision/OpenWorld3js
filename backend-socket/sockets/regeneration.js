/**
 * Regeneration Socket Handlers
 * Handles out-of-combat health/power regeneration and resting
 */

import { getPlayerIdBySocket } from '../services/sessionService.js';
import {
  processPlayerRegeneration,
  processAllHeroesRegeneration,
  setResting,
  getRegenState,
  enterCombat,
  leaveCombat
} from '../services/regenerationService.js';

/**
 * Register regeneration socket handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server instance
 */
export function registerRegenerationHandlers(socket, io) {
  const playerId = getPlayerIdBySocket(socket.id);
  if (!playerId) {
    return; // Player not authenticated
  }

  /**
   * Start/stop resting
   */
  socket.on('regen:set-resting', (data) => {
    const { resting } = data;
    
    const result = setResting(playerId, resting === true);
    
    if (result.success) {
      socket.emit('regen:resting-changed', {
        resting: result.resting
      });
      
      console.log(`[regen] Player ${playerId} ${result.resting ? 'started' : 'stopped'} resting`);
    } else {
      socket.emit('regen:error', {
        message: result.error || 'Failed to change resting state'
      });
    }
  });

  /**
   * Request current regen state
   */
  socket.on('regen:get-state', () => {
    const state = getRegenState(playerId);
    socket.emit('regen:state', state);
  });

  /**
   * Manual regen tick request (for testing)
   */
  socket.on('regen:force-tick', () => {
    const result = processPlayerRegeneration(playerId);
    
    if (result) {
      socket.emit('regen:tick', result);
      console.log(`[regen] Player ${playerId} regenerated: +${result.healthGained} HP, +${result.powerGained} Power`);
    } else {
      socket.emit('regen:no-change', {
        message: 'No regeneration occurred'
      });
    }
  });
}

/**
 * Start global regeneration loop for ALL heroes (WoW-style)
 * This processes regeneration for ALL player heroes in the database,
 * not just online players
 * @param {Server} io - The Socket.IO server instance
 */
export function startGlobalRegenerationLoop(io) {
  const REGEN_TICK_INTERVAL = 2000; // Check every 2 seconds
  
  setInterval(() => {
    // Build prioritized list: online player IDs
    const onlinePlayerIds = Array.from(io.sockets.sockets.values())
      .map(s => getPlayerIdBySocket(s.id))
      .filter(pid => typeof pid === 'number');

    // Debug: log online players
    console.log(`[regen] Tick - Online players: ${onlinePlayerIds.length} (${onlinePlayerIds.join(', ')})`);

    // Process regeneration for ALL heroes in the database, prioritizing online players
    const result = processAllHeroesRegeneration(onlinePlayerIds);
    
    // Log every tick with details
    console.log(`[regen] Processed ${result.processed} heroes needing regen, updated ${result.updated}, +${result.totalHealthGained} HP, +${result.totalPowerGained} Power`);
    
    // Log if any regeneration occurred
    if (result.updated > 0) {
      console.log(`[regen] ✅ Regenerated ${result.updated} heroes: +${result.totalHealthGained} HP, +${result.totalPowerGained} Power`);
    }
    
    // Notify online players about their regeneration
    if (result.updatedPlayers.length > 0) {
      result.updatedPlayers.forEach(update => {
        // Find all sockets for this player
        const playerSockets = Array.from(io.sockets.sockets.values()).filter(socket => {
          const socketPlayerId = getPlayerIdBySocket(socket.id);
          return socketPlayerId === update.playerId;
        });
        
        // Send regen update to all the player's sockets
        playerSockets.forEach(socket => {
          socket.emit('regen:tick', update);
        });
      });
    }
  }, REGEN_TICK_INTERVAL);
  
  console.log('[regen] Global regeneration loop started (processes ALL heroes)');
}

