/**
 * Matchmaking Service
 * Handles PvP queues, player matching, and combat initiation with countdowns
 */

import * as zoneService from './zoneService.js';
import { initializeCombatInstance } from './combatService.js';
import { registerCombatInstance } from '../sockets/combat.js';
import { getActiveHeroForPlayer } from './playerService.js';

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
    countdownSeconds: 10,
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
 */
function checkAndStartMatch(queueType, io) {
  const queue = queues.get(queueType);
  const config = QUEUE_TYPES[queueType];

  if (!queue || queue.players.length < config.minPlayers) {
    return;
  }

  // Take required number of players
  const matchPlayers = queue.players.splice(0, config.maxPlayers);
  
  // Remove players from tracking
  matchPlayers.forEach(p => playerQueues.delete(p.playerId));

  // Create match
  const matchId = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Collect zones players are coming from (for reference/tracking)
  const playerZones = matchPlayers.map(p => p.zoneId).filter(Boolean);
  
  const match = {
    matchId,
    queueType,
    players: matchPlayers,
    state: 'countdown',
    countdownStarted: Date.now(),
    countdownDuration: config.countdownSeconds * 1000,
    zoneId: null, // Will be assigned to arena zone
    playerOriginZones: playerZones, // Track where players came from
    combatInstanceId: null
  };

  activeMatches.set(matchId, match);

  console.log(`[matchmaking] Starting match ${matchId} for ${queueType} with ${matchPlayers.length} players`);

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
 * Start the actual combat
 */
async function startCombat(matchId, io) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  const config = QUEUE_TYPES[match.queueType];

  // Find a suitable arena zone for PvP combat
  const zones = await zoneService.getActiveZones();
  const arenaZone = zones.find(z => z.type === 'pvp' && z.is_combat_zone);
  
  if (!arenaZone) {
    console.error('[matchmaking] No arena zone found!');
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

  // Initialize combat instance in the arena zone
  const spawnPos = JSON.parse(arenaZone.spawn_position);
  const combatInstanceId = initializeCombatInstance(
    config.teams ? 'team_pvp' : 'pvp',
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

  // Teleport all players to arena and notify
  for (const player of match.players) {
    // Add player to zone
    try {
      await zoneService.addPlayerToZone(player.playerId, arenaZone.id, spawnPos);
    } catch (error) {
      console.error('[matchmaking] Error adding player to zone:', error);
    }

    // Notify player
    console.log(`[matchmaking] Emitting match:started to player ${player.playerId} (${player.playerName}) in room ${player.playerId}`);
    console.log(`[matchmaking] Event data:`, { matchId, combatInstanceId, zoneName: arenaZone.name });
    
    // Check how many sockets are in this room
    const socketsInRoom = await io.in(player.playerId).fetchSockets();
    console.log(`[matchmaking] Sockets in room ${player.playerId}: ${socketsInRoom.length}`);
    
    io.to(player.playerId).emit('match:started', {
      matchId,
      combatInstanceId,
      zone: arenaZone,
      position: spawnPos,
      teams: config.teams ? participants.teams : null
    });
  }
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

