import { getDb } from './db.js';

/**
 * Combat History Service
 * Saves combat match results to database for stats, leaderboards, and history
 */

/**
 * Save a completed combat match to the database
 * @param {Object} combatData - Combat match data
 * @param {string} combatData.combatInstanceId - Unique combat instance ID
 * @param {string} combatData.combatType - 'pvp', 'pve', 'team_pvp', 'team_pve'
 * @param {string} combatData.matchType - 'world', 'matchmaking', 'duel'
 * @param {string} combatData.queueType - '1v1', '2v2', etc. (optional)
 * @param {number} combatData.zoneId - Zone where combat took place
 * @param {string} combatData.result - 'victory', 'defeat', 'draw'
 * @param {Array} combatData.winners - Array of winner player IDs
 * @param {Array} combatData.losers - Array of loser player IDs
 * @param {number} combatData.startTime - Timestamp when combat started
 * @param {number} combatData.endTime - Timestamp when combat ended
 * @param {Object} combatData.stats - Combat statistics
 * @param {Object} combatData.playerResults - Individual player results
 */
export function saveCombatMatch(combatData) {
  const db = getDb();
  
  try {
    console.log('[combat-history] Saving combat match:', combatData.combatInstanceId);
    
    // Calculate duration
    const durationSeconds = combatData.endTime && combatData.startTime 
      ? Math.floor((combatData.endTime - combatData.startTime) / 1000) 
      : null;
    
    // Determine winner for 1v1
    const winnerPlayerId = combatData.winners?.length === 1 ? combatData.winners[0] : null;
    
    // Calculate total stats
    const totalDamage = Object.values(combatData.playerResults || {})
      .reduce((sum, p) => sum + (p.damageDealt || 0), 0);
    const totalHealing = Object.values(combatData.playerResults || {})
      .reduce((sum, p) => sum + (p.healingDone || 0), 0);
    const totalSpells = Object.values(combatData.playerResults || {})
      .reduce((sum, p) => sum + (p.spellsCast || 0), 0);
    
    // Insert combat match
    const insertMatch = db.prepare(`
      INSERT INTO combat_matches (
        combat_instance_id,
        combat_type,
        match_type,
        queue_type,
        zone_id,
        result,
        winner_player_id,
        winner_team,
        loser_team,
        total_players,
        duration_seconds,
        total_damage_dealt,
        total_healing_done,
        total_spells_cast,
        started_at,
        ended_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const matchResult = insertMatch.run(
      combatData.combatInstanceId,
      combatData.combatType,
      combatData.matchType || 'world',
      combatData.queueType || null,
      combatData.zoneId || null,
      combatData.result,
      winnerPlayerId,
      JSON.stringify(combatData.winners || []),
      JSON.stringify(combatData.losers || []),
      (combatData.winners?.length || 0) + (combatData.losers?.length || 0),
      durationSeconds,
      totalDamage,
      totalHealing,
      totalSpells,
      new Date(combatData.startTime).toISOString(),
      combatData.endTime ? new Date(combatData.endTime).toISOString() : null
    );
    
    const combatMatchId = matchResult.lastInsertRowid;
    
    console.log(`[combat-history] Created combat_match ID: ${combatMatchId}`);
    
    // Insert player participation records
    const insertPlayer = db.prepare(`
      INSERT INTO combat_match_players (
        combat_match_id,
        player_id,
        player_hero_id,
        result,
        team_number,
        damage_dealt,
        damage_taken,
        healing_done,
        spells_cast,
        kills,
        deaths,
        final_health,
        final_max_health,
        final_power,
        final_max_power,
        experience_gained,
        level_before,
        level_after,
        leveled_up,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    // Save each player's stats
    Object.entries(combatData.playerResults || {}).forEach(([playerId, playerResult]) => {
      const playerIdNum = Number(playerId);
      const won = combatData.winners?.includes(playerIdNum);
      const lost = combatData.losers?.includes(playerIdNum);
      const resultType = won ? 'won' : (lost ? 'lost' : 'draw');
      
      insertPlayer.run(
        combatMatchId,
        playerIdNum,
        playerResult.activeHeroId || null,
        resultType,
        playerResult.teamNumber || null,
        playerResult.damageDealt || 0,
        playerResult.damageTaken || 0,
        playerResult.healingDone || 0,
        playerResult.spellsCast || 0,
        playerResult.kills || 0,
        playerResult.deaths || (won ? 0 : 1), // Loser has 1 death
        playerResult.health || 0,
        playerResult.maxHealth || 100,
        playerResult.power || 0,
        playerResult.maxPower || 100,
        playerResult.experienceGained || 0,
        playerResult.oldLevel || playerResult.level || 1,
        playerResult.newLevel || playerResult.level || 1,
        playerResult.leveledUp ? 1 : 0
      );
      
      console.log(`[combat-history] Saved player ${playerId} participation (${resultType})`);
    });
    
    console.log('[combat-history] Combat match saved successfully');
    return combatMatchId;
    
  } catch (error) {
    console.error('[combat-history] Error saving combat match:', error);
    throw error;
  }
}

/**
 * Get player's combat history
 * @param {number} playerId - Player ID
 * @param {number} limit - Number of matches to retrieve
 * @returns {Array} Array of combat matches
 */
export function getPlayerCombatHistory(playerId, limit = 10) {
  const db = getDb();
  
  try {
    const query = db.prepare(`
      SELECT 
        cm.*,
        cmp.result as player_result,
        cmp.damage_dealt,
        cmp.healing_done,
        cmp.experience_gained,
        cmp.leveled_up
      FROM combat_matches cm
      INNER JOIN combat_match_players cmp ON cm.id = cmp.combat_match_id
      WHERE cmp.player_id = ?
      ORDER BY cm.ended_at DESC
      LIMIT ?
    `);
    
    return query.all(playerId, limit);
  } catch (error) {
    console.error('[combat-history] Error fetching player history:', error);
    return [];
  }
}

/**
 * Get player's combat statistics
 * @param {number} playerId - Player ID
 * @returns {Object} Combat statistics
 */
export function getPlayerCombatStats(playerId) {
  const db = getDb();
  
  try {
    const query = db.prepare(`
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN result = 'won' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'lost' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
        SUM(damage_dealt) as total_damage_dealt,
        SUM(damage_taken) as total_damage_taken,
        SUM(healing_done) as total_healing_done,
        SUM(spells_cast) as total_spells_cast,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths,
        SUM(experience_gained) as total_experience_gained
      FROM combat_match_players
      WHERE player_id = ?
    `);
    
    const stats = query.get(playerId);
    
    // Calculate win rate
    if (stats && stats.total_matches > 0) {
      stats.win_rate = ((stats.wins / stats.total_matches) * 100).toFixed(1);
      stats.kd_ratio = stats.total_deaths > 0 
        ? (stats.total_kills / stats.total_deaths).toFixed(2) 
        : stats.total_kills;
    }
    
    return stats || {};
  } catch (error) {
    console.error('[combat-history] Error fetching player stats:', error);
    return {};
  }
}

/**
 * Get leaderboard
 * @param {string} stat - 'wins', 'damage', 'healing', 'kd'
 * @param {number} limit - Number of players to retrieve
 * @returns {Array} Leaderboard array
 */
export function getLeaderboard(stat = 'wins', limit = 10) {
  const db = getDb();
  
  try {
    let orderBy;
    switch (stat) {
      case 'damage':
        orderBy = 'SUM(damage_dealt) DESC';
        break;
      case 'healing':
        orderBy = 'SUM(healing_done) DESC';
        break;
      case 'kd':
        orderBy = 'SUM(kills) * 1.0 / NULLIF(SUM(deaths), 1) DESC';
        break;
      case 'wins':
      default:
        orderBy = 'SUM(CASE WHEN result = \'won\' THEN 1 ELSE 0 END) DESC';
    }
    
    const query = db.prepare(`
      SELECT 
        p.id,
        p.name,
        COUNT(*) as total_matches,
        SUM(CASE WHEN cmp.result = 'won' THEN 1 ELSE 0 END) as wins,
        SUM(damage_dealt) as total_damage,
        SUM(healing_done) as total_healing,
        SUM(kills) as total_kills,
        SUM(deaths) as total_deaths
      FROM combat_match_players cmp
      INNER JOIN players p ON cmp.player_id = p.id
      GROUP BY p.id, p.name
      ORDER BY ${orderBy}
      LIMIT ?
    `);
    
    return query.all(limit);
  } catch (error) {
    console.error('[combat-history] Error fetching leaderboard:', error);
    return [];
  }
}

