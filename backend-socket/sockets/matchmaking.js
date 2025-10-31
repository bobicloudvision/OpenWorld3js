import { getPlayerIdBySocket } from '../services/sessionService.js';
import * as matchmakingService from '../services/matchmakingService.js';
import * as zoneService from '../services/zoneService.js';

/**
 * Matchmaking Socket Handlers
 * Handles PvP queue joining, match creation, and countdowns
 */

export function registerMatchmakingHandlers(socket, io) {
  
  /**
   * Get available queue types
   */
  socket.on('matchmaking:queues', (data, ack) => {
    try {
      const queues = matchmakingService.getAvailableQueues();
      
      if (ack) {
        ack({ ok: true, queues });
      }
    } catch (error) {
      console.error('[matchmaking] Error getting queues:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Join a queue
   */
  socket.on('matchmaking:join', async (data, ack) => {
    try {
      const playerId = getPlayerIdBySocket(socket.id);
      
      if (!playerId) {
        if (ack) return ack({ ok: false, error: 'Not authenticated' });
        return;
      }

      const { queueType } = data;
      
      // Get player data
      const [player] = await zoneService.getPlayerById(playerId);
      if (!player) {
        if (ack) return ack({ ok: false, error: 'Player not found' });
        return;
      }

      // Get active hero data
      const playerData = {
        name: player.name,
        level: player.level || 1,
        heroData: player.active_hero_id ? { id: player.active_hero_id } : null
      };

      // Join socket room for matchmaking updates
      socket.join(`matchmaking-${queueType}`);
      socket.join(playerId); // Personal room for match notifications

      const result = matchmakingService.joinQueue(playerId, playerData, queueType, io);
      
      if (result.ok) {
        console.log(`[matchmaking] Player ${playerId} joined ${queueType} queue`);
      }

      if (ack) ack(result);
    } catch (error) {
      console.error('[matchmaking] Error joining queue:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Leave queue
   */
  socket.on('matchmaking:leave', (data, ack) => {
    try {
      const playerId = getPlayerIdBySocket(socket.id);
      
      if (!playerId) {
        if (ack) return ack({ ok: false, error: 'Not authenticated' });
        return;
      }

      const result = matchmakingService.leaveQueue(playerId, io);
      
      if (result.ok) {
        console.log(`[matchmaking] Player ${playerId} left queue`);
        
        // Leave matchmaking rooms
        const status = matchmakingService.getPlayerQueueStatus(playerId);
        if (status.queueType) {
          socket.leave(`matchmaking-${status.queueType}`);
        }
      }

      if (ack) ack(result);
    } catch (error) {
      console.error('[matchmaking] Error leaving queue:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Get player's queue status
   */
  socket.on('matchmaking:status', (data, ack) => {
    try {
      const playerId = getPlayerIdBySocket(socket.id);
      
      if (!playerId) {
        if (ack) return ack({ ok: false, error: 'Not authenticated' });
        return;
      }

      const status = matchmakingService.getPlayerQueueStatus(playerId);
      
      if (ack) {
        ack({ ok: true, status });
      }
    } catch (error) {
      console.error('[matchmaking] Error getting status:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (playerId) {
      matchmakingService.handlePlayerDisconnect(playerId, io);
    }
  });
}

