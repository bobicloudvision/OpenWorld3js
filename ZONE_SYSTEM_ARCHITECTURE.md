# Multi-Location Zone System Architecture

## Overview

This document describes the complete architecture for the multi-location zone system that allows players to explore different 3D maps, engage in location-based combat, and travel between zones.

## Architecture Components

### 1. Backend-PHP (Database Layer)

#### Database Tables

**`zones` Table**
- Stores all zone/location definitions
- Fields:
  - `id`: Primary key
  - `name`: Zone display name (e.g., "Starter Lobby")
  - `slug`: URL-friendly identifier (e.g., "starter-lobby")
  - `type`: Zone type (neutral, pvp, pve, raid, dungeon)
  - `map_file`: 3D model file (e.g., "world1.glb")
  - `environment_file`: HDR environment (e.g., "models/night.hdr")
  - `spawn_position`: JSON {x, y, z} spawn point
  - `min_level`, `max_level`: Level requirements
  - `max_players`: Capacity limit
  - `is_combat_zone`: Boolean - allows combat
  - `is_safe_zone`: Boolean - prevents combat (like lobby)
  - `settings`: JSON for custom settings (gravity, lighting, etc.)

**`players` Table (Updated)**
- Added fields:
  - `current_zone_id`: Foreign key to zones
  - `zone_position`: JSON {x, y, z} last position
  - `zone_entered_at`: Timestamp

**`zone_portals` Table**
- Defines portals/transitions between zones
- Fields:
  - `from_zone_id`, `to_zone_id`: Zone connections
  - `portal_position`: Location in source zone
  - `destination_position`: Spawn point in target zone
  - `portal_name`: Display name
  - `min_level_required`: Level requirement
  - `is_active`: Enable/disable portal

#### Models

**`Zone` Model**
- Eloquent relationships to players, portals
- `canPlayerEnter(Player $player)` - validation logic

**`ZonePortal` Model**
- Relationships to source/destination zones
- `canPlayerUse(Player $player)` - level checks

**`Player` Model (Updated)**
- `currentZone()` relationship
- Tracks player's current location

#### Filament Admin Resource

**`ZoneResource`**
- Full CRUD interface for zone management
- Configure zone properties, settings, portals
- Real-time player counts
- Filter by type, activity status

---

### 2. Backend-Socket (Game Server Layer)

#### Services

**`zoneService.js`** - Core zone management
```javascript
// Key Functions:
- getActiveZones() // List all available zones
- getZoneById(zoneId) // Get zone details
- canPlayerEnterZone(player, zoneId) // Validation
- addPlayerToZone(playerId, zoneId, position) // Join zone
- removePlayerFromZone(playerId, zoneId) // Leave zone
- transferPlayerToZone(playerId, from, to, position) // Move between zones
- registerCombatInZone(zoneId, combatId) // Track combat
- getZoneStats(zoneId) // Real-time statistics
```

**In-Memory State:**
```javascript
zoneStates = Map<zoneId, {
  players: Map<playerId, playerData>,
  combatInstances: Set<combatInstanceId>,
  lastActivity: timestamp
}>
```

**`combatService.js` (Updated)**
- Added `zoneId` parameter to `initializeCombatInstance()`
- Automatically registers combat with zone
- Unregisters on combat end
- Enables zone-specific combat tracking

#### Socket Handlers

**`zone.js` - Socket Events**

**Client → Server:**
- `zone:list` - Get all available zones
- `zone:get` - Get specific zone details
- `zone:join` - Join a zone
- `zone:leave` - Leave current zone
- `zone:portal:use` - Use a portal to travel
- `zone:portals` - Get portals in current zone
- `zone:stats` - Get all zone statistics

**Server → Client:**
- `player:joined` - Notify when player enters zone
- `player:left` - Notify when player leaves zone
- `zone:list` - Zone list response
- `zone:get` - Zone details response

---

### 3. Frontend (Client Layer)

#### Zone Integration

**Current Scenes:**
- `LobbyScene.jsx` - Safe zone (no combat)
- `GameplayScene.jsx` - Battle zone (with combat)

**Needed Additions:**
```
frontend/src/
├── stores/
│   └── zoneStore.js          # Zone state management
├── services/
│   └── zoneService.js        # Zone API calls
└── components/
    ├── ZoneSelector.jsx      # Zone selection UI
    ├── ZonePortal.jsx        # 3D portal objects
    ├── ZoneTransition.jsx    # Loading/transition screen
    └── DynamicScene.jsx      # Loads maps dynamically
```

#### Implementation Flow

1. **Zone Selection**
   ```jsx
   <ZoneSelector 
     zones={availableZones}
     currentZone={currentZone}
     onSelectZone={(zone) => handleZoneTransition(zone)}
   />
   ```

2. **Zone Transition**
   - Emit `zone:leave` for current zone
   - Show loading screen
   - Emit `zone:join` for new zone
   - Load new 3D map
   - Spawn at designated position
   - Emit `combat:leave` if in combat

3. **Dynamic Map Loading**
   ```jsx
   <Ground 
     mapFile={currentZone.map_file}
     environmentFile={currentZone.environment_file}
     disableCombat={currentZone.is_safe_zone}
   />
   ```

