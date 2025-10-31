// Track all connected players and their game state
const connectedPlayers = new Map(); // socketId -> playerData

/**
 * Get player data from game session by socket ID
 * @param {string} socketId - The socket ID
 * @returns {Object|null} Player data or null
 */
export function getPlayerInGameSession(socketId) {
  return connectedPlayers.get(socketId) || null;
}

/**
 * Get socket ID by player ID
 * @param {number} playerId - The player's database ID
 * @returns {string|null} Socket ID or null if not found
 */
export function getSocketIdByPlayerId(playerId) {
  for (const [socketId, playerData] of connectedPlayers.entries()) {
    if (playerData.playerId === playerId) {
      return socketId;
    }
  }
  return null;
}

/**
 * Get all players currently in the game session
 * @returns {Array} Array of all connected player data
 */
export function getAllPlayersInGameSession() {
  return Array.from(connectedPlayers.values());
}

/**
 * Get all other players in the game session (excluding the specified socket)
 * @param {string} socketId - The socket ID to exclude
 * @returns {Array} Array of other connected player data
 */
export function getOtherPlayersInGameSession(socketId) {
  const all = getAllPlayersInGameSession();
  return all.filter(p => p.socketId !== socketId);
}

/**
 * Add a player to the multiplayer game session
 * @param {string} socketId - The socket ID
 * @param {number} playerId - The player's database ID
 * @param {Object} playerData - Additional player data (name, active hero info, etc.)
 * @returns {Object} The stored player data
 */
export function addPlayerToGameSession(socketId, playerId, playerData = {}) {
  const playerInfo = {
    socketId,
    playerId,
    position: [0, 0, 0], // Default spawn position
    rotation: [0, 0, 0],
    name: playerData.name || `Player ${playerId}`,
    activeHeroId: playerData.activeHeroId || null,
    heroModel: playerData.heroModel || null,
    heroModelScale: playerData.heroModelScale || 1,
    heroModelRotation: playerData.heroModelRotation || [0, 0, 0],
    lastUpdate: Date.now(),
  };
  
  connectedPlayers.set(socketId, playerInfo);
  return playerInfo;
}

/**
 * Update a player's position in the game session
 * @param {string} socketId - The socket ID
 * @param {Array<number>} position - [x, y, z] position
 * @param {Array<number>} rotation - Optional [x, y, z] rotation
 * @returns {boolean} True if player was found and updated
 */
export function updatePlayerPositionInGameSession(socketId, position, rotation = null) {
  const player = connectedPlayers.get(socketId);
  if (!player) return false;
  
  player.position = position;
  if (rotation) {
    player.rotation = rotation;
  }
  player.lastUpdate = Date.now();
  
  return true;
}

/**
 * Remove a player from the multiplayer game session
 * @param {string} socketId - The socket ID
 * @returns {boolean} True if player was removed
 */
export function removePlayerFromGameSession(socketId) {
  return connectedPlayers.delete(socketId);
}

/**
 * Update player's hero information in the game session
 * @param {string} socketId - The socket ID
 * @param {Object} heroData - Hero data (activeHeroId, heroModel, etc.)
 * @returns {boolean} True if player was found and updated
 */
export function updatePlayerHeroInGameSession(socketId, heroData) {
  const player = connectedPlayers.get(socketId);
  if (!player) return false;
  
  if (heroData.activeHeroId !== undefined) {
    player.activeHeroId = heroData.activeHeroId;
  }
  if (heroData.heroModel !== undefined) {
    player.heroModel = heroData.heroModel;
  }
  if (heroData.heroModelScale !== undefined) {
    player.heroModelScale = heroData.heroModelScale;
  }
  if (heroData.heroModelRotation !== undefined) {
    player.heroModelRotation = heroData.heroModelRotation;
  }
  
  return true;
}

