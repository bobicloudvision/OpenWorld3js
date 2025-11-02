/**
 * Matchmaking Service
 * Handles PvP queues, player matching, and combat initiation with countdowns
 */

import * as zoneService from './zoneService.js';
import { initializeCombatInstance } from './combatService.js';
import { registerCombatInstance } from '../sockets/combat.js';
import { getActiveHeroForPlayer } from './playerService.js';
import * as enemyService from './enemyService.js';

// Queue storage
const queues = new Map(); // queueType -> Queue
const playerQueues = new Map(); // playerId -> queueType

// Match state
const activeMatches = new Map(); // matchId -> Match

/**
 * Queue Types and their requirements
 */
const QUEUE_TYPES = {
  duel: {
    name: 'Duel (1v1)',
    minPlayers: 2,
    maxPlayers: 2,
    countdownSeconds: 2,
    teams: false
  },
  '2v2': {
    name: 'Team Battle (2v2)',
    minPlayers: 4,
    maxPlayers: 4,
    countdownSeconds: 15,
    teams: true,
    teamSize: 2
  },
  '3v3': {
    name: 'Team Battle (3v3)',
    minPlayers: 6,
    maxPlayers: 6,
    countdownSeconds: 15,
    teams: true,
    teamSize: 3
  },
  ffa: {
    name: 'Free For All',
    minPlayers: 3,
    maxPlayers: 6,
    countdownSeconds: 10,
    teams: false
  },
  brawl: {
    name: 'Battle Royale',
    minPlayers: 4,
    maxPlayers: 10,
    countdownSeconds: 20,
    teams: false
  },
  // PvE Queue Types
  solo_pve: {
    name: 'Solo Adventure',
    minPlayers: 1,
    maxPlayers: 1,
    countdownSeconds: 5,
    teams: false,
    isPvE: true,
    enemyCount: 3, // Number of enemies to spawn
    enemyTypes: ['goblin-warrior'] // Enemy types to use
  },
  co_op: {
    name: 'Co-op Adventure',
    minPlayers: 2,
    maxPlayers: 4,
    countdownSeconds: 10,
    teams: false,
    isPvE: true,
    enemyCount: 6, // Scales with player count
    enemyTypes: ['goblin-warrior', 'dark-mage', 'orc-berserker']
  },
  elite_pve: {
    name: 'Elite Challenge',
    minPlayers: 1,
    maxPlayers: 3,
    countdownSeconds: 10,
    teams: false,
    isPvE: true,
    enemyCount: 8, // More challenging
    enemyTypes: ['orc-berserker', 'dark-mage'],
    enemyLevel: 'elite' // Harder enemies
  }
};

/**
 * Initialize a queue for a specific type
 */
function initializeQueue(queueType) {
  if (!queues.has(queueType)) {
    queues.set(queueType, {
      type: queueType,
      players: [],
      createdAt: Date.now()
    });
  }
  return queues.get(queueType);
}

/**
 * Add player to queue
 */
export function joinQueue(playerId, playerData, queueType, io) {
  // Check if queue type exists
  if (!QUEUE_TYPES[queueType]) {
    return { ok: false, error: 'Invalid queue type' };
  }

  // Check if player already in a queue
  if (playerQueues.has(playerId)) {
    return { ok: false, error: 'Already in queue' };
  }

  // Validate player has an active hero with health
  const activeHero = getActiveHeroForPlayer(playerId);
  if (!activeHero) {
    return { ok: false, error: 'You must select a hero before entering combat' };
  }

  // Check if hero has health (not defeated)
  if (!activeHero.health || activeHero.health <= 0) {
    return { ok: false, error: 'Your hero is defeated! Wait for regeneration before entering combat.' };
  }

  // Optional: Check if hero has minimum power (allow low power, regenerates in combat)
  // We'll just warn but not block
  if (!activeHero.power || activeHero.power < 10) {
    console.warn(`[matchmaking] Player ${playerId} joining with low power: ${activeHero.power}`);
  }

  // Get or create queue
  const queue = initializeQueue(queueType);
  
  // Add player to queue
  const queueEntry = {
    playerId,
    playerName: playerData.name,
    playerLevel: playerData.level || 1,
    heroData: playerData.heroData,
    zoneId: playerData.zoneId, // Track zone player is queuing from
    joinedAt: Date.now()
  };
  
  queue.players.push(queueEntry);
  playerQueues.set(playerId, queueType);

  console.log(`[matchmaking] Player ${playerId} joined ${queueType} queue (${queue.players.length}/${QUEUE_TYPES[queueType].minPlayers})`);

  // Broadcast queue update to all players in queue
  broadcastQueueUpdate(queueType, io);

  // Check if we have enough players to start
  checkAndStartMatch(queueType, io);

  return { 
    ok: true, 
    queueType,
    position: queue.players.length,
    minPlayers: QUEUE_TYPES[queueType].minPlayers,
    currentPlayers: queue.players.length
  };
}

