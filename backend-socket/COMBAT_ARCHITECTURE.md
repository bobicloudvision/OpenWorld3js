# Combat System Architecture Proposal

## Overview
This document outlines the architecture for moving combat logic to the socket backend, supporting multiplayer combat, team systems, and both PvP and PvE scenarios.

## Core Principles

### 1. **Server Authority**
- All combat calculations happen on the server
- Client sends intentions (actions), server validates and executes
- Server broadcasts results to all affected clients
- Prevents cheating and ensures consistency

### 2. **Event-Driven Design**
- Combat actions are discrete events
- Events are timestamped and validated
- Supports replay and debugging

### 3. **Scalable State Management**
- Combat state stored in memory (Redis recommended for scale)
- Player/team state persisted to database after combat
- Session-based combat instances

### 4. **Team Abstraction**
- Teams are first-class entities
- Can contain players or NPCs
- Teams can fight other teams or enemies
- Unified combat system regardless of combatant type

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  - User input capture                                        │
│  - Visual feedback                                          │
│  - Local prediction                                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ Socket.IO Events
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Socket Backend (Node.js)                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Combat Service                            │   │
│  │  - Action validation                                 │   │
│  │  - Combat calculations                              │   │
│  │  - State management                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Team Service                               │   │
│  │  - Team management                                   │   │
│  │  - Team composition                                  │   │
│  │  - Team state                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Combat Instance Manager                    │   │
│  │  - Active combat sessions                            │   │
│  │  - Combat zones/areas                                │   │
│  │  - Combat state persistence                          │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ API Calls
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              PHP Backend (Laravel)                           │
│  - Data persistence                                          │
│  - Hero/Player data                                          │
│  - Team definitions                                          │
│  - Spell/Ability definitions                                 │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Combat Service (`services/combatService.js`)

**Responsibilities:**
- Validate combat actions (range, cooldowns, resources)
- Execute combat calculations (damage, status effects)
- Manage combat state (health, power, status effects)
- Resolve AoE effects
- Handle knockback, status effects, healing

**Key Methods:**
```javascript
- validateCombatAction(actorId, action, target)
- executeCombatAction(actorId, action, targetPosition)
- calculateDamage(source, target, spell)
- applyStatusEffect(targetId, effect, duration)
- processCombatTick(combatInstanceId)
```

### 2. Team Service (`services/teamService.js`)

**Responsibilities:**
- Create/manage teams
- Assign players/NPCs to teams
- Determine team relationships (allies, enemies)
- Manage team state

**Team Structure:**
```javascript
{
  teamId: string,
  name: string,
  members: [
    { type: 'player', playerId: number, socketId: string },
    { type: 'npc', npcId: number }
  ],
  allies: [teamId], // Other teams that are allies
  enemies: [teamId], // Other teams/enemies that can be attacked
  combatInstanceId: string | null
}
```

### 3. Combat Instance Manager (`services/combatInstanceService.js`)

**Responsibilities:**
- Track active combat sessions
- Manage combat zones/areas
- Cleanup completed combat
- Persist combat results

**Combat Instance Structure:**
```javascript
{
  combatInstanceId: string,
  combatType: 'pvp' | 'pve' | 'team_pvp' | 'team_pve',
  participants: {
    teams: [teamId],
    individualPlayers: [playerId],
    enemies: [enemyId]
  },
  zone: {
    center: [x, y, z],
    radius: number
  },
  state: {
    active: boolean,
    startTime: timestamp,
    endTime: timestamp | null
  },
  combatLog: []
}
```

## Data Flow: Combat Action

### 1. Player Initiates Action
```javascript
// Frontend
socket.emit('combat:cast-spell', {
  spellKey: 'fire',
  targetPosition: [x, y, z],
  timestamp: Date.now()
})
```

### 2. Server Validates
```javascript
// Socket Handler
socket.on('combat:cast-spell', async (data) => {
  const playerId = getPlayerIdBySocket(socket.id)
  const validation = await combatService.validateSpellCast(
    playerId, 
    data.spellKey, 
    data.targetPosition
  )
  
  if (!validation.success) {
    socket.emit('combat:error', validation.error)
    return
  }
  
  // Execute action
  const result = await combatService.executeSpellCast(
    playerId,
    data.spellKey,
    data.targetPosition
  )
  
  // Broadcast to relevant players
  broadcastCombatResult(result)
})
```

### 3. Server Broadcasts Result
```javascript
// Broadcast to all players in combat zone
io.to(combatZone.room).emit('combat:action-resolved', {
  actorId: playerId,
  actionType: 'spell-cast',
  spellKey: 'fire',
  targetPosition: [x, y, z],
  affectedTargets: [
    { targetId: enemyId, damage: 25, effects: [] }
  ],
  timestamp: Date.now()
})
```

### 4. Clients Update UI
```javascript
// Frontend
socket.on('combat:action-resolved', (result) => {
  // Update local state
  // Show visual effects
  // Update health bars, etc.
})
```

## Team System Architecture

### Team Creation
```javascript
// Create team
POST /api/teams
{
  name: "Team Alpha",
  playerIds: [1, 2, 3]
}

// Join team (via socket)
socket.emit('team:join', { teamId: 'team-123' })
```

### Team Combat Flow
```javascript
// Team A vs Team B
combatService.initiateTeamCombat(teamAId, teamBId)

// Team A vs Enemies
combatService.initiatePvECombat(teamAId, enemyGroupId)

// Individual Player vs Enemy
combatService.initiatePvECombat(playerId, enemyId)
```

### Team Relationships
```javascript
// Teams can be:
// - Neutral (default)
// - Allied (won't attack each other)
// - Enemies (can attack each other)
// - Enemies automatically determined by team membership
```

## Combat State Management

