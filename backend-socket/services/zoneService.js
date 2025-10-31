import { getDb } from './db.js';

/**
 * Zone Management Service
 * Handles all zone-related operations, player transitions, and zone state
 */

// Helper function to query the database
function query(sql, params = []) {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    const result = stmt.all(...params);
    return result;
  } catch (error) {
    console.error('[zone] Database query error:', error);
    throw error;
  }
}

/**
 * Get player by ID
 */
export function getPlayerById(playerId) {
  try {
    const players = query(`SELECT * FROM players WHERE id = ?`, [playerId]);
    return players;
  } catch (error) {
    console.error('[zone] Error fetching player:', error);
    return [];
  }
}

// In-memory zone state
const zoneStates = new Map(); // zoneId -> { players: Map<playerId, playerData>, combatInstances: Set }

/**
 * Initialize zone state
 */
export function initializeZone(zoneId) { 
  if (!zoneStates.has(zoneId)) {
    zoneStates.set(zoneId, {
      players: new Map(),
      combatInstances: new Set(),
      lastActivity: Date.now()
    });
    console.log(`[zone] Initialized zone ${zoneId}`);
  }
  return zoneStates.get(zoneId);
}

/**
 * Get all active zones from database
 */
export async function getActiveZones() {
  try {
    const zones = await query(
      `SELECT * FROM zones WHERE is_active = 1 ORDER BY name ASC`
    );
    return zones;
  } catch (error) {
    console.error('[zone] Error fetching zones:', error);
    return [];
  }
}

/**
 * Get zone by ID
 */
export async function getZoneById(zoneId) {
  try {
    const [zone] = await query(
      `SELECT * FROM zones WHERE id = ? AND is_active = 1`,
      [zoneId]
    );
    return zone || null;
  } catch (error) {
    console.error('[zone] Error fetching zone:', error);
    return null;
  }
}

/**
 * Get zone by slug
 */
export async function getZoneBySlug(slug) {
  try {
    const [zone] = await query(
      `SELECT * FROM zones WHERE slug = ? AND is_active = 1`,
      [slug]
    );
    return zone || null;
  } catch (error) {
    console.error('[zone] Error fetching zone by slug:', error);
    return null;
  }
}

/**
 * Get portals from a zone
 */
export async function getZonePortals(zoneId) {
  try {
    const portals = await query(
      `SELECT zp.*, z.name as to_zone_name, z.slug as to_zone_slug
       FROM zone_portals zp
       JOIN zones z ON zp.to_zone_id = z.id
       WHERE zp.from_zone_id = ? AND zp.is_active = 1 AND z.is_active = 1`,
      [zoneId]
    );
    return portals;
  } catch (error) {
    console.error('[zone] Error fetching portals:', error);
    return [];
  }
}

/**
 * Check if player can enter zone
 */
export async function canPlayerEnterZone(player, zoneId) {
  const zone = await getZoneById(zoneId);
  
  if (!zone) {
    return { allowed: false, reason: 'Zone not found or inactive' };
  }

  // Get player's active hero level
  const [playerHero] = await query(
    `SELECT level FROM player_heroes WHERE id = ?`,
    [player.active_hero_id]
  );
  
  const playerLevel = playerHero?.level || 1;

  // Check min level
  if (playerLevel < zone.min_level) {
    return { 
      allowed: false, 
      reason: `Level ${zone.min_level} required (you are level ${playerLevel})` 
    };
  }

  // Check max level
  if (zone.max_level && playerLevel > zone.max_level) {
    return { 
      allowed: false, 
      reason: `Max level ${zone.max_level} (you are level ${playerLevel})` 
    };
  }

  // Check capacity
  const zoneState = zoneStates.get(zoneId);
  if (zoneState && zoneState.players.size >= zone.max_players) {
    return { 
      allowed: false, 
      reason: 'Zone is full' 
    };
  }

  return { allowed: true, zone };
}

/**
 * Add player to zone
 */
