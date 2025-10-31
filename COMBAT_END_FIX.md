# Combat End & Scene Transition Fix

## 🐛 Problem
When a player won a 1v1 PvP battle, the combat wasn't ending properly and the scene wasn't changing back to lobby.

## ✅ Solution
Implemented a **global combat tick system** that properly processes all active combat instances and handles battle end conditions.

---

## 📝 Changes Made

### 1. **Backend: Global Combat Tick System** (`backend-socket/sockets/combat.js`)

**Added:**
- Global combat tick interval that runs every 1 second
- `activeCombatInstances` Set to track all active battles
- `registerCombatInstance(combatInstanceId)` function to register new combats
- Automatic combat end detection and cleanup
- Proper broadcasting of `combat:ended` event with `isMatchmaking` flag

**Removed:**
- Per-socket combat intervals (was causing issues)
- Duplicate combat tick logic

**Key Features:**
```javascript
// Global tick processes ALL active combats
globalCombatTick = setInterval(() => {
  activeCombatInstances.forEach(combatInstanceId => {
    processCombatTick(combatInstanceId);
    checkCombatConditions(combatInstanceId); // Checks for winner
    if (conditions.ended) {
      // Broadcasts combat:ended with isMatchmaking flag
      // Cleans up combat instance
      // Awards XP and levels
    }
  });
}, 1000);
```

---

### 2. **Backend: Combat End Detection** (`backend-socket/services/combatService.js`)

**Added Debug Logging:**
```javascript
console.log(`[combat] PvP Check - Total: ${players.length}, Alive: ${alivePlayers.length}, Dead: ${deadPlayers.length}`);
players.forEach(playerId => {
  const playerState = playerCombatState.get(playerId);
  console.log(`[combat]   Player ${playerId}: HP ${playerState?.health || 0}/${playerState?.maxHealth || 0}`);
});
```

**Victory Detection:**
- Checks if only 1 player alive = Victory
- Checks if all dead = Draw
- Properly identifies winners and losers

---

### 3. **Backend: Matchmaking Integration** (`backend-socket/services/matchmakingService.js`)

**Added:**
- Import `registerCombatInstance` from combat.js
- Register matchmaking battles with global tick system
- Pass `isMatchmaking: true` flag to combat instances

```javascript
const combatInstanceId = initializeCombatInstance(
  config.teams ? 'team_pvp' : 'pvp',
  participants,
  { center: [spawnPos.x, spawnPos.y, spawnPos.z], radius: 50 },
  arenaZone.id,
  true // This is a matchmaking battle
);

registerCombatInstance(combatInstanceId); // Register with global tick
```

---

### 4. **Frontend: Scene Auto-Transition** (`frontend/src/App.jsx`)

**Added Event Listener:**
```javascript
socket.on('combat:ended', (data) => {
  if (data.isMatchmaking) {
    setTimeout(() => {
      setCurrentScene('lobby'); // Switch to lobby
      // Auto-join safe zone
      socket.emit('zone:list', {}, (response) => {
        const lobby = response.zones.find(z => z.is_safe_zone);
        socket.emit('zone:join', { zoneId: lobby.id });
      });
    }, 3000); // Wait 3 seconds for results screen
  }
});
```

---

### 5. **Backend: SQLite Compatibility Fix** (`backend-socket/services/zoneService.js`)

**Fixed:**
- Changed `NOW()` → `CURRENT_TIMESTAMP` (SQLite compatible)
- Changed `.all()` → `.run()` for UPDATE queries

```javascript
const db = getDb();
const stmt = db.prepare(`UPDATE players 
   SET current_zone_id = ?, zone_position = ?, zone_entered_at = CURRENT_TIMESTAMP
   WHERE id = ?`);
stmt.run(zoneId, JSON.stringify(spawnPos), playerId);
```

---

## 🎮 How It Works Now

### **Matchmaking 1v1 Battle Flow:**

```
1. Players queue for 1v1
   ↓
2. Match found → Countdown
   ↓
3. Players teleport to Arena
   ↓
4. Combat instance created and REGISTERED with global tick
   ↓
5. Players fight
   ↓
6. One player's HP reaches 0
   ↓
7. Global tick detects victory condition
   ↓
8. Broadcasts 'combat:ended' with isMatchmaking: true
   ↓
9. Awards XP and levels to both players
   ↓
10. Frontend detects matchmaking ended
   ↓
11. Shows results for 3 seconds
   ↓
12. Auto-returns to Lobby scene
   ↓
13. Auto-teleports to Safe Zone
   ↓
14. Players can queue again!
```

---

## 🔍 Debug Output

When a battle ends, you'll see:
```
[combat] PvP Check - Total: 2, Alive: 1, Dead: 1
[combat]   Player 2: HP 60/60
[combat]   Player 1: HP 0/60
[combat] PvP Victory - Player 2 wins!
[combat] Combat combat-123-xyz ended: { ended: true, result: 'victory', winners: [2], losers: [1] }
[combat] Saved combat results for player 2: HP=60/60, Power=30, EXP=+82, LEVEL UP! -> 3
[combat] Combat instance combat-123-xyz removed from active list
```

---

## ✨ Features

- ✅ **Automatic battle end detection** - No manual intervention needed
- ✅ **Proper XP and level awards** - Both players get XP
- ✅ **Scene auto-transition** - Returns to lobby after matchmaking
- ✅ **Safe zone teleport** - Players land in safe zone
- ✅ **Global tick system** - Handles all combats efficiently
- ✅ **Debug logging** - Easy to troubleshoot
- ✅ **SQLite compatibility** - No more database errors

---

## 🚀 Testing

**To test:**
1. Restart socket server: `cd backend-socket && node server.js`
2. Open 2 browser windows
3. Login with 2 different accounts
4. Both click "⚔️ Find Match"
5. Select "1v1 Duel"
6. Wait for countdown
7. Fight until one player dies
8. **Expected:** Winner screen → 3 second delay → Auto-return to lobby

---

## 📊 Battle Types

| Type | End Detection | Scene Change | XP Award |
|------|---------------|--------------|----------|
| **Matchmaking 1v1** | ✅ Global Tick | ✅ Auto Lobby | ✅ Both Players |
| **Matchmaking 2v2** | ✅ Global Tick | ✅ Auto Lobby | ✅ All Players |
| **World PvP** | ✅ Global Tick | ❌ Stay in Zone | ✅ All Players |
| **PvE** | ✅ Global Tick | ❌ Stay in Zone | ✅ All Players |

---

## 🔧 Technical Details

### **Why Global Tick?**
- **Per-socket intervals were problematic** - Each socket had its own interval
- **Inconsistent state** - Different sockets checked at different times
- **Missed end conditions** - If caster socket wasn't checking, battle wouldn't end
- **Global tick solution** - Single source of truth, checks all battles every second

### **Why 1 Second Interval?**
- Balance between responsiveness and performance
- Gives players smooth HP updates
- Doesn't overload server with checks
- Fast enough to detect deaths immediately

### **Why Register Pattern?**
- Decouples combat creation from tick system
- Works for both matchmaking and world PvP
- Easy to add/remove combat instances
- Clean architecture

---

## 🎯 Result

**Before:** Battles never ended, players stuck fighting forever

**After:** Battles end properly, winners declared, XP awarded, scene transitions automatically!

🎊 **FIXED!** 🎊

