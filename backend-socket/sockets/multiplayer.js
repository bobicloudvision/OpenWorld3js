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
  // SECURITY: Validate position updates to prevent teleport hacks
  const lastPosition = new Map(); // socketId -> { position, timestamp }
  const MAX_MOVEMENT_SPEED = 20; // Max units per second (prevents teleporting)
  
  socket.on('player:position:update', (data) => {
    const { position, rotation } = data;
    
    // Validate position format
    if (!Array.isArray(position) || position.length !== 3) {
      console.warn(`[multiplayer] Invalid position format from socket ${socket.id}`);
      return; // Invalid position data
    }
    
    // Validate position values are numbers
    if (!position.every(val => typeof val === 'number' && isFinite(val))) {
      console.warn(`[multiplayer] Invalid position values from socket ${socket.id}`);
      return;
    }
    
    // Check for position validation (anti-teleport)
    const lastPosData = lastPosition.get(socket.id);
    if (lastPosData) {
      const now = Date.now();
      const timeDelta = (now - lastPosData.timestamp) / 1000; // Convert to seconds
      const distance = Math.sqrt(
        Math.pow(position[0] - lastPosData.position[0], 2) +
        Math.pow(position[1] - lastPosData.position[1], 2) +
        Math.pow(position[2] - lastPosData.position[2], 2)
      );
      
      // Prevent teleporting (moving faster than max speed)
      if (timeDelta > 0 && distance / timeDelta > MAX_MOVEMENT_SPEED) {
        console.warn(`[multiplayer] Player ${playerId} attempted to teleport: ${(distance / timeDelta).toFixed(2)} units/sec (max: ${MAX_MOVEMENT_SPEED})`);
        // Use last valid position instead
        updatePlayerPositionInGameSession(socket.id, lastPosData.position, rotation);
        
        // Still broadcast but with corrected position
        const currentZoneId = getPlayerZone(playerId);
        if (currentZoneId) {
          socket.to(`zone-${currentZoneId}`).emit('player:position:changed', {
            socketId: socket.id,
            position: lastPosData.position,
            rotation,
          });
        }
        return;
      }
    }
    
    // Update last valid position
    lastPosition.set(socket.id, { position: [...position], timestamp: Date.now() });

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
  
  // Cleanup last position on disconnect
  socket.on('disconnect', () => {
    lastPosition.delete(socket.id);
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

