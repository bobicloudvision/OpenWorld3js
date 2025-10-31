import { getDb } from './db.js';

/**
 * Get spells for a hero
 * @param {number} heroId - The hero's ID
 * @returns {Array} Array of spell objects
 */
function getHeroSpells(heroId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      s.id,
      s.key,
      s.name,
      s.base_damage,
      s.base_power_cost,
      s.base_cooldown,
      s.base_range,
      s.base_affect_range,
      s.damage_per_level,
      s.power_cost_per_level,
      s.cooldown_per_level,
      s.range_per_level,
      s.affect_range_per_level,
      s.color,
      s.description,
      s.icon,
      s.created_at,
      s.updated_at
    FROM spells s
    INNER JOIN hero_spells hs ON s.id = hs.spell_id
    WHERE hs.hero_id = ?
    ORDER BY s.name ASC
  `);
  
  return stmt.all(heroId);
}

/**
 * Calculate scaled spell stats based on hero level
 * @param {Object} spell - Base spell object from database
 * @param {number} heroLevel - Hero level for scaling
 * @returns {Object} Spell object with scaled stats
 */
function calculateScaledSpellStats(spell, heroLevel = 1) {
  return {
    id: spell.id,
    key: spell.key,
    name: spell.name,
    damage: Math.round(spell.base_damage + (heroLevel * (spell.damage_per_level || 0))),
    powerCost: Math.round(spell.base_power_cost + (heroLevel * (spell.power_cost_per_level || 0))),
    cooldown: Math.round(spell.base_cooldown + (heroLevel * (spell.cooldown_per_level || 0))),
    range: spell.base_range + (heroLevel * (spell.range_per_level || 0)),
    affectRange: spell.base_affect_range + (heroLevel * (spell.affect_range_per_level || 0)),
    color: spell.color,
    description: spell.description,
    icon: spell.icon,
    createdAt: spell.created_at,
    updatedAt: spell.updated_at,
    // Include base stats for reference
    baseDamage: spell.base_damage,
    basePowerCost: spell.base_power_cost,
    baseCooldown: spell.base_cooldown,
    baseRange: spell.base_range,
    baseAffectRange: spell.base_affect_range,
    damagePerLevel: spell.damage_per_level || 0,
    powerCostPerLevel: spell.power_cost_per_level || 0,
    cooldownPerLevel: spell.cooldown_per_level || 0,
    rangePerLevel: spell.range_per_level || 0,
    affectRangePerLevel: spell.affect_range_per_level || 0,
  };
}

/**
 * Get all heroes owned by a player
 * @param {number} playerId - The player's ID
 * @returns {Array} Array of player hero objects with hero details
 */
export function getPlayerHeroes(playerId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      ph.id as player_hero_id,
      ph.level,
      ph.experience,
      ph.health,
      ph.max_health,
      ph.power,
      ph.max_power,
      ph.attack,
      ph.defense,
      ph.nickname,
      ph.equipment,
      ph.talents,
      ph.acquired_at,
      h.id as hero_id,
      h.name as hero_name,
      h.health as hero_base_health,
      h.max_health as hero_base_max_health,
      h.power as hero_base_power,
      h.max_power as hero_base_max_power,
      h.attack as hero_base_attack,
      h.defense as hero_base_defense,
      h.model,
      h.model_scale,
      h.model_rotation
    FROM player_heroes ph
    INNER JOIN heroes h ON ph.hero_id = h.id
    WHERE ph.player_id = ?
    ORDER BY ph.acquired_at DESC
  `);
  
  const heroes = stmt.all(playerId);
  
  return heroes.map(row => {
    const heroLevel = row.level || 1;
    const baseSpells = getHeroSpells(row.hero_id);
    const scaledSpells = baseSpells.map(spell => calculateScaledSpellStats(spell, heroLevel));
    
    return {
      playerHeroId: row.player_hero_id,
      heroId: row.hero_id,
      name: row.nickname || row.hero_name,
      heroName: row.hero_name,
      level: row.level,
      experience: row.experience,
      health: row.health ?? row.hero_base_health,
      maxHealth: row.max_health ?? row.hero_base_max_health,
      power: row.power ?? row.hero_base_power,
      maxPower: row.max_power ?? row.hero_base_max_power,
      attack: row.attack ?? row.hero_base_attack,
      defense: row.defense ?? row.hero_base_defense,
      nickname: row.nickname,
      equipment: row.equipment ? JSON.parse(row.equipment) : null,
      talents: row.talents ? JSON.parse(row.talents) : null,
      acquiredAt: row.acquired_at,
      model: row.model,
      modelScale: row.model_scale,
      modelRotation: row.model_rotation ? JSON.parse(row.model_rotation) : null,
      spells: scaledSpells,
    };
  });
}

