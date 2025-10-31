import { getDb } from './db.js';

// Cache for spell definitions
let spellCache = new Map(); // spellKey -> SpellDefinition
let spellCacheLoaded = false;

/**
 * Load spell definitions with effects from database
 * Should be called on server startup
 */
export function loadSpellDefinitions() {
  const db = getDb();
  
  // Get all spells
  const spellsStmt = db.prepare(`
    SELECT 
      id,
      key,
      name,
      base_damage,
      base_power_cost,
      base_cooldown,
      base_range,
      base_affect_range,
      damage_per_level,
      power_cost_per_level,
      cooldown_per_level,
      range_per_level,
      affect_range_per_level,
      color,
      description,
      icon
    FROM spells
  `);
  
  const spells = spellsStmt.all();
  
  // Get all spell effects
  const effectsStmt = db.prepare(`
    SELECT 
      se.spell_id,
      se.effect_id,
      e.type,
      e.name as effect_name,
      se.base_duration,
      se.base_tick_damage,
      se.base_tick_rate,
      se.base_force,
      se.base_heal_percent,
      se.base_slow_percent,
      se.base_bounces,
      se.base_chain_range,
      se.duration_per_level,
      se.tick_damage_per_level,
      se.force_per_level,
      se.heal_percent_per_level,
      se.slow_percent_per_level,
      se.bounces_per_level,
      se.chain_range_per_level,
      se.effect_order
    FROM spell_effects se
    INNER JOIN effects e ON se.effect_id = e.id
    ORDER BY se.spell_id, se.effect_order ASC
  `);
  
  const spellEffects = effectsStmt.all();
  
  // Group effects by spell_id
  const effectsBySpell = {};
  spellEffects.forEach(se => {
    if (!effectsBySpell[se.spell_id]) {
      effectsBySpell[se.spell_id] = [];
    }
    effectsBySpell[se.spell_id].push({
      type: se.type,
      name: se.effect_name,
      baseDuration: se.base_duration,
      baseTickDamage: se.base_tick_damage,
      baseTickRate: se.base_tick_rate,
      baseForce: se.base_force,
      baseHealPercent: se.base_heal_percent,
      baseSlowPercent: se.base_slow_percent,
      baseBounces: se.base_bounces,
      baseChainRange: se.base_chain_range,
      durationPerLevel: se.duration_per_level || 0,
      tickDamagePerLevel: se.tick_damage_per_level || 0,
      forcePerLevel: se.force_per_level || 0,
      healPercentPerLevel: se.heal_percent_per_level || 0,
      slowPercentPerLevel: se.slow_percent_per_level || 0,
      bouncesPerLevel: se.bounces_per_level || 0,
      chainRangePerLevel: se.chain_range_per_level || 0,
      order: se.effect_order || 0
    });
  });
  
  // Build spell definitions
  spells.forEach(spell => {
    const effects = (effectsBySpell[spell.id] || []).map(effect => ({
      type: effect.type,
      name: effect.name,
      // Convert database structure to combat service format
      getStatusEffect: (heroLevel = 1) => {
        const statusEffect = { type: effect.type };
        
        switch (effect.type) {
          case 'poison':
            statusEffect.duration = Math.round((effect.baseDuration || 5000) + (heroLevel * effect.durationPerLevel));
            statusEffect.tickDamage = Math.round((effect.baseTickDamage || 5) + (heroLevel * effect.tickDamagePerLevel));
            statusEffect.tickRate = effect.baseTickRate || 1000;
            break;
            
          case 'freeze':
            statusEffect.duration = Math.round((effect.baseDuration || 10000) + (heroLevel * effect.durationPerLevel));
            break;
            
          case 'slow':
            statusEffect.duration = Math.round((effect.baseDuration || 4000) + (heroLevel * effect.durationPerLevel));
            statusEffect.slowPercent = Math.round((effect.baseSlowPercent || 50) + (heroLevel * effect.slowPercentPerLevel));
            break;
            
          case 'knockback':
            statusEffect.force = (effect.baseForce || 8) + (heroLevel * effect.forcePerLevel);
            break;
            
          case 'lifesteal':
            statusEffect.healPercent = Math.round((effect.baseHealPercent || 50) + (heroLevel * effect.healPercentPerLevel));
            break;
            
          case 'chain':
            statusEffect.bounces = Math.round((effect.baseBounces || 3) + (heroLevel * effect.bouncesPerLevel));
            statusEffect.chainRange = (effect.baseChainRange || 8) + (heroLevel * effect.chainRangePerLevel);
            break;
        }
        
        return statusEffect;
      }
    }));
    
    spellCache.set(spell.key, {
      id: spell.id,
      key: spell.key,
      name: spell.name,
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
      color: spell.color || '#ffffff',
      description: spell.description || '',
      icon: spell.icon || '✨',
      effects: effects,
      
      // Get scaled stats for a specific hero level
      getScaledStats: (heroLevel = 1) => {
        return {
          damage: Math.round(spell.base_damage + (heroLevel * (spell.damage_per_level || 0))),
          powerCost: Math.round(spell.base_power_cost + (heroLevel * (spell.power_cost_per_level || 0))),
          cooldown: Math.round(spell.base_cooldown + (heroLevel * (spell.cooldown_per_level || 0))),
          range: spell.base_range + (heroLevel * (spell.range_per_level || 0)),
          affectRange: spell.base_affect_range + (heroLevel * (spell.affect_range_per_level || 0)),
          statusEffects: effects.map(e => e.getStatusEffect(heroLevel))
        };
      }
    });
  });
  
  spellCacheLoaded = true;
  console.log(`[SpellService] Loaded ${spellCache.size} spells from database`);
}