/**
 * Remove player from queue
 */
export function leaveQueue(playerId, io) {
  const queueType = playerQueues.get(playerId);
  
  if (!queueType) {
    return { ok: false, error: 'Not in queue' };
  }

  const queue = queues.get(queueType);
  if (queue) {
    queue.players = queue.players.filter(p => p.playerId !== playerId);
    console.log(`[matchmaking] Player ${playerId} left ${queueType} queue`);
    
    // Broadcast update
    broadcastQueueUpdate(queueType, io);
  }

  playerQueues.delete(playerId);
  
  return { ok: true };
}

/**
 * Check if queue has enough players and start match
 * IMPORTANT: Only matches players from the SAME zone
 */
function checkAndStartMatch(queueType, io) {
  const queue = queues.get(queueType);
  const config = QUEUE_TYPES[queueType];

  if (!queue || queue.players.length < config.minPlayers) {
    return;
  }

  // Group players by zone ID
  const playersByZone = new Map();
  queue.players.forEach(player => {
    const zoneId = player.zoneId;
    if (!zoneId) {
      console.warn(`[matchmaking] Player ${player.playerId} has no zoneId, skipping`);
      return;
    }
    
    if (!playersByZone.has(zoneId)) {
      playersByZone.set(zoneId, []);
    }
    playersByZone.get(zoneId).push(player);
  });

  // Find the first zone that has enough players for a match
  let matchPlayers = null;
  let matchZoneId = null;

  for (const [zoneId, players] of playersByZone.entries()) {
    if (players.length >= config.minPlayers) {
      // Take the required number of players from this zone
      matchPlayers = players.slice(0, config.maxPlayers);
      matchZoneId = zoneId;
      console.log(`[matchmaking] Found ${matchPlayers.length} players in zone ${zoneId} for ${queueType} match`);
      break;
    }
  }

  // If no zone has enough players, don't create a match
  if (!matchPlayers || !matchZoneId) {
    console.log(`[matchmaking] Not enough players in same zone for ${queueType} match`);
    return;
  }

  // Remove matched players from queue
  const matchedPlayerIds = new Set(matchPlayers.map(p => p.playerId));
  queue.players = queue.players.filter(p => !matchedPlayerIds.has(p.playerId));
  
  // Remove players from tracking
  matchPlayers.forEach(p => playerQueues.delete(p.playerId));

  // Create match
  const matchId = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const match = {
    matchId,
    queueType,
    players: matchPlayers,
    state: 'countdown',
    countdownStarted: Date.now(),
    countdownDuration: config.countdownSeconds * 1000,
    zoneId: null, // Will be assigned to arena zone later
    playerOriginZones: [matchZoneId], // All players from same zone
    requiredZoneId: matchZoneId, // Track the zone requirement for validation
    combatInstanceId: null
  };

  activeMatches.set(matchId, match);

  console.log(`[matchmaking] ✅ Starting match ${matchId} for ${queueType} with ${matchPlayers.length} players from zone ${matchZoneId}`);

  // Start countdown
  startCountdown(matchId, io);

  return matchId;
}

/**
 * Start countdown for match
 */