/**
 * Get all heroes that can be purchased by a player (heroes they don't already own)
 * @param {number} playerId - The player's ID
 * @returns {Array} Array of hero objects available for purchase
 */
export function getAvailableHeroesToBuy(playerId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      h.id,
      h.name,
      h.health,
      h.max_health,
      h.power,
      h.max_power,
      h.attack,
      h.defense,
      h.model,
      h.model_scale,
      h.model_rotation,
      COALESCE(h.price, 1000) as price,
      h.created_at,
      h.updated_at
    FROM heroes h
    WHERE h.id NOT IN (
      SELECT hero_id 
      FROM player_heroes 
      WHERE player_id = ?
    )
    ORDER BY h.name ASC
  `);
  
  const heroes = stmt.all(playerId);
  
  return heroes.map(row => {
    const baseSpells = getHeroSpells(row.id);
    const spells = baseSpells.map(spell => calculateScaledSpellStats(spell, 1)); // Level 1 base stats
    
    return {
      id: row.id,
      name: row.name,
      health: row.health,
      maxHealth: row.max_health,
      power: row.power,
      maxPower: row.max_power,
      attack: row.attack,
      defense: row.defense,
      model: row.model,
      modelScale: row.model_scale,
      modelRotation: row.model_rotation ? JSON.parse(row.model_rotation) : null,
      price: row.price || 1000, // Default price if not set
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      spells: spells,
    };
  });
}

/**
 * Purchase a hero for a player
 * @param {number} playerId - The player's ID
 * @param {number} heroId - The hero's ID to purchase
 * @returns {Object|null} Returns object with success status and playerHeroId if successful, null if failed
 */
export function purchaseHero(playerId, heroId) {
  const db = getDb();
  
  // Start transaction
  const transaction = db.transaction(() => {
    // Get hero details and price
    const heroStmt = db.prepare(`
      SELECT 
        id, 
        COALESCE(price, 1000) as price,
        COALESCE(health, 100) as health,
        COALESCE(max_health, 100) as max_health,
        COALESCE(power, 100) as power,
        COALESCE(max_power, 100) as max_power,
        COALESCE(attack, 10) as attack,
        COALESCE(defense, 5) as defense
      FROM heroes
      WHERE id = ?
    `);
    const hero = heroStmt.get(heroId);
    
    if (!hero) {
      return { success: false, error: 'Hero not found' };
    }
    
    // Check if player already owns this hero
    const ownedStmt = db.prepare(`
      SELECT id FROM player_heroes
      WHERE player_id = ? AND hero_id = ?
    `);
    const owned = ownedStmt.get(playerId, heroId);
    
    if (owned) {
      return { success: false, error: 'You already own this hero' };
    }
    
    // Get player currency
    const playerStmt = db.prepare(`
      SELECT currency FROM players WHERE id = ?
    `);
    const player = playerStmt.get(playerId);
    
    if (!player) {
      return { success: false, error: 'Player not found' };
    }
    
    const heroPrice = hero.price || 1000;
    
    // Check if player has enough currency
    if (player.currency < heroPrice) {
      return { success: false, error: 'Insufficient currency' };
    }
    
    // Deduct currency
    const updateCurrencyStmt = db.prepare(`
      UPDATE players 
      SET currency = currency - ?
      WHERE id = ?
    `);
    updateCurrencyStmt.run(heroPrice, playerId);
    
    // Create player_hero entry with initialized stats from base hero
    const insertPlayerHeroStmt = db.prepare(`
      INSERT INTO player_heroes (
        player_id, hero_id, level, experience, 
        health, max_health, power, max_power, attack, defense,
        acquired_at
      )
      VALUES (?, ?, 1, 0, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = insertPlayerHeroStmt.run(
      playerId, 
      heroId,
      hero.health,
      hero.max_health,
      hero.power,
      hero.max_power,
      hero.attack,
      hero.defense
    );
    const playerHeroId = result.lastInsertRowid;
    
    return { success: true, playerHeroId, price: heroPrice };
  });
  
  try {
    return transaction();
  } catch (error) {
    console.error('Purchase hero error:', error);
    return { success: false, error: 'Purchase failed' };
  }
}

