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
  const lastPosition = new Map(); // socketId -> { position, timestamp, zoneId, zoneChangeTime }
  const MAX_MOVEMENT_SPEED = 25; // Max units per second (increased slightly for network latency)
  const ZONE_CHANGE_GRACE_PERIOD = 3000; // 3 seconds grace period after zone change (server teleports allowed)
  
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
    
    const currentZoneId = getPlayerZone(playerId);
    const now = Date.now();
    
    // Check for position validation (anti-teleport)
    const lastPosData = lastPosition.get(socket.id);
    if (lastPosData) {
      // If player changed zones, reset position tracking (server teleported them)
      if (lastPosData.zoneId !== currentZoneId && currentZoneId !== null) {
        // Zone changed - allow teleport with grace period
        lastPosition.set(socket.id, { 
          position: [...position], 
          timestamp: now, 
          zoneId: currentZoneId,
          zoneChangeTime: now // Track when zone changed
        });
        updatePlayerPositionInGameSession(socket.id, position, rotation);
        
        // Broadcast position change
        if (currentZoneId) {
          socket.to(`zone-${currentZoneId}`).emit('player:position:changed', {
            socketId: socket.id,
            playerId: playerId, // Include playerId for stable identification
            zoneId: currentZoneId, // Include zone ID for tracking and debugging
            position,
            rotation,
          });
        }
        return; // Allow zone change teleports
      }
      
      // Check if we're still in grace period after zone change (allow any movement)
      if (lastPosData.zoneChangeTime && (now - lastPosData.zoneChangeTime) < ZONE_CHANGE_GRACE_PERIOD) {
        // Still in grace period - allow any position update
        lastPosition.set(socket.id, { 
          ...lastPosData, 
          position: [...position], 
          timestamp: now 
        });
        updatePlayerPositionInGameSession(socket.id, position, rotation);
        
        if (currentZoneId) {
          socket.to(`zone-${currentZoneId}`).emit('player:position:changed', {
            socketId: socket.id,
            playerId: playerId, // Include playerId for stable identification
            zoneId: currentZoneId, // Include zone ID for tracking and debugging
            position,
            rotation,
          });
        }
        return;
      }
      
      const timeDelta = (now - lastPosData.timestamp) / 1000; // Convert to seconds
      
      // Skip speed check if less than 50ms (might be duplicate packets)
      if (timeDelta < 0.05) {
        updatePlayerPositionInGameSession(socket.id, position, rotation);
        return;
      }
      
      const distance = Math.sqrt(
        Math.pow(position[0] - lastPosData.position[0], 2) +
        Math.pow(position[1] - lastPosData.position[1], 2) +
        Math.pow(position[2] - lastPosData.position[2], 2)
      );
      
      const speed = timeDelta > 0 ? distance / timeDelta : 0;
      
      // Prevent teleporting (moving faster than max speed)
      // Add 5% tolerance for network latency
      if (speed > MAX_MOVEMENT_SPEED * 1.05) {
        console.warn(`[multiplayer] Player ${playerId} attempted to teleport: ${speed.toFixed(2)} units/sec (max: ${MAX_MOVEMENT_SPEED})`);
        // Use last valid position instead
        updatePlayerPositionInGameSession(socket.id, lastPosData.position, rotation);
        
        // Still broadcast but with corrected position
        if (currentZoneId) {
          socket.to(`zone-${currentZoneId}`).emit('player:position:changed', {
            socketId: socket.id,
            playerId: playerId, // Include playerId for stable identification
            zoneId: currentZoneId, // Include zone ID for tracking and debugging
            position: lastPosData.position,
            rotation,
          });
        }
        return;
      }
    }
    
    // Update last valid position (including zone ID)
    const updateData = { 
      position: [...position], 
      timestamp: now, 
      zoneId: currentZoneId 
    };
    
    // Keep zoneChangeTime if this is the same zone, otherwise clear it
    if (lastPosData && lastPosData.zoneId === currentZoneId && lastPosData.zoneChangeTime) {
      updateData.zoneChangeTime = lastPosData.zoneChangeTime;
    }
    
    lastPosition.set(socket.id, updateData);

    // Update player position in game session
    updatePlayerPositionInGameSession(socket.id, position, rotation);

    // Only broadcast position to players in the same zone
    if (currentZoneId) {
      socket.to(`zone-${currentZoneId}`).emit('player:position:changed', {
        socketId: socket.id,
        playerId: playerId, // Include playerId for stable identification
        zoneId: currentZoneId, // Include zone ID for tracking and debugging
        position,
        rotation,
      });
    }
  });
  
  // Reset position tracking when zone changes (server teleport)
  socket.on('zone:changed', (data) => {
    const { zoneId, position } = data;
    // Clear position tracking for zone changes (allow server teleports)
    lastPosition.set(socket.id, {
      position: position ? [...position] : [0, 0, 0],
      timestamp: Date.now(),
      zoneId: zoneId,
      zoneChangeTime: Date.now() // Mark zone change time for grace period
    });
    console.log(`[multiplayer] Reset position tracking for player ${playerId} due to zone change to zone ${zoneId}`);
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
        playerId: playerId, // Include playerId for stable identification
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
        playerId: playerId, // Include playerId for stable identification
      });
    }
  });
}