function startCountdown(matchId, io) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  const config = QUEUE_TYPES[match.queueType];
  
  // Notify all players in match
  match.players.forEach(p => {
    io.to(p.playerId).emit('match:found', {
      matchId,
      queueType: match.queueType,
      players: match.players.map(pl => ({
        playerId: pl.playerId,
        playerName: pl.playerName,
        playerLevel: pl.playerLevel
      })),
      countdownSeconds: config.countdownSeconds
    });
  });

  // Countdown timer
  let secondsLeft = config.countdownSeconds;
  
  const countdownInterval = setInterval(() => {
    secondsLeft--;

    // Broadcast countdown update
    match.players.forEach(p => {
      io.to(p.playerId).emit('match:countdown', {
        matchId,
        secondsLeft
      });
    });

    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      startCombat(matchId, io);
    }
  }, 1000);

  // Store interval for cleanup
  match.countdownInterval = countdownInterval;
}

/**
 * Select the best arena zone for a match
 * Considers: load balancing, player origin zones, and arena availability
 */
function selectBestArena(arenaZones, playerOriginZones) {
  if (arenaZones.length === 0) return null;
  if (arenaZones.length === 1) return arenaZones[0];
  
  // Get combat load for each arena
  const arenaLoads = arenaZones.map(arena => {
    const stats = zoneService.getZoneStats(arena.id);
    return {
      arena,
      activeCombats: stats.combatCount || 0,
      playerCount: stats.playerCount || 0
    };
  });
  
  // Sort by load (least busy first)
  arenaLoads.sort((a, b) => {
    // First priority: fewer active combats
    if (a.activeCombats !== b.activeCombats) {
      return a.activeCombats - b.activeCombats;
    }
    // Second priority: fewer players
    return a.playerCount - b.playerCount;
  });
  
  // Log selection decision
  console.log('[matchmaking] Arena selection:');
  arenaLoads.forEach(({ arena, activeCombats, playerCount }) => {
    console.log(`  - ${arena.name} (ID: ${arena.id}): ${activeCombats} combats, ${playerCount} players`);
  });
  
  const selectedArena = arenaLoads[0].arena;
  console.log(`[matchmaking] Selected: ${selectedArena.name} (least busy)`);
  
  return selectedArena;
}

/**
 * Start the actual combat
 */