/**
 * Get a hero by ID
 * @param {number} heroId - The hero's ID
 * @returns {Object|null} Hero object or null if not found
 */
export function getHeroById(heroId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      health,
      max_health,
      power,
      max_power,
      attack,
      defense,
      model,
      model_scale,
      model_rotation,
      created_at,
      updated_at
    FROM heroes
    WHERE id = ?
  `);
  
  const row = stmt.get(heroId);
  if (!row) return null;
  
  const baseSpells = getHeroSpells(heroId);
  const spells = baseSpells.map(spell => calculateScaledSpellStats(spell, 1)); // Level 1 base stats
  
  return {
    id: row.id,
    name: row.name,
    health: row.health,
    maxHealth: row.max_health,
    power: row.power,
    maxPower: row.max_power,
    attack: row.attack,
    defense: row.defense,
    model: row.model,
    modelScale: row.model_scale,
    modelRotation: row.model_rotation ? JSON.parse(row.model_rotation) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    spells: spells,
  };
}

/**
 * Get all heroes (base hero definitions)
 * @returns {Array} Array of all hero objects
 */
export function getAllHeroes() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      id,
      name,
      health,
      max_health,
      power,
      max_power,
      attack,
      defense,
      model,
      model_scale,
      model_rotation,
      created_at,
      updated_at
    FROM heroes
    ORDER BY name ASC
  `);
  
  const heroes = stmt.all();
  
  return heroes.map(row => {
    const baseSpells = getHeroSpells(row.id);
    const spells = baseSpells.map(spell => calculateScaledSpellStats(spell, 1)); // Level 1 base stats
    
    return {
      id: row.id,
      name: row.name,
      health: row.health,
      maxHealth: row.max_health,
      power: row.power,
      maxPower: row.max_power,
      attack: row.attack,
      defense: row.defense,
      model: row.model,
      modelScale: row.model_scale,
      modelRotation: row.model_rotation ? JSON.parse(row.model_rotation) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      spells: spells,
    };
  });
}

/**
 * Update player hero combat stats after combat ends
 * @param {number} playerId - The player's ID
 * @param {Object} combatStats - Combat stats to save
 * @param {number} combatStats.health - Current health value
 * @param {number} combatStats.power - Current power value
 * @param {number} combatStats.attack - Attack stat (if modified)
 * @param {number} combatStats.defense - Defense stat (if modified)
 * @param {number} combatStats.experienceGained - Experience gained from combat
 * @returns {Object} { success: boolean, leveledUp?: boolean, newLevel?: number }
 */