### In-Memory State (Redis Recommended)
```javascript
// Combat state structure
{
  combatInstances: {
    [combatInstanceId]: {
      participants: {...},
      state: {...},
      log: [...]
    }
  },
  players: {
    [playerId]: {
      health: number,
      power: number,
      statusEffects: [...],
      position: [x, y, z],
      teamId: string | null
    }
  },
  enemies: {
    [enemyId]: {
      health: number,
      position: [x, y, z],
      teamId: string | null
    }
  }
}
```

### Persistence Strategy
```javascript
// After combat ends:
1. Calculate rewards (XP, loot, etc.)
2. Update player stats in database
3. Update hero stats if applicable
4. Log combat result
5. Clear in-memory combat state
```

## File Structure

```
backend-socket/
├── services/
│   ├── combatService.js          # Core combat logic
│   ├── combatInstanceService.js  # Combat session management
│   ├── teamService.js            # Team management
│   ├── spellService.js           # Spell definitions & validation
│   ├── statusEffectService.js    # Status effect processing
│   └── combatValidator.js        # Action validation
├── sockets/
│   ├── combat.js                 # Combat socket handlers
│   └── team.js                   # Team socket handlers
├── models/
│   ├── CombatInstance.js         # Combat instance model
│   ├── Team.js                   # Team model
│   └── CombatAction.js           # Combat action model
└── utils/
    ├── combatCalculations.js     # Damage/range calculations
    └── positionUtils.js          # Position validation
```

## Migration Strategy

### Phase 1: Extract Combat Logic
1. Create `combatService.js` with combat calculations
2. Move spell definitions to backend
3. Create socket handlers for combat actions
4. Keep frontend for visualization only

### Phase 2: Add Team Support
1. Create `teamService.js`
2. Implement team creation/management APIs
3. Update combat service to support teams
4. Add team UI to frontend

### Phase 3: Add Combat Instances
1. Create combat zone system
2. Implement combat session management
3. Add combat persistence
4. Add combat history/replay

### Phase 4: Optimize & Scale
1. Add Redis for state management
2. Implement combat instance sharding
3. Add load balancing for multiple combat zones
4. Optimize network traffic

## Security Considerations

1. **Rate Limiting**: Prevent spam attacks
   ```javascript
   // Limit actions per second
   const rateLimit = rateLimiter.createLimiter({
     points: 10, // actions
     duration: 1, // per second
   })
   ```

2. **Input Validation**: Validate all positions, ranges, cooldowns
   ```javascript
   // Server-side validation
   if (distance > spell.range) {
     return { success: false, error: 'Out of range' }
   }
   ```

3. **State Reconciliation**: Handle client/server desync
   ```javascript
   // Server sends periodic state snapshots
   setInterval(() => {
     broadcastCombatState(combatInstanceId)
   }, 1000)
   ```

4. **Cheat Prevention**: All calculations server-side
   - Never trust client damage values
   - Always validate cooldowns server-side
   - Validate resource costs server-side

## Performance Considerations

1. **Event Batching**: Batch multiple combat events
   ```javascript
   // Batch events within 50ms window
   const batchedEvents = batchEvents(events, 50)
   ```

2. **Spatial Partitioning**: Only process nearby combatants
   ```javascript
   // Only check enemies/players within combat range
   const nearbyTargets = getTargetsInRange(position, maxRange)
   ```

3. **Lazy Updates**: Update UI on state changes, not ticks
   ```javascript
   // Only broadcast when state actually changes
   if (stateChanged) {
     broadcastStateUpdate()
   }
   ```

## Example Combat Flow

```javascript
// 1. Player casts spell
socket.emit('combat:cast-spell', {
  spellKey: 'fire',
  targetPosition: [10, 0, 5]
})

// 2. Server validates
const validation = combatService.validateSpellCast(playerId, 'fire', [10, 0, 5])
// Checks: range, cooldown, power cost, target validity

// 3. Server executes
const result = combatService.executeSpellCast(playerId, 'fire', [10, 0, 5])
// Calculates: damage, AoE, status effects, knockback

// 4. Server updates state
combatInstance.updateParticipantState(result.affectedTargets)

// 5. Server broadcasts
io.to(combatZone.room).emit('combat:action-resolved', {
  actorId: playerId,
  action: 'fire',
  result: result
})

// 6. Check win/loss conditions
if (allEnemiesDefeated(combatInstance)) {
  combatService.endCombat(combatInstanceId, 'victory')
}
```

## Database Schema (Future)

```sql
-- Teams table
CREATE TABLE teams (
  id PRIMARY KEY,
  name VARCHAR(255),
  leader_id INTEGER,
  created_at TIMESTAMP
);

-- Team members
CREATE TABLE team_members (
  team_id INTEGER,
  player_id INTEGER,
  role VARCHAR(50), -- 'leader', 'member'
  joined_at TIMESTAMP
);

-- Combat instances (for history)
CREATE TABLE combat_instances (
  id PRIMARY KEY,
  combat_type VARCHAR(50),
  participants JSON, -- { teams: [], players: [], enemies: [] }
  result VARCHAR(50), -- 'victory', 'defeat', 'draw'
  duration INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Combat logs
CREATE TABLE combat_logs (
  id PRIMARY KEY,
  combat_instance_id INTEGER,
  actor_id INTEGER,
  action_type VARCHAR(50),
  target_id INTEGER,
  damage INTEGER,
  timestamp TIMESTAMP
);
```

## Next Steps

1. **Review and approve architecture**
2. **Create initial combat service skeleton**
3. **Implement basic spell casting**
4. **Add team service foundation**
5. **Migrate existing combat logic piece by piece**
6. **Test with single player first**
7. **Add multiplayer combat**
8. **Implement team system**

