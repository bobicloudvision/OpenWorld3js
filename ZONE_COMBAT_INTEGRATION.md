# Zone-Based Combat Integration

## Overview
This document describes the integration between the zone system and matchmaking/combat systems, ensuring that every combat instance is properly associated with a specific zone.

## Implementation Summary

### 1. Matchmaking Socket Handler (`sockets/matchmaking.js`)
**Changes:**
- When a player joins a matchmaking queue, the system now:
  - Captures the player's current zone using `zoneService.getPlayerZone(playerId)`
  - Validates that the player is in a zone before allowing queue entry
  - Includes the zone ID in the player data passed to the matchmaking service
  
**Code:**
```javascript
// Get player's current zone
const currentZoneId = zoneService.getPlayerZone(playerId);
if (!currentZoneId) {
  if (ack) return ack({ ok: false, error: 'You must be in a zone to join matchmaking' });
  return;
}

const playerData = {
  name: player.name,
  level: player.level || 1,
  heroData: player.active_hero_id ? { id: player.active_hero_id } : null,
  zoneId: currentZoneId // Track which zone player is queuing from
};
```

### 2. Matchmaking Service (`services/matchmakingService.js`)
**Changes:**
- Queue entries now store the zone ID where each player was when they joined:
  ```javascript
  const queueEntry = {
    playerId,
    playerName: playerData.name,
    playerLevel: playerData.level || 1,
    heroData: playerData.heroData,
    zoneId: playerData.zoneId, // Track zone player is queuing from
    joinedAt: Date.now()
  };
  ```

- Match objects now track:
  - `playerOriginZones`: Array of zones players came from (for reference/tracking)
  - `zoneId`: The arena zone where the combat will take place

- Enhanced logging to track zone transitions:
  ```javascript
  console.log(`[matchmaking] Match ${matchId} assigned to arena zone ${arenaZone.id} (${arenaZone.name})`);
  console.log(`[matchmaking] Players came from zones: ${match.playerOriginZones.join(', ')}`);
  ```

### 3. Combat Service (`services/combatService.js`)
**Changes:**
- Added validation logging when combat instances are initialized:
  ```javascript
  if (zoneId) {
    zoneService.registerCombatInZone(zoneId, combatInstanceId);
    console.log(`[combat] Combat ${combatInstanceId} registered in zone ${zoneId} (type: ${combatType}, matchmaking: ${isMatchmaking})`);
  } else {
    console.warn(`[combat] Combat ${combatInstanceId} initialized WITHOUT a zone! (type: ${combatType})`);
  }
  ```

- Ensures all combat instances are properly registered with the zone service

## Data Flow

### 1. Player Joins Queue
```
Player (in Zone A) → matchmaking:join → Captures current zone
                                      → Validates zone exists
                                      → Stores zone in queue entry
```

### 2. Match Creation
```
Queue has enough players → Create match
                        → Collect origin zones from all players
                        → Find suitable PvP arena zone
                        → Assign arena zone to match
                        → Log zone transition
```

### 3. Combat Initialization
```
Match starts → Initialize combat instance
            → Pass arena zone ID to combat
            → Register combat in zone service
            → Teleport players to arena
            → Combat tracked in specific zone
```

### 4. Combat Lifecycle
```
Combat active → Zone service tracks combat in arena
             → Players in arena zone
             → Zone stats show active combat
             
Combat ends → Unregister from zone service
           → Update zone stats
           → Players can travel to other zones
```

## Zone Service Integration

The zone service provides these functions for combat tracking:

- `registerCombatInZone(zoneId, combatInstanceId)` - Registers a combat instance in a zone
- `unregisterCombatFromZone(zoneId, combatInstanceId)` - Removes combat instance from zone
- `getZoneCombatInstances(zoneId)` - Returns all active combat instances in a zone
- `getZoneStats(zoneId)` - Returns zone statistics including combat count

## Benefits

1. **Full Traceability**: Every combat is associated with a specific zone
2. **Origin Tracking**: System tracks which zones players came from before matchmaking
3. **Zone Statistics**: Zones track how many active combats are happening
4. **Validation**: Players must be in a zone to join matchmaking
5. **Proper Cleanup**: Combat instances are properly registered and unregistered from zones
6. **Debugging**: Enhanced logging throughout the zone-combat lifecycle

## Database Tracking

Combat history records now include zone information:
- `zone_id`: The zone where the combat took place (arena zone)
- Player origin zones can be inferred from player data at queue join time

## Future Enhancements

Potential improvements:
1. Zone-specific matchmaking (match players from same zone)
2. Multiple arena zones with load balancing
3. Zone-based ELO/rating systems
4. Return players to origin zone after combat
5. Zone-specific combat rules or modifiers
6. Arena zone capacity limits

