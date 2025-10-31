# PvP Matchmaking & Combat Queue System

## Overview

A complete matchmaking system for organized PvP combat with:
- **Multiple queue types** (1v1 Duel, 2v2, 3v3, FFA, Battle Royale)
- **Automatic player matching** based on queue requirements
- **Countdown system** before combat starts
- **Team organization** for team-based modes
- **Zone integration** (auto-teleport to arena)
- **Real-time updates** for all players in queue

---

## How It Works

### 1. Player Flow

```
Player Opens Matchmaking
         ↓
Selects Queue Type (1v1, 2v2, etc.)
         ↓
Joins Queue
         ↓
Waiting for Opponents (real-time updates)
         ↓
Minimum Players Reached
         ↓
Match Found! (notification)
         ↓
Countdown Starts (10-20s depending on mode)
         ↓
Combat Begins
         ↓
Auto-teleported to Arena Zone
         ↓
Battle!
```

### 2. Queue Types

**Duel (1v1)**
- 2 players required
- 10 second countdown
- Free for all combat
- Best for skill testing

**Team Battle (2v2)**
- 4 players required
- 15 second countdown
- 2 teams of 2
- Coordinated teamplay

**Team Battle (3v3)**
- 6 players required
- 15 second countdown
- 2 teams of 3
- Large-scale team battles

**Free For All (FFA)**
- 3-6 players
- 10 second countdown
- Everyone vs everyone
- Chaotic fun

**Battle Royale**
- 4-10 players
- 20 second countdown
- Last player standing
- Epic battles

---

## Backend Implementation

### Services Created

**`matchmakingService.js`**
```javascript
// Core matchmaking logic
- joinQueue(playerId, playerData, queueType, io)
- leaveQueue(playerId, io)
- checkAndStartMatch(queueType, io)
- startCountdown(matchId, io)
- startCombat(matchId, io)
- handlePlayerDisconnect(playerId, io)
```

**Features:**
- ✅ Real-time queue updates
- ✅ Automatic player matching
- ✅ Countdown system with intervals
- ✅ Team organization for team modes
- ✅ Arena zone assignment
- ✅ Combat instance creation
- ✅ Disconnect handling

### Socket Handlers Created

**`matchmaking.js`**

**Client → Server Events:**
- `matchmaking:queues` - Get available queues
- `matchmaking:join` - Join a queue
- `matchmaking:leave` - Leave queue
- `matchmaking:status` - Get queue status

**Server → Client Events:**
- `queue:update` - Real-time queue updates
- `match:found` - Match found notification
- `match:countdown` - Countdown updates (every second)
- `match:started` - Combat started, teleport player
- `match:cancelled` - Match cancelled (disconnect, etc.)

---

## Frontend Implementation

### Component Created

**`MatchmakingQueue.jsx`**

**States:**
1. **Queue Selection** - Grid of available queues
2. **In Queue** - Waiting for opponents with player count
3. **Match Found** - Countdown screen with opponent names
4. **Auto-closes** - When combat starts

**Features:**
- ✅ Beautiful grid layout
- ✅ Real-time player counts
- ✅ Animated waiting screen
- ✅ Countdown timer with player list
- ✅ Leave queue button
- ✅ Automatic transitions

---

## Integration Guide

### 1. Add Matchmaking Button

In your `GameplayScene.jsx` or `LobbyScene.jsx`:

```jsx
import MatchmakingQueue from './MatchmakingQueue'

// Add state
const [showMatchmaking, setShowMatchmaking] = useState(false)

// Add button in UI
<button
  onClick={() => setShowMatchmaking(true)}
  style={{
    position: 'fixed',
    bottom: 20,
    right: 20,
    padding: '16px 24px',
    fontSize: '18px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: '2px solid #7f1d1d',
    borderRadius: '12px',
    cursor: 'pointer',
    zIndex: 50
  }}
>
  ⚔️ Find Match
</button>

// Add modal
{showMatchmaking && (
  <MatchmakingQueue
    socket={socket}
    onClose={() => setShowMatchmaking(false)}
  />
)}
```

