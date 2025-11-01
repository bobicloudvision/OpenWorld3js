# Enemy System Architecture - Frontend vs Backend

## Overview

The enemy system uses a **server-authoritative architecture** where all AI, movement, and combat calculations happen on the backend, while the frontend only handles rendering and displays state updates.

---

## 🔴 BACKEND (Server-Side) - All Game Logic

### 1. Enemy Service (`backend-socket/services/enemyService.js`)

**Responsibilities:**
- ✅ **Enemy Storage**: In-memory `Map` storing all enemy state
- ✅ **Enemy Configuration**: Defines enemy types (goblin-warrior, dark-mage, orc-berserker)
- ✅ **Enemy Initialization**: Creates enemies with stats, position, AI state
- ✅ **AI Processing**: All enemy decision-making logic

**Key Functions:**
```javascript
initializeEnemy()      // Create new enemy
processEnemyAI()       // Calculate AI decisions (movement, attacks, detection)
processEnemiesInZone() // Process all enemies in a zone
getEnemiesInZone()     // Get enemies for a zone
removeEnemy()          // Delete enemy
```

**AI Logic (`processEnemyAI`):**
- ✅ **Player Detection**: Checks if players are in range (25 units) and FOV
- ✅ **Movement Calculation**: Calculates direction, speed, new position
- ✅ **Attack Logic**: Determines when to attack (melee/magic range)
- ✅ **Status Effects**: Processes poison, freeze, slow effects
- ✅ **Wandering**: Random movement when no players detected
- ✅ **Animation State**: Sets current animation (idle/walk/attack/cast)

**Updates Enemy State:**
- `enemy.position` - Calculated movement position
- `enemy.facingAngle` - Direction enemy is facing
- `enemy.currentAnimation` - Animation state
- `enemy.playerVisible` - Whether player is detected
- `enemy.health` - Updated by status effects
- `enemy.statusEffects` - Applied/removed effects

---

### 2. Enemy Game Loop (`backend-socket/sockets/enemy.js`)

**Runs at 60 FPS** (every ~16.67ms)

**Process:**
1. Calculates `delta` time since last frame
2. Processes all enemies in each active zone
3. Broadcasts state updates to all players in zone

**Broadcasts Events:**
- `enemy:state-update` - Position, health, animation, status updates (every frame)
- `enemy:attack` - When enemy attacks a player (damage info)
- `enemy:destroyed` - When enemy dies (cleanup)

**Event Payload (`enemy:state-update`):**
```javascript
{
  zoneId: 4,
  enemies: [
    {
      id: "enemy-123",
      position: [10.5, 2, 3.2],      // Calculated on backend
      health: 45,
      maxHealth: 60,
      power: 30,
      maxPower: 50,
      statusEffects: [],
      facingAngle: 1.23,              // Calculated on backend
      playerVisible: true,            // Calculated on backend
      currentAnimation: 'walk',       // Calculated on backend
      alive: true
    }
  ]
}
```

---

### 3. Enemy Spawning (Matchmaking)

**Location:** `backend-socket/services/matchmakingService.js`

**When PvE Match Starts:**
1. Spawns enemies in circle pattern around arena spawn point
2. Calls `enemyService.initializeEnemy()` for each enemy
3. Enemies automatically processed by game loop

---

## 🟢 FRONTEND (Client-Side) - Rendering Only

### 1. GameApp Component (`frontend/src/GameApp.jsx`)

**Socket Event Listeners:**
```javascript
// Receives enemy state updates from backend
socket.on('enemy:state-update', (data) => {
  useGameStore.getState().updateEnemyState(enemies);
});

// Receives enemy spawn notifications
socket.on('enemy:spawned', (data) => {
  useGameStore.getState().updateEnemyState(enemies);
});

// Receives enemy death notifications
socket.on('enemy:destroyed', (data) => {
  useGameStore.getState().removeEnemy(enemyId);
});

// Receives enemy attack notifications
socket.on('enemy:attack', (data) => {
  console.log(`Enemy attacked for ${damage} damage`);
});
```

**Responsibilities:**
- ❌ **NO AI logic** - Only receives updates
- ✅ **Event Handling** - Listens for backend events
- ✅ **State Management** - Updates Zustand store

---

### 2. Game Store (`frontend/src/stores/gameStore.js`)

**Enemy State:**
```javascript
enemies: [],  // Array of enemy objects from backend

// Actions
setEnemies(enemies)           // Replace all enemies
updateEnemyState(enemyUpdates) // Update/add enemies
removeEnemy(enemyId)          // Remove enemy
```

**Responsibilities:**
- ✅ Stores enemy state received from backend
- ✅ No calculations - just storage
- ✅ Enemies are **NOT persisted** to localStorage (synced from backend)

