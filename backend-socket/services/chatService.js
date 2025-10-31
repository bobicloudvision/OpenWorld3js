// In-memory chat message storage
// Stores the latest MAX_MESSAGES messages
const MAX_MESSAGES = 50;
const chatMessages = [];

/**
 * Add a new chat message to history
 * @param {Object} message - The chat message object
 */
export function addChatMessage(message) {
  chatMessages.push(message);
  
  // Keep only the latest MAX_MESSAGES messages
  if (chatMessages.length > MAX_MESSAGES) {
    chatMessages.shift(); // Remove oldest message
  }
}

/**
 * Get the latest chat messages (up to MAX_MESSAGES)
 * @param {number} limit - Maximum number of messages to return (default: MAX_MESSAGES)
 * @returns {Array} Array of chat messages
 */
export function getChatHistory(limit = MAX_MESSAGES) {
  const actualLimit = Math.min(limit, MAX_MESSAGES);
  // Return the last N messages
  return chatMessages.slice(-actualLimit);
}

/**
 * Get the total number of stored messages
 * @returns {number} Number of messages
 */
export function getChatMessageCount() {
  return chatMessages.length;
}

