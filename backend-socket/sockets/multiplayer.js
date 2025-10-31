import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getPlayerById } from '../services/playerService.js';
import { getPlayerHeroes } from '../services/heroService.js';
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

  // Send current list of other players to the newly connected player
  const otherPlayers = getOtherPlayersInGameSession(socket.id);
  socket.emit('players:joined', otherPlayers);

  // Broadcast to all other players that this player joined
  socket.broadcast.emit('player:joined', {
    socketId: socket.id,
    playerId,
    ...playerData,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  });

  // Handle request for current players list (for keep-alive and reconnection)
  socket.on('players:list:request', () => {
    const currentOtherPlayers = getOtherPlayersInGameSession(socket.id);
    socket.emit('players:joined', currentOtherPlayers);
  });

  // Handle position updates from this player
  socket.on('player:position:update', (data) => {
    const { position, rotation } = data;
    if (!Array.isArray(position) || position.length !== 3) {
      return; // Invalid position data
    }

    // Update player position in game session
    updatePlayerPositionInGameSession(socket.id, position, rotation);

    // Broadcast position to all other players
    socket.broadcast.emit('player:position:changed', {
      socketId: socket.id,
      position,
      rotation,
    });
  });

  // Handle hero updates (when player changes hero)
  socket.on('player:hero:update', (data) => {
    updatePlayerHeroInGameSession(socket.id, data);
    
    // Broadcast hero update to all other players
    socket.broadcast.emit('player:hero:changed', {
      socketId: socket.id,
      ...data,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove player from game session
    removePlayerFromGameSession(socket.id);
    
    // Notify all other players that this player left
    socket.broadcast.emit('player:left', {
      socketId: socket.id,
    });
  });
}

