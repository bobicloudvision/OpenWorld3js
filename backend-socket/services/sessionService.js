const socketToPlayerId = new Map();

export function bindSocket(socketId, playerId) {
  socketToPlayerId.set(socketId, playerId);
}

export function unbindSocket(socketId) {
  socketToPlayerId.delete(socketId);
}

export function getPlayerIdBySocket(socketId) {
  return socketToPlayerId.get(socketId) || null;
}