export function updatePlayerHeroCombatStats(playerId, combatStats) {
  const db = getDb();
  
  try {
    // Get the player's active hero ID and current stats
    const playerStmt = db.prepare('SELECT active_hero_id FROM players WHERE id = ?');
    const player = playerStmt.get(playerId);
    
    if (!player || !player.active_hero_id) {
      console.warn(`[heroService] Cannot update stats: Player ${playerId} has no active hero`);
      return { success: false };
    }
    
    const heroStmt = db.prepare('SELECT level, experience, max_health, max_power FROM player_heroes WHERE id = ? AND player_id = ?');
    const heroData = heroStmt.get(player.active_hero_id, playerId);
    
    if (!heroData) {
      return { success: false };
    }
    
    // Calculate new experience and level
    const expGained = combatStats.experienceGained || 0;
    const currentExp = heroData.experience || 0;
    const currentLevel = heroData.level || 1;
    const newExp = currentExp + expGained;
    
    // Simple level-up formula: 100 * level for next level
    let newLevel = currentLevel;
    let remainingExp = newExp;
    let leveledUp = false;
    
    while (remainingExp >= (100 * newLevel) && newLevel < 100) {
      remainingExp -= (100 * newLevel);
      newLevel++;
      leveledUp = true;
    }
    
    // Build update query dynamically based on what stats are provided
    const updates = [];
    const values = [];
    
    // Get max values for clamping (use defaults if not set in DB)
    const maxHealth = heroData.max_health || 100;
    const maxPower = heroData.max_power || 100;
    
    // Always update health and power - CLAMP to max values
    if (typeof combatStats.health === 'number') {
      updates.push('health = ?');
      const clampedHealth = Math.min(Math.max(0, Math.round(combatStats.health)), maxHealth);
      values.push(clampedHealth);
    }
    if (typeof combatStats.power === 'number') {
      updates.push('power = ?');
      const clampedPower = Math.min(Math.max(0, Math.round(combatStats.power)), maxPower);
      values.push(clampedPower);
    }
    
    // Update attack/defense if provided (from buffs/debuffs that persist)
    if (typeof combatStats.attack === 'number') {
      updates.push('attack = ?');
      values.push(Math.max(1, Math.round(combatStats.attack)));
    }
    if (typeof combatStats.defense === 'number') {
      updates.push('defense = ?');
      values.push(Math.max(0, Math.round(combatStats.defense)));
    }
    
    // Update experience and level
    if (expGained > 0) {
      updates.push('experience = ?');
      values.push(remainingExp);
      updates.push('level = ?');
      values.push(newLevel);
    }
    
    if (updates.length === 0) {
      return { success: false };
    }
    
    // Add WHERE clause parameters
    values.push(player.active_hero_id);
    values.push(playerId);
    
    const updateStmt = db.prepare(`
      UPDATE player_heroes 
      SET ${updates.join(', ')}
      WHERE id = ? AND player_id = ?
    `);
    
    const result = updateStmt.run(...values);
    
    return {
      success: result.changes > 0,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      experienceGained: expGained
    };
  } catch (error) {
    console.error('[heroService] Error updating hero combat stats:', error);
    return { success: false };
  }
}

/**
 * Update player hero stats (simple update for regeneration, healing items, etc.)
 * @param {number} playerId - The player's ID
 * @param {Object} stats - Stats to update { health?, power?, attack?, defense? }
 * @returns {Object} { success: boolean }
 */
export function updatePlayerHeroStats(playerId, stats) {
  const db = getDb();
  
  try {
    // Get the player's active hero ID
    const playerStmt = db.prepare('SELECT active_hero_id FROM players WHERE id = ?');
    const player = playerStmt.get(playerId);
    
    if (!player || !player.active_hero_id) {
      return { success: false };
    }
    
    // Get hero's max values for clamping
    const heroStmt = db.prepare('SELECT max_health, max_power FROM player_heroes WHERE id = ? AND player_id = ?');
    const heroData = heroStmt.get(player.active_hero_id, playerId);
    
    if (!heroData) {
      return { success: false };
    }
    
    const maxHealth = heroData.max_health || 100;
    const maxPower = heroData.max_power || 100;
    
    // Build update query
    const updates = [];
    const values = [];
    
    if (typeof stats.health === 'number') {
      updates.push('health = ?');
      const clampedHealth = Math.min(Math.max(0, Math.round(stats.health)), maxHealth);
      values.push(clampedHealth);
    }
    
    if (typeof stats.power === 'number') {
      updates.push('power = ?');
      const clampedPower = Math.min(Math.max(0, Math.round(stats.power)), maxPower);
      values.push(clampedPower);
    }
    
    if (typeof stats.attack === 'number') {
      updates.push('attack = ?');
      values.push(Math.max(1, Math.round(stats.attack)));
    }
    
    if (typeof stats.defense === 'number') {
      updates.push('defense = ?');
      values.push(Math.max(0, Math.round(stats.defense)));
    }
    
    if (updates.length === 0) {
      return { success: false };
    }
    
    values.push(player.active_hero_id);
    values.push(playerId);
    
    const updateStmt = db.prepare(`
      UPDATE player_heroes 
      SET ${updates.join(', ')}
      WHERE id = ? AND player_id = ?
    `);
    
    const result = updateStmt.run(...values);
    
    return { success: result.changes > 0 };
  } catch (error) {
    console.error('[heroService] Error updating hero stats:', error);
    return { success: false };
  }
}

