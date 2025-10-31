import { getDb } from './db.js';
import { getPlayerHeroes } from './heroService.js';

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


/**
 * Get the player's active hero instance, including scaled spells
 * @param {number} playerId
 * @returns {object|null}
 */
export function getActiveHeroForPlayer(playerId) {
  const player = getPlayerById(playerId);
  if (!player || !player.active_hero_id) return null;

  const heroes = getPlayerHeroes(playerId);
  return heroes.find(h => h.playerHeroId === player.active_hero_id) || null;
}

/**
 * Get a player summary with active hero snapshot
 * @param {number} playerId
 * @returns {{ player: object|null, activeHero: object|null }}
 */
export function getPlayerSummary(playerId) {
  const player = getPlayerById(playerId);
  const activeHero = player ? getActiveHeroForPlayer(playerId) : null;
  return { player, activeHero };
}

/**
 * Update player experience and level after combat
 * @param {number} playerId - The player's ID
 * @param {number} experienceGained - Experience gained from combat
 * @returns {Object} { success: boolean, leveledUp?: boolean, oldLevel?: number, newLevel?: number, experienceGained: number }
 */
export function updatePlayerExperience(playerId, experienceGained) {
  const db = getDb();
  
  try {
    // Get current player stats
    const playerStmt = db.prepare('SELECT level, experience FROM players WHERE id = ?');
    const player = playerStmt.get(playerId);
    
    if (!player) {
      console.warn(`[playerService] Cannot update experience: Player ${playerId} not found`);
      return { success: false, experienceGained: 0 };
    }
    
    // Calculate new experience and level
    const currentExp = player.experience || 0;
    const currentLevel = player.level || 1;
    const newExp = currentExp + experienceGained;
    
    // Level-up formula: 100 * level for next level (same as heroes)
    let newLevel = currentLevel;
    let remainingExp = newExp;
    let leveledUp = false;
    
    while (remainingExp >= (100 * newLevel) && newLevel < 100) {
      remainingExp -= (100 * newLevel);
      newLevel++;
      leveledUp = true;
    }
    
    // Update player experience and level
    const updateStmt = db.prepare(`
      UPDATE players 
      SET experience = ?, level = ?
      WHERE id = ?
    `);
    
    const result = updateStmt.run(remainingExp, newLevel, playerId);
    
    if (result.changes > 0) {
      console.log(`[playerService] Player ${playerId} gained ${experienceGained} XP${leveledUp ? `, LEVEL UP! ${currentLevel} -> ${newLevel}` : ''} (${remainingExp}/${100 * newLevel} XP to next level)`);
    }
    
    return {
      success: result.changes > 0,
      leveledUp,
      oldLevel: leveledUp ? currentLevel : undefined,
      newLevel,
      experienceGained
    };
  } catch (error) {
    console.error('[playerService] Error updating player experience:', error);
    return { success: false, experienceGained: 0 };
  }
}

