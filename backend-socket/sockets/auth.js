import { findToken, isExpired, parseAbilities } from '../services/tokenService.js';
import { getPlayerById } from '../services/playerService.js';
import { bindSocket } from '../services/sessionService.js';
import { registerMultiplayerHandlers } from './multiplayer.js';
import { registerChatHandlers } from './chat.js';
import { registerCombatHandlers } from './combat.js';

export function registerAuthHandlers(socket, io) {
  socket.on('auth', async (payload) => {
    try {
      const tokenPlain = payload?.token;
      if (!tokenPlain || typeof tokenPlain !== 'string') {
        socket.emit('auth:error', { message: 'Missing token' });
        return;
      }

      const tokenRow = findToken(tokenPlain);
      if (!tokenRow) {
        socket.emit('auth:error', { message: 'Invalid token' });
        return;
      }

      if (tokenRow.tokenable_type !== 'App\\Models\\Player') {
        socket.emit('auth:error', { message: 'Token not for player' });
        return;
      }

      if (isExpired(tokenRow.expires_at)) {
        socket.emit('auth:error', { message: 'Token expired' });
        return;
      }

      const abilities = parseAbilities(tokenRow.abilities);
      // Customize ability checks if needed
      if (abilities.length && !abilities.includes('*')) {
        // Accept for now
      }

      const player = getPlayerById(tokenRow.tokenable_id);
      if (!player) {
        socket.emit('auth:error', { message: 'Player not found' });
        return;
      }

      bindSocket(socket.id, player.id);
      socket.emit('auth:ok', { player });
      
      // Register multiplayer handlers after successful authentication
      registerMultiplayerHandlers(socket, io);
      
      // Register chat handlers after successful authentication
      registerChatHandlers(socket, io);

      // Register combat handlers after successful authentication
      registerCombatHandlers(socket, io);
    } catch (err) {
      socket.emit('auth:error', { message: 'Auth failed' });
    }
  });
}