4. **Portal System**
   - Render 3D portal objects at portal positions
   - Show portal name and destination on hover
   - Click to use portal
   - Check level requirements
   - Automatic zone transition

---

## Combat Zone Management

### How Combat Works Across Zones

1. **Zone Restrictions**
   - Combat only allowed in `is_combat_zone = true` zones
   - Safe zones (`is_safe_zone = true`) block all combat actions
   - Ground component respects `disableCombat` prop

2. **Combat Initialization**
   ```javascript
   // In combat.js socket handler
   const playerZone = zoneService.getPlayerZone(playerId);
   const combatInstanceId = initializeCombatInstance(
     'pve',
     { players: [playerId], enemies: [] },
     { center: [0,0,0], radius: 150 },
     playerZone  // ← Zone ID passed here
   );
   ```

3. **Zone-Specific Combat**
   - Each combat instance is registered to a zone
   - Zone tracks all active combats
   - Players can only join combat in their current zone
   - Leaving zone automatically leaves combat

4. **Combat Cleanup**
   - When combat ends, unregisters from zone
   - Empty zones cleaned up after 5 minutes
   - Disconnect removes player from zone and combat

---

## Data Flow

### Player Joins Zone

```
Client                 Socket Server           Database
  |                         |                      |
  |--- zone:join(zoneId) -->|                      |
  |                         |--- canPlayerEnter -->|
  |                         |<-- zone data --------|
  |                         |                      |
  |                         |--- addPlayerToZone ->|
  |                         |<-- success ----------|
  |                         |                      |
  |<-- zone:joined ---------|                      |
  |    (zone, position)     |                      |
  |                         |                      |
  |                         |-- broadcast -------->|
  |<-- player:joined -------|    to zone room      |
```

### Player Uses Portal

```
Client                 Socket Server           Database
  |                         |                      |
  |-- portal:use(id) ------>|                      |
  |                         |--- get portal ------>|
  |                         |<-- portal data ------|
  |                         |--- level check ----->|
  |                         |<-- allowed ----------|
  |                         |                      |
  |                         |--- transferPlayer -->|
  |                         |<-- new zone ---------|
  |                         |                      |
  |<-- zone changed --------|                      |
  |    (new zone, pos)      |                      |
```

---

## Migration Guide

### Step 1: Database Setup

```bash
cd backend-php
php artisan migrate
php artisan db:seed --class=ZoneSeeder
```

This creates:
- 4 starter zones (Lobby, Training Grounds, Dark Forest, Arena)
- 3 portals connecting them
- Updates player table structure

### Step 2: Backend-Socket (Already Done)

- ✅ zoneService.js created
- ✅ zone.js socket handlers created
- ✅ combatService.js updated
- ✅ Registered in sockets/index.js

### Step 3: Frontend Updates (Next Steps)

1. Create zone store for state management
2. Update Ground component to accept dynamic map files
3. Create ZoneSelector UI
4. Create Portal 3D objects
5. Add zone transition logic
6. Update LobbyScene/GameplayScene to use zones

---

## Example Zone Configurations

### Safe Lobby
```json
{
  "name": "Starter Lobby",
  "type": "neutral",
  "is_combat_zone": false,
  "is_safe_zone": true,
  "settings": {
    "gravity": -20,
    "ambientLight": 0.7
  }
}
```

### PvE Zone
```json
{
  "name": "Dark Forest",
  "type": "pve",
  "min_level": 5,
  "is_combat_zone": true,
  "is_safe_zone": false,
  "settings": {
    "ambientLight": 0.3,
    "fog": true,
    "fogDensity": 0.05
  }
}
```

### PvP Arena
```json
{
  "name": "Arena of Champions",
  "type": "pvp",
  "min_level": 10,
  "max_players": 20,
  "is_combat_zone": true,
  "settings": {
    "gravity": -20,
    "respawnEnabled": true
  }
}
```

---

## Benefits

✅ **Scalable**: Add unlimited zones without code changes
✅ **Flexible**: Each zone has independent settings  
✅ **Organized**: Combat tracked per-zone  
✅ **Level-Gated**: Control zone access by player level  
✅ **Admin-Friendly**: Full Filament UI for zone management  
✅ **Performance**: In-memory zone state for fast lookups  
✅ **Safe**: Automatic combat cleanup on disconnect  

---

## Next Steps

1. ✅ Database migrations and models
2. ✅ Backend-socket services
3. ✅ Socket handlers
4. ⏳ Frontend zone management
5. ⏳ 3D portal objects
6. ⏳ Zone transition UI
7. ⏳ Dynamic map loading

---

## Future Enhancements

- **Instanced Zones**: Multiple copies of same zone (e.g., dungeons)
- **Zone Events**: Timed events in specific zones
- **Weather System**: Per-zone weather and time of day
- **Zone Chat**: Separate chat channels per zone
- **Zone Quests**: Location-specific missions
- **Zone Leaderboards**: Per-zone rankings
- **Cross-Zone Trading**: Auction house system
- **Zone Buffs/Debuffs**: Environmental effects

