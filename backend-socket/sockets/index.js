import { registerAuthHandlers } from './auth.js';
import { registerPlayerHandlers } from './player.js';
import { unbindSocket } from '../services/sessionService.js';

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    registerAuthHandlers(socket);
    registerPlayerHandlers(socket);

    socket.on('disconnect', () => {
      unbindSocket(socket.id);
    });
  });
}