async function startCombat(matchId, io) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  const config = QUEUE_TYPES[match.queueType];

  // Get all available arena zones (PvP or PvE)
  const zones = await zoneService.getActiveZones();
  const isPvE = config.isPvE || false;
  const arenaZones = zones.filter(z => {
    if (isPvE) {
      // For PvE, use any combat zone (can be pve type or pvp type)
      return z.is_combat_zone;
    } else {
      // For PvP, use PvP arena zones
      return z.type === 'pvp' && z.is_combat_zone;
    }
  });
  
  if (arenaZones.length === 0) {
    console.error('[matchmaking] No arena zones found!');
    cancelMatch(matchId, io, 'No arena available');
    return;
  }

  // Select best arena based on load balancing
  const arenaZone = selectBestArena(arenaZones, match.playerOriginZones);
  
  if (!arenaZone) {
    console.error('[matchmaking] Failed to select arena zone!');
    cancelMatch(matchId, io, 'No arena available');
    return;
  }

  match.zoneId = arenaZone.id;
  
  console.log(`[matchmaking] Match ${matchId} assigned to arena zone ${arenaZone.id} (${arenaZone.name})`);
  console.log(`[matchmaking] Players came from zones: ${match.playerOriginZones.join(', ')}`);


  // Organize teams if needed
  let participants;
  if (config.teams) {
    // Split players into teams
    const team1 = match.players.slice(0, config.teamSize);
    const team2 = match.players.slice(config.teamSize);
    
    participants = {
      teams: [
        { teamId: 1, players: team1.map(p => p.playerId) },
        { teamId: 2, players: team2.map(p => p.playerId) }
      ],
      players: match.players.map(p => p.playerId)
    };
  } else {
    // Free for all
    participants = {
      players: match.players.map(p => p.playerId),
      teams: []
    };
  }

  // Spawn enemies for PvE matches
  let enemyIds = [];
  if (config.isPvE) {
    const spawnPos = JSON.parse(arenaZone.spawn_position);
    const enemyCount = config.enemyCount || 3;
    const enemyTypes = config.enemyTypes || ['goblin-warrior'];
    
    // Scale enemy count with player count for co-op
    const scaledEnemyCount = Math.ceil(enemyCount * (match.players.length / (config.maxPlayers || 1)));
    
    console.log(`[matchmaking] Spawning ${scaledEnemyCount} enemies for PvE match ${matchId}`);
    
    // Spawn enemies around the spawn position
    for (let i = 0; i < scaledEnemyCount; i++) {
      // Random enemy type from configured types
      const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      
      // Position enemies in a circle around spawn area
      const angle = (i / scaledEnemyCount) * Math.PI * 2;
      const radius = 10 + (i * 2); // Spread them out
      const enemyPosition = [
        spawnPos.x + Math.cos(angle) * radius,
        spawnPos.y || 0,
        spawnPos.z + Math.sin(angle) * radius
      ];
      
      const enemyId = `match-${matchId}-enemy-${i}`;
      enemyService.initializeEnemy(enemyId, enemyType, arenaZone.id, enemyPosition);
      enemyIds.push(enemyId);
      
      console.log(`[matchmaking] Spawned ${enemyType} enemy ${enemyId} at [${enemyPosition.join(', ')}]`);
    }
    
    // Add enemies to participants
    participants.enemies = enemyIds;
  }

  // Initialize combat instance in the arena zone
  const spawnPos = JSON.parse(arenaZone.spawn_position);
  const combatType = config.isPvE 
    ? (config.teams ? 'team_pve' : 'pve')
    : (config.teams ? 'team_pvp' : 'pvp');
    
  const combatInstanceId = initializeCombatInstance(
    combatType,
    participants,
    { center: [spawnPos.x, spawnPos.y, spawnPos.z], radius: 50 },
    arenaZone.id, // Combat takes place in arena zone
    true // This is a matchmaking battle
  );

  match.combatInstanceId = combatInstanceId;
  match.state = 'in_progress';

  // Register combat instance with global tick system
  registerCombatInstance(combatInstanceId);

  console.log(`[matchmaking] Combat started: ${combatInstanceId} in zone ${arenaZone.id} (${arenaZone.name})`);

  // Step 1: Transfer ALL players to arena zone FIRST (complete before sending any events)
  console.log(`[matchmaking] 📍 Transferring ${match.players.length} players to arena zone ${arenaZone.id}...`);
  for (const player of match.players) {
    const fromZoneId = player.zoneId; // Player's original zone
    try {
      // Remove from old zone 
      if (fromZoneId) {
        await zoneService.removePlayerFromZone(player.playerId, fromZoneId);
      }
      
      // Add to arena zone (forced - matchmaking already validated)
      await zoneService.addPlayerToZone(player.playerId, arenaZone.id, spawnPos);
      
      console.log(`[matchmaking] ✅ Transferred player ${player.playerId} from zone ${fromZoneId} to arena zone ${arenaZone.id}`);
    } catch (error) {
      console.error('[matchmaking] ❌ Error transferring player to arena zone:', error);
    }
  }
  
  // Small delay to ensure database writes complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 2: Notify ALL players about zone change (must happen BEFORE match:started)
  console.log(`[matchmaking] 📢 Notifying players about zone change...`);
  for (const player of match.players) {
    io.to(player.playerId).emit('zone:changed', { 
      zoneId: arenaZone.id, 
      position: spawnPos 
    });
  }
  
  // Small delay to let frontend process zone:changed before match:started
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Step 3: Notify ALL players that match has started
  console.log(`[matchmaking] 🎮 Notifying players that match has started...`);
  for (const player of match.players) {
    console.log(`[matchmaking] Emitting match:started to player ${player.playerId} (${player.playerName}) in room ${player.playerId}`);
    
    // Check how many sockets are in this room
    const socketsInRoom = await io.in(player.playerId).fetchSockets();
    console.log(`[matchmaking] Sockets in room ${player.playerId}: ${socketsInRoom.length}`);
    
    io.to(player.playerId).emit('match:started', {
      matchId,
      combatInstanceId,
      zone: arenaZone,
      position: spawnPos,
      teams: config.teams ? participants.teams : null,
      isPvE: config.isPvE || false,
      enemyCount: enemyIds.length,
      enemies: config.isPvE ? enemyIds : null // Include enemy IDs for PvE matches
    });
  }
  
  console.log(`[matchmaking] ✅ All ${match.players.length} players transferred and notified`);
}

