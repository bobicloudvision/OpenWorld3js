import { getDb } from './db.js';

const findPlayerByIdStmt = () => getDb().prepare(
  `SELECT id, name, email, level, experience, currency, active_hero_id
   FROM players
   WHERE id = ?`
);

export function getPlayerById(playerId) {
  return findPlayerByIdStmt().get(playerId) || null;
}

/**
 * Set the active hero for a player
 * @param {number} playerId - The player's ID
 * @param {number} playerHeroId - The player_hero instance ID
 * @returns {boolean} True if successful, false otherwise
 */
export function setActiveHero(playerId, playerHeroId) {
  const db = getDb();
  
  // Verify that the player_hero belongs to this player
  const verifyStmt = db.prepare(`
    SELECT id FROM player_heroes 
    WHERE id = ? AND player_id = ?
  `);
  const playerHero = verifyStmt.get(playerHeroId, playerId);
  
  if (!playerHero) {
    return false;
  }
  
  // Update the player's active_hero_id
  const updateStmt = db.prepare(`
    UPDATE players 
    SET active_hero_id = ?
    WHERE id = ?
  `);
  
  const result = updateStmt.run(playerHeroId, playerId);
  return result.changes > 0;
}

