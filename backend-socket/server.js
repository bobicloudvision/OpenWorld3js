import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { getDbPath } from './services/db.js';
import { registerSocketHandlers } from './sockets/index.js';
import { loadSpellDefinitions } from './services/spellService.js';
import { startGlobalRegenerationLoop } from './sockets/regeneration.js';
import { startEnemyGameLoop } from './sockets/enemy.js';

// Load spell definitions from database on startup
loadSpellDefinitions();

// HTTP + Socket.IO
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

registerSocketHandlers(io);

// Start global regeneration loop
startGlobalRegenerationLoop(io);

// Start enemy AI game loop
startEnemyGameLoop(io);

const PORT = Number(process.env.SOCKET_PORT || 6060);
httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[socket] listening on :${PORT}, db=${getDbPath()}`);
});


