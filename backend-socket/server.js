import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { getDbPath } from './services/db.js';
import { registerSocketHandlers } from './sockets/index.js';

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

const PORT = Number(process.env.SOCKET_PORT || 6060);
httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[socket] listening on :${PORT}, db=${getDbPath()}`);
});