/**
 * Get spell definition by key
 * @param {string} spellKey - Spell key (e.g., 'fire', 'ice')
 * @param {number} heroLevel - Optional hero level for scaled stats
 * @returns {Object|null} Spell definition or null if not found
 */
export function getSpell(spellKey, heroLevel = null) {
  if (!spellCacheLoaded) {
    loadSpellDefinitions();
  }
  
  const spell = spellCache.get(spellKey);
  if (!spell) return null;
  
  // If heroLevel is provided, return scaled stats
  if (heroLevel !== null && heroLevel !== undefined) {
    const scaled = spell.getScaledStats(heroLevel);
    return {
      ...spell,
      damage: scaled.damage,
      powerCost: scaled.powerCost,
      cooldown: scaled.cooldown,
      range: scaled.range,
      affectRange: scaled.affectRange,
      statusEffect: scaled.statusEffects.length > 0 ? scaled.statusEffects[0] : null,
      // For backwards compatibility, take first effect as statusEffect
      statusEffects: scaled.statusEffects
    };
  }
  
  // Return base spell definition
  return spell;
}

/**
 * Get all spell definitions
 * @returns {Map} Map of all spells (key -> spell)
 */
export function getAllSpells() {
  if (!spellCacheLoaded) {
    loadSpellDefinitions();
  }
  
  return spellCache;
}

/**
 * Reload spell definitions from database
 * Useful when spells are updated via admin panel
 */
export function reloadSpellDefinitions() {
  spellCache.clear();
  spellCacheLoaded = false;
  loadSpellDefinitions();
}

/**
 * Check if spells are loaded
 * @returns {boolean}
 */
export function areSpellsLoaded() {
  return spellCacheLoaded;
}

/**
 * Get spell for combat (with scaled stats for hero level)
 * This is the main function to use in combat service
 * @param {string} spellKey - Spell key
 * @param {number} heroLevel - Hero level
 * @returns {Object|null} Spell with scaled stats, ready for combat
 */
export function getSpellForCombat(spellKey, heroLevel) {
  const spell = getSpell(spellKey, heroLevel);
  if (!spell) return null;
  
  // Format for combat service (matches expected structure)
  return {
    name: spell.name,
    damage: spell.damage,
    powerCost: spell.powerCost,
    cooldown: spell.cooldown,
    range: spell.range,
    affectRange: spell.affectRange,
    color: spell.color,
    description: spell.description,
    icon: spell.icon,
    statusEffect: spell.statusEffect, // First effect for backwards compatibility
    statusEffects: spell.statusEffects || [] // All effects
  };
}