/**
 * Cancel a match
 */
function cancelMatch(matchId, io, reason) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  // Clear countdown if exists
  if (match.countdownInterval) {
    clearInterval(match.countdownInterval);
  }

  // Clean up enemies if match was started (combat instance exists)
  if (match.combatInstanceId && match.zoneId) {
    // Get enemies spawned for this match and remove them
    const enemiesInZone = enemyService.getEnemiesInZone(match.zoneId);
    enemiesInZone.forEach(enemy => {
      if (enemy.id.startsWith(`match-${matchId}-`)) {
        enemyService.removeEnemy(enemy.id);
        console.log(`[matchmaking] Removed enemy ${enemy.id} from cancelled match`);
      }
    });
  }

  // Notify players
  match.players.forEach(p => {
    io.to(p.playerId).emit('match:cancelled', {
      matchId,
      reason
    });
    
    // Re-add to queue if they want
    playerQueues.delete(p.playerId);
  });

  activeMatches.delete(matchId);
  console.log(`[matchmaking] Match ${matchId} cancelled: ${reason}`);
}

/**
 * Handle player disconnect
 */
export function handlePlayerDisconnect(playerId, io) {
  // Remove from queue
  leaveQueue(playerId, io);

  // Check if player in active match
  for (const [matchId, match] of activeMatches.entries()) {
    const playerInMatch = match.players.find(p => p.playerId === playerId);
    if (playerInMatch) {
      if (match.state === 'countdown') {
        // Cancel match if still in countdown
        cancelMatch(matchId, io, 'Player disconnected');
      }
      // If in progress, combat service will handle it
    }
  }
}

/**
 * Broadcast queue update to all players in queue
 */
function broadcastQueueUpdate(queueType, io) {
  const queue = queues.get(queueType);
  const config = QUEUE_TYPES[queueType];
  
  if (!queue) return;

  const update = {
    queueType,
    currentPlayers: queue.players.length,
    minPlayers: config.minPlayers,
    maxPlayers: config.maxPlayers,
    players: queue.players.map(p => ({
      playerName: p.playerName,
      playerLevel: p.playerLevel
    }))
  };

  queue.players.forEach(p => {
    io.to(p.playerId).emit('queue:update', update);
  });
}

/**
 * Get queue info
 */
export function getQueueInfo(queueType) {
  const config = QUEUE_TYPES[queueType];
  const queue = queues.get(queueType);

  return {
    ...config,
    currentPlayers: queue ? queue.players.length : 0
  };
}

/**
 * Get all available queue types
 */
export function getAvailableQueues() {
  return Object.entries(QUEUE_TYPES).map(([type, config]) => {
    const queue = queues.get(type);
    return {
      type,
      ...config,
      currentPlayers: queue ? queue.players.length : 0
    };
  });
}

/**
 * Get player's current queue status
 */
export function getPlayerQueueStatus(playerId) {
  const queueType = playerQueues.get(playerId);
  
  if (!queueType) {
    return { inQueue: false };
  }

  const queue = queues.get(queueType);
  const config = QUEUE_TYPES[queueType];
  
  return {
    inQueue: true,
    queueType,
    ...config,
    currentPlayers: queue.players.length,
    position: queue.players.findIndex(p => p.playerId === playerId) + 1
  };
}

export { QUEUE_TYPES };

