import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getPlayerById } from '../services/playerService.js';

export function registerPlayerHandlers(socket) {
  socket.on('get:player', () => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    const player = getPlayerById(playerId);
    socket.emit('player', player || null);
  });
}


