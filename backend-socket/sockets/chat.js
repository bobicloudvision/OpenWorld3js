import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getPlayerById } from '../services/playerService.js';
import { addChatMessage, getChatHistory } from '../services/chatService.js';

/**
 * Register chat socket handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server instance
 */
export function registerChatHandlers(socket, io) {
  // Get player ID from session
  const playerId = getPlayerIdBySocket(socket.id);
  if (!playerId) {
    return; // Player not authenticated, skip chat handlers
  }

  // Get player data
  const player = getPlayerById(playerId);
  if (!player) {
    return;
  }

  // Handle request for chat history
  socket.on('chat:history:request', () => {
    const history = getChatHistory();
    socket.emit('chat:history', history);
  });

  // Handle incoming chat messages
  socket.on('chat:message', (data) => {
    // Validate message data
    const { message } = data;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      socket.emit('chat:error', { message: 'Invalid message' });
      return;
    }

    // Limit message length
    const trimmedMessage = message.trim().slice(0, 500);

    // Prepare chat message with player info
    const chatMessage = {
      playerId,
      playerName: player.name,
      message: trimmedMessage,
      timestamp: new Date().toISOString(),
    };

    // Store message in history
    addChatMessage(chatMessage);

    // Broadcast message to all connected clients (including sender)
    io.emit('chat:message', chatMessage);
  });
}

