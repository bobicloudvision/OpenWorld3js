# Dual Leveling System

## Overview
The game now features a **dual-leveling system** where both Players and Heroes gain experience and level up independently from combat.

---

## System Architecture

### Player Leveling (Account-Wide Progression)
- **Location**: `players` table in database
- **Fields**: `level`, `experience`
- **Scope**: Account-wide progression that persists across all heroes
- **Service**: `playerService.js` → `updatePlayerExperience()`

### Hero Leveling (Hero-Specific Progression)
- **Location**: `player_heroes` table in database  
- **Fields**: `level`, `experience`
- **Scope**: Individual hero progression (each hero levels independently)
- **Service**: `heroService.js` → `updatePlayerHeroCombatStats()`

---

## How It Works

### Experience Calculation
Experience is calculated in `combatService.js` → `calculateExperienceGained()`:

```javascript
// Base XP from combat duration (1 XP per 10 seconds)
baseExp += Math.floor(duration / 10);

// Victory bonus: +50 XP
// Draw bonus: +25 XP  
// Defeat: +10 XP (consolation)

// PvE: +20 XP per enemy defeated
// PvP: +30 XP per opponent
```

### Level-Up Formula
Both players and heroes use the same formula:
```javascript
XP Required = 100 × Current Level
```

**Examples:**
- Level 1 → 2: 100 XP
- Level 2 → 3: 200 XP
- Level 3 → 4: 300 XP
- Level 5 → 6: 500 XP

The system allows **multiple level-ups** in a single combat if enough XP is gained.

### Combat Flow

1. **Combat Ends** → `endCombatInstance()` is called
2. **Calculate XP** → Based on duration, result, enemies/opponents
3. **Update Player** → `updatePlayerExperience(playerId, xp)` updates player level
4. **Update Hero** → `updatePlayerHeroCombatStats(playerId, stats)` updates hero level
5. **Broadcast Events**:
   - `player:level-up` (if player leveled up)
   - `hero:level-up` (if hero leveled up)

---

## Database Schema

### Players Table
```sql
CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  level INTEGER DEFAULT 1,          -- Player level (account-wide)
  experience INTEGER DEFAULT 0,      -- Player XP
  currency INTEGER DEFAULT 0,
  active_hero_id INTEGER,
  ...
);
```

### Player Heroes Table  
```sql
CREATE TABLE player_heroes (
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  hero_id INTEGER NOT NULL,
  level INTEGER DEFAULT 1,           -- Hero level (hero-specific)
  experience INTEGER DEFAULT 0,      -- Hero XP
  health REAL,
  max_health REAL,
  power REAL,
  max_power REAL,
  attack REAL,
  defense REAL,
  ...
);
```

---

## Socket Events

### Server → Client Events

#### `player:level-up`
Emitted when a player levels up (account-wide):
```javascript
{
  oldLevel: 5,
  newLevel: 6,
  experienceGained: 150
}
```

#### `hero:level-up`
Emitted when a hero levels up (hero-specific):
```javascript
{
  oldLevel: 3,
  newLevel: 4,
  experienceGained: 150
}
```

### Combat Result Structure
The `endCombatInstance()` function returns:
```javascript
{
  [playerId]: {
    // Player progression (account-wide)
    playerLeveledUp: true,
    playerOldLevel: 5,
    playerNewLevel: 6,
    
    // Hero progression (hero-specific)
    heroLeveledUp: true,
    heroOldLevel: 3,
    heroNewLevel: 4,
    
    // Shared
    experienceGained: 150
  }
}
```

---

## Implementation Details

### Files Modified

1. **`backend-socket/services/playerService.js`**
   - Added `updatePlayerExperience()` function
   - Handles player leveling logic

2. **`backend-socket/services/combatService.js`**
   - Updated `endCombatInstance()` to call both player and hero update functions
   - Modified return structure to include both player and hero level-up info
   - Updated combat history to track both levels

3. **`backend-socket/sockets/combat.js`**
   - Updated level-up broadcasts to emit separate events for player and hero
   - Now emits both `player:level-up` and `hero:level-up` when applicable

---

## Frontend Integration

To handle the new events in your React/Three.js frontend:

```javascript
// Listen for player level-up (account-wide)
socket.on('player:level-up', (data) => {
  console.log(`🎉 Player Level Up! ${data.oldLevel} → ${data.newLevel}`);
  showNotification({
    title: 'Player Level Up!',
    message: `You reached level ${data.newLevel}!`,
    type: 'success'
  });
});

// Listen for hero level-up (hero-specific)
socket.on('hero:level-up', (data) => {
  console.log(`⚔️ Hero Level Up! ${data.oldLevel} → ${data.newLevel}`);
  showNotification({
    title: 'Hero Level Up!',
    message: `Your hero reached level ${data.newLevel}!`,
    type: 'success'
  });
  // Refresh hero stats (spells scale with hero level)
  refreshHeroData();
});
```

---

## Benefits of Dual Leveling

1. **Account Progression**: Player level shows overall account progression
2. **Hero Mastery**: Hero levels show individual hero mastery
3. **Strategic Depth**: Players can focus on leveling specific heroes
4. **Replay Value**: Leveling multiple heroes provides long-term goals
5. **Future Scaling**: 
   - Player level can unlock game features (zones, game modes, etc.)
   - Hero level scales spell damage and stats

---

## Future Enhancements

### Player Level Benefits (Suggestions)
- Unlock new zones (min player level required)
- Unlock new game modes
- Increase currency gain multiplier
- Unlock hero slots
- Unlock achievements/titles

### Hero Level Benefits (Already Implemented)
- Spell damage scaling (`damage_per_level`)
- Spell power cost scaling (`power_cost_per_level`)
- Spell cooldown scaling (`cooldown_per_level`)
- Stat increases (health, attack, defense)

---

## Testing

To test the dual-leveling system:

1. Enter combat (PvE or PvP)
2. Complete the combat (win/lose/draw)
3. Check console logs for:
   ```
   [playerService] Player 1 gained 150 XP, LEVEL UP! 5 -> 6
   [combat] 🎉 Player 1 LEVEL UP! 5 -> 6
   [combat] ⚔️ Hero LEVEL UP! -> 4
   ```
4. Verify database changes:
   ```sql
   SELECT level, experience FROM players WHERE id = 1;
   SELECT level, experience FROM player_heroes WHERE player_id = 1;
   ```

---

## Summary

Both **Players** and **Heroes** now gain experience and level up independently:
- **Player Level** = Account-wide progression (all heroes)
- **Hero Level** = Individual hero progression (each hero separate)
- **Same XP** gained from combat applies to both
- **Same formula** for leveling (100 × level)
- **Separate events** emitted to frontend for proper UI updates

