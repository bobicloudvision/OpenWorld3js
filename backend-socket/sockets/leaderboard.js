import { 
  getGlobalLeaderboard, 
  getPlayerStats, 
  getHeroLeaderboard,
  getPlayerRecentMatches 
} from '../services/leaderboardService.js';
import { getPlayerIdBySocket } from '../services/sessionService.js';

/**
 * Leaderboard Socket Handlers
 */

export function registerLeaderboardHandlers(socket) {
  
  /**
   * Get global player leaderboard
   */
  socket.on('leaderboard:get', ({ sortBy = 'wins', limit = 100 } = {}) => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('leaderboard:error', { message: 'Not authenticated' });
      return;
    }
    
    try {
      console.log(`[leaderboard] Player ${playerId} requesting leaderboard (sortBy: ${sortBy})`);
      
      const leaderboard = getGlobalLeaderboard({ sortBy, limit });
      
      socket.emit('leaderboard:data', {
        leaderboard,
        sortBy,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[leaderboard] Error getting leaderboard:', error);
      socket.emit('leaderboard:error', {
        message: 'Failed to fetch leaderboard'
      });
    }
  });
  
  /**
   * Get player's own stats with rank
   */
  socket.on('leaderboard:get:player-stats', ({ targetPlayerId } = {}) => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('leaderboard:player-stats:error', { message: 'Not authenticated' });
      return;
    }
    
    try {
      const targetId = targetPlayerId || playerId;
      console.log(`[leaderboard] Player ${playerId} requesting stats for player ${targetId}`);
      
      const stats = getPlayerStats(targetId);
      
      if (!stats) {
        socket.emit('leaderboard:player-stats:error', {
          message: 'Player stats not found'
        });
        return;
      }
      
      socket.emit('leaderboard:player-stats', {
        stats,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[leaderboard] Error getting player stats:', error);
      socket.emit('leaderboard:player-stats:error', {
        message: 'Failed to fetch player stats'
      });
    }
  });
  
  /**
   * Get hero leaderboard
   */
  socket.on('leaderboard:get:heroes', ({ limit = 50 } = {}) => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('leaderboard:heroes:error', { message: 'Not authenticated' });
      return;
    }
    
    try {
      console.log(`[leaderboard] Player ${playerId} requesting hero leaderboard`);
      
      const heroLeaderboard = getHeroLeaderboard(limit);
      
      socket.emit('leaderboard:heroes', {
        heroes: heroLeaderboard,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[leaderboard] Error getting hero leaderboard:', error);
      socket.emit('leaderboard:heroes:error', {
        message: 'Failed to fetch hero leaderboard'
      });
    }
  });
  
  /**
   * Get player's recent matches
   */
  socket.on('leaderboard:get:recent-matches', ({ targetPlayerId, limit = 10 } = {}) => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('leaderboard:recent-matches:error', { message: 'Not authenticated' });
      return;
    }
    
    try {
      const targetId = targetPlayerId || playerId;
      console.log(`[leaderboard] Player ${playerId} requesting recent matches for player ${targetId}`);
      
      const matches = getPlayerRecentMatches(targetId, limit);
      
      socket.emit('leaderboard:recent-matches', {
        matches,
        playerId: targetId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[leaderboard] Error getting recent matches:', error);
      socket.emit('leaderboard:recent-matches:error', {
        message: 'Failed to fetch recent matches'
      });
    }
  });
}

