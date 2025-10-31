# WoW-Style Health & Regeneration System

This document describes the World of Warcraft-inspired health and resource management system implemented in the game.

## Overview

The system implements **persistent health** similar to World of Warcraft, where:
- ✅ Health damage **persists** between combats
- ✅ **ALL heroes** regenerate (online and offline)
- ✅ Out-of-combat regeneration (5 seconds after combat)
- ✅ Resting mechanic for faster regeneration (2x speed)
- ✅ Consumables (food, drinks, potions, bandages)
- ✅ Healing spells restore health
- ✅ Power (mana) is also persistent and regenerates

## Key Features

### 1. Persistent Health
- Health is saved to database after every combat
- Players carry damage into the next fight
- Creates strategic decision-making: "Should I fight with 30% health?"
- Encourages use of healing resources

### 2. Global Regeneration
- **ALL player heroes regenerate**, not just online players
- Runs every 2 seconds server-side
- Updates database directly for all heroes
- Skips heroes currently in active combat

### 3. Out-of-Combat Regeneration
```javascript
// Regeneration rates (configurable)
HEALTH_REGEN_INTERVAL: 2000ms  // Every 2 seconds
HEALTH_REGEN_PERCENT: 5%       // 5% of max health per tick
POWER_REGEN_PERCENT: 3%        // 3% of max power per tick
OUT_OF_COMBAT_DELAY: 5000ms    // 5 seconds after combat ends
RESTING_MULTIPLIER: 2x         // Double regen when resting
```

**Example:** A hero with 100 max health regenerates:
- Normal: 5 HP every 2 seconds = 2.5 HP/sec
- Resting: 10 HP every 2 seconds = 5 HP/sec
- Full recovery from 0: ~40 seconds (normal) or ~20 seconds (resting)

### 4. Resting Mechanic
Players can rest (like sitting in WoW) for **2x regeneration speed**:
```javascript
// Client socket event
socket.emit('regen:set-resting', { resting: true });

// Server response
socket.on('regen:resting-changed', (data) => {
  console.log('Resting:', data.resting);
});
```

**Rules:**
- Cannot rest while in combat
- Resting state is stored server-side
- Affects both health and power regeneration

### 5. Consumables System

#### Food & Drinks (Out of Combat Only)
```javascript
{
  bread: "Restores 30 HP over 3 seconds",
  water: "Restores 40 Power over 3 seconds",
  meal: "Restores 50 HP and 30 Power over 5 seconds"
}
```

#### Potions (Usable in Combat)
```javascript
{
  health_potion: "Instantly restores 50 HP (30s cooldown)",
  mana_potion: "Instantly restores 60 Power (30s cooldown)"
}
```

#### Bandages (Combat Use, Interruptible)
```javascript
{
  bandage: "Restores 40 HP over 4 seconds (1min cooldown, interrupted by damage)"
}
```

**Usage:**
```javascript
// Use consumable
socket.emit('consumable:use', { consumableId: 'bread' });

// Instant consumable
socket.on('consumable:used', (data) => {
  console.log(`+${data.healthRestored} HP`);
});

// Channeled consumable
socket.on('consumable:channeling-started', (data) => {
  console.log(`Eating ${data.consumableName} (${data.castTime}ms)...`);
});

socket.on('consumable:channeling-completed', (data) => {
  console.log(`Finished! +${data.healthRestored} HP`);
});

// Cancel channeling
socket.emit('consumable:cancel');
```

### 6. Healing Spells
Spells with **negative damage** are healing spells:
```sql
-- In database
INSERT INTO spells (key, name, damage, ...) VALUES
('heal', 'Heal', -30, ...);  -- Heals 30 HP
```

**Features:**
- Can self-cast (target yourself)
- Works on allies in PvE
- Subject to cooldowns and power costs
- Scales with hero level

## Architecture

### Services

#### `regenerationService.js`
- Manages regeneration state for all players
- `processAllHeroesRegeneration()` - Updates ALL heroes in database
- `setResting()` - Toggle resting state
- `enterCombat()` / `leaveCombat()` - Track combat state

#### `consumableService.js`
- Defines all consumables (can be moved to database later)
- `useConsumable()` - Consume food/potions
- `completeChanneling()` - Finish eating/drinking
- `cancelChanneling()` - Interrupt channeled consumables

#### `combatService.js`
- Saves health to database after combat
- Loads health from database when joining combat
- Healing spells target self and allies

#### `heroService.js`
- `updatePlayerHeroStats()` - Direct stat updates for regeneration/consumables
- `updatePlayerHeroCombatStats()` - Combat-specific updates with XP/leveling

### Socket Events

#### Regeneration
```javascript
// Server → Client (automatic every 2 seconds)
socket.on('regen:tick', (data) => {
  // { healthGained, powerGained, newHealth, newPower, maxHealth, maxPower, isResting }
});

// Client → Server
socket.emit('regen:set-resting', { resting: true });
socket.emit('regen:get-state');
socket.emit('regen:force-tick'); // Manual trigger for testing
```