### 2. Add Keyboard Shortcut (Optional)

```jsx
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'p' || e.key === 'P') {
      setShowMatchmaking(true)
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

---

## Usage Examples

### Example 1: Simple 1v1 Duel

```javascript
// Player 1 clicks "Find Match" → Selects "Duel (1v1)"
socket.emit('matchmaking:join', { queueType: 'duel' })

// Server: Player 1 waiting...

// Player 2 does the same
socket.emit('matchmaking:join', { queueType: 'duel' })

// Server: 2 players found! Starting countdown
// Both players see: "Match Found! Countdown: 10...9...8..."

// At 0: Both teleported to Arena zone
// Combat instance created
// Battle begins!
```

### Example 2: Team Battle (2v2)

```javascript
// 4 players join queue
socket.emit('matchmaking:join', { queueType: '2v2' })

// Server organizes:
// Team 1: Player A, Player B
// Team 2: Player C, Player D

// 15 second countdown
// All 4 teleported to arena
// Team-based combat begins
```

---

## Configuration

### Adding New Queue Types

Edit `matchmakingService.js`:

```javascript
const QUEUE_TYPES = {
  myCustomMode: {
    name: 'My Custom Mode',
    minPlayers: 4,
    maxPlayers: 8,
    countdownSeconds: 15,
    teams: true,
    teamSize: 4
  }
}
```

### Changing Countdown Duration

```javascript
duel: {
  countdownSeconds: 10, // Change this
}
```

### Changing Arena Zone

The system automatically finds zones with:
- `type = 'pvp'`
- `is_combat_zone = true`

Create more arena zones in database:
```sql
INSERT INTO zones (name, type, is_combat_zone, ...) 
VALUES ('Blood Arena', 'pvp', 1, ...)
```

---

## Features

✅ **Automatic Matching** - No manual invites needed
✅ **Fair Teams** - Auto-balanced team organization
✅ **Countdown** - Prepare before battle
✅ **Zone Integration** - Auto-teleport to arena
✅ **Disconnect Handling** - Cancel match if player leaves
✅ **Real-time Updates** - See other players joining
✅ **Multiple Modes** - 5 built-in queue types
✅ **Scalable** - Easy to add new modes
✅ **Beautiful UI** - Professional matchmaking interface

---

## Testing

1. **Open 2 browser windows**
2. **Login as 2 different players**
3. **Both click "Find Match"**
4. **Both select "Duel (1v1)"**
5. **Watch countdown**
6. **Combat starts!**

---

## Advanced Features

### Adding ELO/MMR Matchmaking

Modify `checkAndStartMatch()` to sort by skill:

```javascript
queue.players.sort((a, b) => 
  Math.abs(a.rating - avgRating) - Math.abs(b.rating - avgRating)
)
```

### Adding Queue Time Priority

```javascript
queue.players.sort((a, b) => a.joinedAt - b.joinedAt)
```

### Adding Level Brackets

```javascript
if (Math.abs(player1.level - player2.level) > 5) {
  // Don't match, levels too different
  continue
}
```

---

## Architecture Benefits

✅ **Zone-Aware** - Combat tied to specific zones
✅ **Server-Authoritative** - No cheating
✅ **Real-time** - Socket.io for instant updates
✅ **Scalable** - Handle multiple matches simultaneously
✅ **Professional** - AAA-game quality matchmaking
✅ **Customizable** - Easy to modify and extend

---

## Future Enhancements

- **Ranked Matchmaking** - ELO/MMR system
- **Party System** - Queue with friends
- **Map Selection** - Vote on arena
- **Ban System** - Temporarily banned players
- **Seasonal Rewards** - Rankings and prizes
- **Tournament Mode** - Bracket-style competitions
- **Spectator Mode** - Watch ongoing matches
- **Replay System** - Review past battles

---

## Complete!

Your game now has a professional matchmaking system! Players can:
- Find opponents automatically
- See countdown before battle
- Compete in multiple game modes
- Enjoy organized PvP combat

Just add the button and you're ready to go! 🎮⚔️

