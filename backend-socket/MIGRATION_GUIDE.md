# Migration Guide: Moving Combat to Backend

## Overview
This guide will help you migrate from client-side combat logic to server-authoritative combat system.

## Step 1: Test Backend Infrastructure

### 1.1 Start Socket Server
```bash
cd backend-socket
node server.js
```

### 1.2 Verify Socket Handlers
The following socket events are now available:
- `combat:join` - Join/create combat instance
- `combat:cast-spell` - Cast a spell
- `combat:position-update` - Update position in combat
- `combat:leave` - Leave combat
- `combat:state-request` - Request current combat state

## Step 2: Update Frontend to Use Socket Events

### 2.1 Replace `castMagic` calls

**Before (in gameStore.js):**
```javascript
castMagic: (magicType, targetId = null) => {
  // Client-side validation and execution
}
```

**After:**
```javascript
// In your component or service
socket.emit('combat:cast-spell', {
  spellKey: magicType,
  targetPosition: [x, y, z]
})

socket.on('combat:action-resolved', (result) => {
  // Update local state with server result
  updateEnemyHealth(result.affectedTargets)
  showVisualEffects(result)
})
```

### 2.2 Update Combat State Management

**Remove from gameStore.js:**
- `attackEnemy` - Server handles this
- `castMagic` - Server handles this
- `castMagicAtPosition` - Server handles this
- Combat calculations

**Keep in gameStore.js:**
- UI state (selectedMagic, castingMode)
- Visual effects triggers
- Local prediction for smooth UI

### 2.3 Initialize Combat Session

```javascript
// When entering combat zone or starting fight
socket.emit('combat:join', {
  enemyIds: [1, 2, 3], // Enemy IDs
  zoneCenter: [0, 0, 0],
  zoneRadius: 100
})

socket.on('combat:joined', (data) => {
  // Store combatInstanceId
  // Update UI with combat state
})
```

## Step 3: Handle Server Events

### 3.1 Combat State Updates

```javascript
socket.on('combat:state-update', (combatState) => {
  // Update enemy health bars
  // Update player stats
  // Update status effects
  updateCombatUI(combatState)
})

socket.on('combat:action-resolved', (result) => {
  // Show spell effects
  // Update damage numbers
  // Update health bars
  showActionResult(result)
})
```

### 3.2 Combat End

```javascript
socket.on('combat:ended', (result) => {
  if (result.result === 'victory') {
    // Show victory screen
    // Award rewards
  } else if (result.result === 'defeat') {
    // Show defeat screen
    // Handle respawn
  }
})
```

## Step 4: Load Spell Definitions from Backend

### 4.1 Create Spell API Endpoint (PHP)

```php
// In routes/api.php
Route::get('/spells', [SpellController::class, 'index']);

// In SpellController
public function index() {
    $spells = Spell::with('effects')->get();
    return response()->json($spells);
}
```

### 4.2 Load Spells in Socket Backend

```javascript
// In combatService.js or separate spellService.js
import axios from 'axios';

let spellDefinitions = {};

async function loadSpellDefinitions() {
  try {
    const response = await axios.get('http://localhost:8000/api/spells');
    spellDefinitions = response.data.reduce((acc, spell) => {
      acc[spell.key] = spell;
      return acc;
    }, {});
  } catch (error) {
    console.error('Failed to load spells:', error);
  }
}
```

## Step 5: Team System Integration

### 5.1 Team Creation UI

```javascript
// Create team button
socket.emit('team:create', { name: 'My Team' })

socket.on('team:created', (data) => {
  // Show team UI
  // Display team members
})
```

### 5.2 Team-Based Combat

```javascript
// When initiating team combat
const team = getTeamByPlayer(playerId)
if (team) {
  socket.emit('combat:join', {
    combatType: 'team_pve',
    teamId: team.teamId,
    enemyIds: [...]
  })
}
```

## Step 6: Sync Position Updates

### 6.1 Send Position to Combat Service

```javascript
// In your position update handler
socket.on('player:position:update', (position) => {
  // Send to multiplayer service (existing)
  updatePlayerPositionInGameSession(socket.id, position)
  
  // Also send to combat service if in combat
  if (inCombat) {
    socket.emit('combat:position-update', { position })
  }
})
```

## Step 7: Testing Checklist

- [ ] Spell casting works server-side
- [ ] Damage is calculated correctly
- [ ] Status effects are applied
- [ ] AoE spells hit multiple targets
- [ ] Cooldowns are enforced
- [ ] Power costs are deducted
- [ ] Range validation works
- [ ] Combat state syncs to all clients
- [ ] Combat end conditions work
- [ ] Team creation works
- [ ] Team combat works

## Step 8: Performance Optimization

### 8.1 Reduce Event Frequency

```javascript
// Batch position updates
let positionUpdateQueue = []
setInterval(() => {
  if (positionUpdateQueue.length > 0) {
    socket.emit('combat:position-update', {
      positions: positionUpdateQueue
    })
    positionUpdateQueue = []
  }
}, 100) // Every 100ms instead of every frame
```

### 8.2 Add State Snapshots

```javascript
// Server sends full state periodically
setInterval(() => {
  if (combatInstanceId) {
    socket.emit('combat:state-snapshot', getCombatState(combatInstanceId))
  }
}, 1000) // Every second
```

## Step 9: Error Handling

```javascript
socket.on('combat:error', (error) => {
  console.error('Combat error:', error.message)
  // Show error to user
  showErrorNotification(error.message)
  
  // Re-sync state if needed
  socket.emit('combat:state-request')
})
```

## Step 10: Remove Old Code

After migration is complete and tested:

1. Remove client-side combat calculations from `gameStore.js`
2. Remove `attackEnemy`, `castMagic`, etc. implementations
3. Keep only UI state and visual effect triggers
4. Update all components to use socket events

## Common Issues & Solutions

### Issue: Combat feels laggy
**Solution:** Add client-side prediction for immediate feedback, server reconciliation

### Issue: State desync
**Solution:** Server sends periodic state snapshots, client reconciles

### Issue: Spell definitions missing
**Solution:** Load from PHP backend API, cache in socket backend

### Issue: Multiple combat instances
**Solution:** Each player tracks their `combatInstanceId`, only process their instance

## Next Steps

1. Start with single-player combat (PvE)
2. Test thoroughly
3. Add multiplayer combat (PvP)
4. Add team system
5. Optimize and scale