#### Consumables
```javascript
// Client → Server
socket.emit('consumable:use', { consumableId: 'bread' });
socket.emit('consumable:cancel');
socket.emit('consumable:list');
socket.emit('consumable:get-state');

// Server → Client
socket.on('consumable:used', (data) => {}); // Instant
socket.on('consumable:channeling-started', (data) => {});
socket.on('consumable:channeling-completed', (data) => {});
socket.on('consumable:channeling-cancelled', (data) => {});
socket.on('consumable:error', (data) => {});
```

#### Combat
```javascript
// Combat automatically calls enterCombat() and leaveCombat()
// Health is saved to database when combat ends
socket.on('combat:ended', (data) => {
  // Health has been saved, regeneration will start in 5 seconds
});
```

## Database Schema

Health and power are stored in `player_heroes` table:
```sql
CREATE TABLE player_heroes (
  id INTEGER PRIMARY KEY,
  player_id INTEGER,
  hero_id INTEGER,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  health INTEGER,         -- Current health (saved after combat)
  max_health INTEGER,     -- Maximum health
  power INTEGER,          -- Current power/mana
  max_power INTEGER,      -- Maximum power/mana
  attack INTEGER,
  defense INTEGER,
  ...
);
```

## Comparison: Old vs New System

| Feature | Old System | New System (WoW-Style) |
|---------|-----------|------------------------|
| Health after combat | ❌ Reset to full | ✅ Persists (saved to DB) |
| Between fights | ❌ Always full | ✅ Carries damage |
| Regeneration | ❌ None | ✅ Auto regen (5% per 2s) |
| Online-only regen | ✅ Yes | ❌ ALL heroes regen |
| Healing | ❌ None | ✅ Food/potions/spells |
| Resting | ❌ None | ✅ 2x regen speed |
| Downtime | ❌ None | ✅ Rest between fights |
| Strategic depth | ⚠️ Low | ✅ High |

## Performance Considerations

### Database Load
- Regeneration runs every 2 seconds
- Only updates heroes with `health < max_health OR power < max_power`
- Single UPDATE query per hero needing regeneration
- Typical load: 5-20 database writes per tick (for active heroes)

### Optimization Tips
1. **Increase tick interval** if database writes are expensive:
   ```javascript
   const REGEN_TICK_INTERVAL = 5000; // 5 seconds instead of 2
   ```

2. **Batch database updates** using transactions:
   ```javascript
   db.transaction(() => {
     heroes.forEach(hero => updateStmt.run(...));
   })();
   ```

3. **Skip full-health heroes** - already implemented ✅

4. **Cache combat state** - already implemented ✅

## Future Enhancements

### Possible Additions
- [ ] Food/drink buffs (temporary stat boosts)
- [ ] Resurrection mechanics (death penalty)
- [ ] Inn resting (extra fast regen in safe zones)
- [ ] Healing over time (HoT) spells
- [ ] Spirit stat (affects regen rate)
- [ ] Conjured food/water (mage-style)
- [ ] Consumable inventory system
- [ ] Auction house for consumables

### Balance Tuning
Adjust these constants in `regenerationService.js`:
```javascript
const REGEN_CONFIG = {
  HEALTH_REGEN_INTERVAL: 2000,    // How often (ms)
  HEALTH_REGEN_PERCENT: 0.05,     // 5% per tick
  POWER_REGEN_PERCENT: 0.03,      // 3% per tick  
  OUT_OF_COMBAT_DELAY: 5000,      // 5s delay
  RESTING_MULTIPLIER: 2,          // 2x when resting
  MIN_HEALTH_REGEN: 5,            // Minimum HP
  MIN_POWER_REGEN: 3              // Minimum power
};
```

## Testing

### Manual Testing
```javascript
// 1. Join combat and take damage
socket.emit('combat:join', { ... });
socket.emit('combat:cast-spell', { ... });

// 2. Leave combat - wait 5 seconds for regen to start
socket.emit('combat:leave');

// 3. Watch regeneration
socket.on('regen:tick', (data) => {
  console.log(`+${data.healthGained} HP, +${data.powerGained} Power`);
});

// 4. Test resting
socket.emit('regen:set-resting', { resting: true });
// Should regenerate 2x faster

// 5. Test consumables
socket.emit('consumable:use', { consumableId: 'health_potion' });

// 6. Test healing spells
socket.emit('combat:cast-spell', {
  spellKey: 'heal',
  targetPosition: [x, y, z] // Your position
});
```

### Server Logs
```
[regen] Global regeneration loop started (processes ALL heroes)
[regen] Regenerated 3/8 heroes: +15 HP, +9 Power
[consumable] Player 1 used Health Potion: +50 HP, +0 Power
[combat] Saved combat results for player 1: HP=27/40, Power=65/100, EXP=+35
```

## Implementation Files

- `services/regenerationService.js` - Core regeneration logic
- `services/consumableService.js` - Food/potions/bandages
- `services/combatService.js` - Health persistence and healing spells
- `services/heroService.js` - Database updates
- `sockets/regeneration.js` - Socket handlers for regen
- `sockets/consumable.js` - Socket handlers for consumables
- `sockets/combat.js` - Enter/leave combat tracking
- `server.js` - Starts global regeneration loop

## Credits

Inspired by **World of Warcraft**'s health and resource management system.
Implemented for realistic, strategic gameplay with persistent consequences.

