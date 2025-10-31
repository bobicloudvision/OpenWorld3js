import { getDb } from './db.js';

/**
 * Leaderboard Service
 * Aggregates player combat statistics for leaderboard displays
 */

/**
 * Get global leaderboard with player rankings
 * @param {Object} options - Query options
 * @param {string} options.sortBy - Sort field: 'wins', 'winRate', 'matches', 'damage', 'kills'
 * @param {number} options.limit - Maximum number of players to return
 * @returns {Array} Array of player stats
 */
export function getGlobalLeaderboard({ sortBy = 'wins', limit = 100 } = {}) {
  const db = getDb();
  
  try {
    // Aggregate player combat statistics
    const query = db.prepare(`
      SELECT 
        p.id as playerId,
        p.name as playerName,
        p.level as playerLevel,
        COUNT(cmp.id) as totalMatches,
        SUM(CASE WHEN cmp.result = 'won' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN cmp.result = 'lost' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN cmp.result = 'draw' THEN 1 ELSE 0 END) as draws,
        ROUND(
          CAST(SUM(CASE WHEN cmp.result = 'won' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(cmp.id), 0) * 100, 
          1
        ) as winRate,
        SUM(cmp.damage_dealt) as totalDamage,
        SUM(cmp.damage_taken) as totalDamageTaken,
        SUM(cmp.healing_done) as totalHealing,
        SUM(cmp.spells_cast) as totalSpellsCast,
        SUM(cmp.kills) as totalKills,
        SUM(cmp.deaths) as totalDeaths,
        AVG(cmp.rating_after) as currentRating,
        MAX(cmp.created_at) as lastMatchDate
      FROM players p
      LEFT JOIN combat_match_players cmp ON p.id = cmp.player_id
      GROUP BY p.id, p.name, p.level
      HAVING COUNT(cmp.id) > 0
      ORDER BY 
        CASE 
          WHEN ? = 'wins' THEN wins
          WHEN ? = 'matches' THEN totalMatches
          WHEN ? = 'damage' THEN totalDamage
          WHEN ? = 'kills' THEN totalKills
          ELSE wins
        END DESC,
        CASE 
          WHEN ? = 'winRate' THEN winRate
          ELSE 0
        END DESC,
        p.name ASC
      LIMIT ?
    `);
    
    const leaderboard = query.all(sortBy, sortBy, sortBy, sortBy, sortBy, limit);
    
    // Add rank
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      winRate: entry.winRate || 0
    }));
  } catch (error) {
    console.error('[leaderboard] Error fetching global leaderboard:', error);
    return [];
  }
}

/**
 * Get player's leaderboard stats
 * @param {number} playerId - Player ID
 * @returns {Object|null} Player stats with rank
 */
