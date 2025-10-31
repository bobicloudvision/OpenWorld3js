import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getPlayerById } from '../services/playerService.js';
import { getPlayerHeroes } from '../services/heroService.js';
import { getPlayerZone } from '../services/zoneService.js';
import {
  addPlayerToGameSession,
  removePlayerFromGameSession,
  updatePlayerPositionInGameSession,
  getOtherPlayersInGameSession,
  getAllPlayersInGameSession,
  updatePlayerHeroInGameSession,
} from '../services/multiplayerService.js';

/**
 * Register multiplayer socket handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server instance
 */
export function registerMultiplayerHandlers(socket, io) {
  // Get player ID from session
  const playerId = getPlayerIdBySocket(socket.id);
  if (!playerId) {
    return; // Player not authenticated, skip multiplayer handlers
  }

  // Get player data
  const player = getPlayerById(playerId);
  if (!player) {
    return;
  }

  // Get player's active hero info
  const playerHeroes = getPlayerHeroes(playerId);
  const activeHero = player.active_hero_id
    ? playerHeroes.find(ph => ph.playerHeroId === player.active_hero_id)
    : null;

  // Add player to multiplayer game session
  const playerData = {
    name: player.name,
    activeHeroId: player.active_hero_id,
    heroModel: activeHero?.model || null,
    heroModelScale: activeHero?.modelScale || 1,
    heroModelRotation: activeHero?.modelRotation || [0, 0, 0],
  };
  addPlayerToGameSession(socket.id, playerId, playerData);

  // NOTE: Initial player list is now sent by zone.js when player joins a zone
  // This keeps multiplayer synchronized with zones

  // Handle request for current players list (for keep-alive and reconnection)
  // Only returns players in the same zone
  socket.on('players:list:request', () => {
    const currentZoneId = getPlayerZone(playerId);
    if (!currentZoneId) {
      socket.emit('players:joined', []);
      return;
    }
    
    // Filter players to only those in the same zone
    const allPlayers = getOtherPlayersInGameSession(socket.id);
    const playersInSameZone = allPlayers.filter(p => {
      const otherPlayerZone = getPlayerZone(p.playerId);
      return otherPlayerZone === currentZoneId;
    });
    
    socket.emit('players:joined', playersInSameZone);
  });

  // Handle position updates from this player
  socket.on('player:position:update', (data) => {
    const { position, rotation } = data;
    if (!Array.isArray(position) || position.length !== 3) {
      return; // Invalid position data
    }

    // Update player position in game session
    updatePlayerPositionInGameSession(socket.id, position, rotation);

    // Only broadcast position to players in the same zone
    const currentZoneId = getPlayerZone(playerId);
    if (currentZoneId) {
      socket.to(`zone-${currentZoneId}`).emit('player:position:changed', {
        socketId: socket.id,
        position,
        rotation,
      });
    }
  });

  // Handle hero updates (when player changes hero)
  socket.on('player:hero:update', (data) => {
    updatePlayerHeroInGameSession(socket.id, data);
    
    // Only broadcast hero update to players in the same zone
    const currentZoneId = getPlayerZone(playerId);
    if (currentZoneId) {
      socket.to(`zone-${currentZoneId}`).emit('player:hero:changed', {
        socketId: socket.id,
        ...data,
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Get zone before removing player
    const currentZoneId = getPlayerZone(playerId);
    
    // Remove player from game session
    removePlayerFromGameSession(socket.id);
    
    // Only notify players in the same zone that this player left
    // Note: zone.js also handles this, but keeping it here for redundancy
    if (currentZoneId) {
      socket.to(`zone-${currentZoneId}`).emit('player:left', {
        socketId: socket.id,
      });
    }
  });
}

