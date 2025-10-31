import { registerAuthHandlers } from './auth.js';
import { registerPlayerHandlers } from './player.js';
import { registerHeroHandlers } from './hero.js';
import { registerMultiplayerHandlers } from './multiplayer.js';
import { registerCombatHandlers } from './combat.js';
import { registerTeamHandlers } from './team.js';
import { registerZoneHandlers } from './zone.js';
import { unbindSocket } from '../services/sessionService.js';

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    registerAuthHandlers(socket, io);
    registerPlayerHandlers(socket);
    registerHeroHandlers(socket, io);
    registerMultiplayerHandlers(socket, io);
    registerCombatHandlers(socket, io);
    registerTeamHandlers(socket, io);
    registerZoneHandlers(socket, io);

    socket.on('disconnect', () => {
      unbindSocket(socket.id);
    });
  });
}