export function getPlayerStats(playerId) {
  const db = getDb();
  
  try {
    // Get player's stats
    const statsQuery = db.prepare(`
      SELECT 
        p.id as playerId,
        p.name as playerName,
        p.level as playerLevel,
        COUNT(cmp.id) as totalMatches,
        SUM(CASE WHEN cmp.result = 'won' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN cmp.result = 'lost' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN cmp.result = 'draw' THEN 1 ELSE 0 END) as draws,
        ROUND(
          CAST(SUM(CASE WHEN cmp.result = 'won' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(cmp.id), 0) * 100, 
          1
        ) as winRate,
        SUM(cmp.damage_dealt) as totalDamage,
        SUM(cmp.damage_taken) as totalDamageTaken,
        SUM(cmp.healing_done) as totalHealing,
        SUM(cmp.spells_cast) as totalSpellsCast,
        SUM(cmp.kills) as totalKills,
        SUM(cmp.deaths) as totalDeaths,
        AVG(cmp.rating_after) as currentRating,
        MAX(cmp.created_at) as lastMatchDate
      FROM players p
      LEFT JOIN combat_match_players cmp ON p.id = cmp.player_id
      WHERE p.id = ?
      GROUP BY p.id, p.name, p.level
    `);
    
    const stats = statsQuery.get(playerId);
    
    if (!stats) return null;
    
    // Get player's rank (count how many players have more wins)
    const rankQuery = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT 
          p.id,
          SUM(CASE WHEN cmp.result = 'won' THEN 1 ELSE 0 END) as wins
        FROM players p
        LEFT JOIN combat_match_players cmp ON p.id = cmp.player_id
        GROUP BY p.id
        HAVING wins > (
          SELECT SUM(CASE WHEN cmp2.result = 'won' THEN 1 ELSE 0 END)
          FROM combat_match_players cmp2
          WHERE cmp2.player_id = ?
        )
      )
    `);
    
    const rankResult = rankQuery.get(playerId);
    
    return {
      ...stats,
      rank: rankResult?.rank || 1,
      winRate: stats.winRate || 0
    };
  } catch (error) {
    console.error('[leaderboard] Error fetching player stats:', error);
    return null;
  }
}

/**
 * Get hero leaderboard (individual player heroes)
 * @param {number} limit - Maximum number of heroes to return
 * @returns {Array} Array of hero stats
 */
export function getHeroLeaderboard(limit = 50) {
  const db = getDb();
  
  try {
    const query = db.prepare(`
      SELECT 
        ph.id as playerHeroId,
        ph.player_id as playerId,
        p.name as playerName,
        h.id as heroId,
        h.name as heroName,
        ph.level as heroLevel,
        COALESCE(ph.nickname, h.name) as displayName,
        COUNT(cmp.id) as totalMatches,
        SUM(CASE WHEN cmp.result = 'won' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN cmp.result = 'lost' THEN 1 ELSE 0 END) as losses,
        ROUND(
          CAST(SUM(CASE WHEN cmp.result = 'won' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(cmp.id), 0) * 100, 
          1
        ) as winRate,
        SUM(cmp.damage_dealt) as totalDamage,
        SUM(cmp.kills) as totalKills,
        ph.health as currentHealth,
        ph.max_health as maxHealth
      FROM player_heroes ph
      INNER JOIN heroes h ON ph.hero_id = h.id
      INNER JOIN players p ON ph.player_id = p.id
      LEFT JOIN combat_match_players cmp ON ph.id = cmp.player_hero_id
      GROUP BY ph.id, ph.player_id, p.name, h.id, h.name, ph.level, ph.nickname, ph.health, ph.max_health
      HAVING COUNT(cmp.id) > 0
      ORDER BY wins DESC, winRate DESC, totalDamage DESC
      LIMIT ?
    `);
    
    const leaderboard = query.all(limit);
    
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      winRate: entry.winRate || 0
    }));
  } catch (error) {
    console.error('[leaderboard] Error fetching hero leaderboard:', error);
    return [];
  }
}

/**
 * Get recent matches for a player
 * @param {number} playerId - Player ID
 * @param {number} limit - Maximum number of matches to return
 * @returns {Array} Array of recent matches
 */
export function getPlayerRecentMatches(playerId, limit = 10) {
  const db = getDb();
  
  try {
    const query = db.prepare(`
      SELECT 
        cm.id as matchId,
        cm.combat_instance_id as combatInstanceId,
        cm.combat_type as combatType,
        cm.match_type as matchType,
        cm.queue_type as queueType,
        cm.result,
        cm.duration_seconds as durationSeconds,
        cm.started_at as startedAt,
        cm.ended_at as endedAt,
        cmp.result as playerResult,
        cmp.damage_dealt as damageDealt,
        cmp.damage_taken as damageTaken,
        cmp.healing_done as healingDone,
        cmp.spells_cast as spellsCast,
        cmp.kills,
        cmp.deaths,
        cmp.experience_gained as experienceGained,
        cmp.leveled_up as leveledUp,
        h.name as heroName
      FROM combat_matches cm
      INNER JOIN combat_match_players cmp ON cm.id = cmp.combat_match_id
      LEFT JOIN player_heroes ph ON cmp.player_hero_id = ph.id
      LEFT JOIN heroes h ON ph.hero_id = h.id
      WHERE cmp.player_id = ?
      ORDER BY cm.ended_at DESC
      LIMIT ?
    `);
    
    return query.all(playerId, limit);
  } catch (error) {
    console.error('[leaderboard] Error fetching recent matches:', error);
    return [];
  }
}

