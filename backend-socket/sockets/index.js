import { registerAuthHandlers } from './auth.js';
import { registerPlayerHandlers } from './player.js';
import { registerHeroHandlers } from './hero.js';
import { registerMultiplayerHandlers } from './multiplayer.js';
import { unbindSocket } from '../services/sessionService.js';

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    registerAuthHandlers(socket, io);
    registerPlayerHandlers(socket);
    registerHeroHandlers(socket, io);

    socket.on('disconnect', () => {
      unbindSocket(socket.id);
    });
  });
}