export async function addPlayerToZone(playerId, zoneId, position = null) {
  const zoneState = initializeZone(zoneId);
  const zone = await getZoneById(zoneId);
  
  if (!zone) {
    throw new Error('Zone not found');
  }

  // Parse spawn position
  const spawnPos = position || JSON.parse(zone.spawn_position);
  
  // Add to memory state
  zoneState.players.set(playerId, {
    playerId,
    zoneId,
    position: spawnPos,
    joinedAt: Date.now()
  });

  // Update database
  try {
    await query(
      `UPDATE players 
       SET current_zone_id = ?, zone_position = ?, zone_entered_at = NOW()
       WHERE id = ?`,
      [zoneId, JSON.stringify(spawnPos), playerId]
    );
  } catch (error) {
    console.error('[zone] Error updating player zone in DB:', error);
  }

  console.log(`[zone] Player ${playerId} entered zone ${zoneId}`);
  return { zone, position: spawnPos };
}

/**
 * Remove player from zone
 */
export async function removePlayerFromZone(playerId, zoneId) {
  const zoneState = zoneStates.get(zoneId);
  
  if (zoneState) {
    zoneState.players.delete(playerId);
    console.log(`[zone] Player ${playerId} left zone ${zoneId}`);
    
    // Clean up empty zones after 5 minutes
    if (zoneState.players.size === 0) {
      setTimeout(() => {
        const state = zoneStates.get(zoneId);
        if (state && state.players.size === 0) {
          zoneStates.delete(zoneId);
          console.log(`[zone] Cleaned up empty zone ${zoneId}`);
        }
      }, 5 * 60 * 1000);
    }
  }
}

/**
 * Get all players in a zone
 */
export function getPlayersInZone(zoneId) {
  const zoneState = zoneStates.get(zoneId);
  return zoneState ? Array.from(zoneState.players.values()) : [];
}

/**
 * Get player's current zone
 */
export function getPlayerZone(playerId) {
  for (const [zoneId, state] of zoneStates.entries()) {
    if (state.players.has(playerId)) {
      return zoneId;
    }
  }
  return null;
}

/**
 * Move player between zones
 */
export async function transferPlayerToZone(playerId, fromZoneId, toZoneId, position = null) {
  // Check if player can enter
  const player = await query(`SELECT * FROM players WHERE id = ?`, [playerId]);
  if (!player[0]) {
    throw new Error('Player not found');
  }

  const check = await canPlayerEnterZone(player[0], toZoneId);
  if (!check.allowed) {
    throw new Error(check.reason);
  }

  // Remove from old zone
  if (fromZoneId) {
    await removePlayerFromZone(playerId, fromZoneId);
  }

  // Add to new zone
  return await addPlayerToZone(playerId, toZoneId, position);
}

/**
 * Register combat instance in zone
 */
export function registerCombatInZone(zoneId, combatInstanceId) {
  const zoneState = initializeZone(zoneId);
  zoneState.combatInstances.add(combatInstanceId);
  console.log(`[zone] Registered combat ${combatInstanceId} in zone ${zoneId}`);
}

/**
 * Unregister combat instance from zone
 */
export function unregisterCombatFromZone(zoneId, combatInstanceId) {
  const zoneState = zoneStates.get(zoneId);
  if (zoneState) {
    zoneState.combatInstances.delete(combatInstanceId);
    console.log(`[zone] Unregistered combat ${combatInstanceId} from zone ${zoneId}`);
  }
}

/**
 * Get active combat instances in zone
 */
export function getZoneCombatInstances(zoneId) {
  const zoneState = zoneStates.get(zoneId);
  return zoneState ? Array.from(zoneState.combatInstances) : [];
}

/**
 * Get zone statistics
 */
export function getZoneStats(zoneId) {
  const zoneState = zoneStates.get(zoneId);
  if (!zoneState) {
    return { playerCount: 0, combatCount: 0, active: false };
  }

  return {
    playerCount: zoneState.players.size,
    combatCount: zoneState.combatInstances.size,
    active: true,
    lastActivity: zoneState.lastActivity
  };
}

/**
 * Get all zone statistics
 */
export function getAllZoneStats() {
  const stats = {};
  for (const [zoneId, state] of zoneStates.entries()) {
    stats[zoneId] = {
      playerCount: state.players.size,
      combatCount: state.combatInstances.size,
      lastActivity: state.lastActivity
    };
  }
  return stats;
}

// All functions are already exported above