---

### 3. Enemy Component (`frontend/src/components/Enemy.jsx`)

**Responsibilities:**
- ✅ **Rendering Only** - Pure presentation component
- ✅ **3D Model Display** - Loads and displays enemy 3D model
- ✅ **Position Updates** - Sets position from `enemy.position` prop
- ✅ **Rotation Updates** - Sets rotation from `enemy.facingAngle` prop
- ✅ **Animation Playing** - Plays animation from `enemy.currentAnimation`
- ✅ **Visual Effects** - Health bars, status effects, vision cone
- ✅ **UI Elements** - Text labels, debug info

**What it DOES NOT do:**
- ❌ No movement calculations
- ❌ No AI decisions
- ❌ No position modifications
- ❌ No attack calculations
- ❌ No detection logic

**Key Code:**
```javascript
// Updates position from backend state (every React frame)
useFrame((state, delta) => {
  if (groupRef.current) {
    // Simply use position from props (calculated on backend)
    groupRef.current.position.set(
      enemy.position[0],  // From backend
      enemy.position[1],  // From backend
      enemy.position[2]   // From backend
    );
    
    // Simply use rotation from props (calculated on backend)
    groupRef.current.rotation.y = enemy.facingAngle;  // From backend
  }
  
  // Only local animation mixer update (visual)
  updateMixer(delta);
});
```

---

## 📊 Data Flow

### Enemy Movement Flow:

```
BACKEND (60 FPS)
├─ Enemy Game Loop runs
├─ processEnemyAI() calculates:
│  ├─ Player detection (range + FOV check)
│  ├─ Movement direction & speed
│  ├─ New position: enemy.position[0] += moveX
│  ├─ Facing angle: enemy.facingAngle = angleToPlayer
│  └─ Animation state: enemy.currentAnimation = 'walk'
│
├─ Broadcasts 'enemy:state-update' event
│  └─ Contains: { position, facingAngle, currentAnimation, ... }
│
FRONTEND
├─ GameApp receives event
├─ Updates Zustand store: updateEnemyState(enemies)
├─ React re-renders Enemy component with new props
└─ Enemy.jsx useFrame() updates 3D position/rotation
```

### Enemy Attack Flow:

```
BACKEND
├─ Enemy detects player in range
├─ Calculates damage
├─ Applies damage to player (via combatService)
├─ Broadcasts 'enemy:attack' event
│  └─ { enemyId, enemyName, damage, type }
│
FRONTEND
├─ GameApp receives 'enemy:attack'
└─ Logs message (could show damage UI)
```

---

## 🔐 Security Architecture

**Why Server-Authoritative:**

1. **Prevents Cheating**: Client cannot modify enemy behavior
2. **Consistency**: All players see same enemy positions
3. **Fair Combat**: Damage calculations on server
4. **Anti-Hack**: Position/health validated server-side

**What Client Cannot Do:**
- ❌ Spawn enemies (endpoint disabled)
- ❌ Modify enemy positions
- ❌ Change enemy health/stats
- ❌ Skip AI calculations
- ❌ Force enemy attacks

**What Client Can Do:**
- ✅ Render enemies (presentation)
- ✅ Display state updates
- ✅ Play animations
- ✅ Show UI (health bars, etc.)

---

## ⚡ Performance Considerations

**Backend:**
- Runs at **60 FPS** (16.67ms per frame)
- Processes all enemies in all zones
- Calculates AI, movement, detection every frame
- Broadcasts updates to all players in zone

**Frontend:**
- Receives updates **up to 60 times per second**
- React renders only when props change
- Three.js interpolates smoothly between updates
- Animation mixer runs locally (no network cost)

**Optimization:**
- Backend only broadcasts to players in same zone
- Frontend uses React memoization to prevent unnecessary re-renders
- 3D models cached after first load

---

## 📝 Summary

| Feature | Backend | Frontend |
|---------|---------|----------|
| **Enemy Spawning** | ✅ Yes | ❌ No |
| **AI Decisions** | ✅ Yes | ❌ No |
| **Movement Calculation** | ✅ Yes | ❌ No |
| **Position Updates** | ✅ Calculates | ✅ Receives & Renders |
| **Attack Logic** | ✅ Yes | ❌ No |
| **Health Management** | ✅ Yes | ❌ No |
| **Status Effects** | ✅ Yes | ❌ No |
| **3D Rendering** | ❌ No | ✅ Yes |
| **Animation Playing** | ✅ Sets State | ✅ Plays Animation |
| **UI Display** | ❌ No | ✅ Yes |

**Architecture Pattern: Server-Authoritative with Client Rendering**

