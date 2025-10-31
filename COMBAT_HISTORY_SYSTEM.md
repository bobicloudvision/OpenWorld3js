# Combat History System

## 📊 Overview

Complete combat match tracking system that records all PvP/PvE battles, player statistics, and enables leaderboards and match history.

---

## 🗄️ Database Schema

### **1. `combat_matches` Table**
Stores overall match information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `combat_instance_id` | string | Unique socket combat ID |
| `combat_type` | enum | pvp, pve, team_pvp, team_pve |
| `match_type` | enum | world, matchmaking, duel |
| `queue_type` | string | 1v1, 2v2, 3v3, ffa, brawl |
| `zone_id` | foreign | Zone where match occurred |
| `result` | enum | victory, defeat, draw |
| `winner_player_id` | int | Winner (for 1v1) |
| `winner_team` | json | Array of winner IDs |
| `loser_team` | json | Array of loser IDs |
| `total_players` | int | Number of participants |
| `duration_seconds` | int | Match duration |
| `total_damage_dealt` | int | Sum of all damage |
| `total_healing_done` | int | Sum of all healing |
| `total_spells_cast` | int | Sum of all spells |
| `started_at` | timestamp | When match started |
| `ended_at` | timestamp | When match ended |

---

### **2. `combat_match_players` Table**
Stores individual player stats for each match.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `combat_match_id` | foreign | Link to combat_matches |
| `player_id` | foreign | Player who participated |
| `player_hero_id` | foreign | Hero used |
| `result` | enum | won, lost, draw |
| `team_number` | int | Team number (for team battles) |
| `final_placement` | int | Rank in FFA |
| `damage_dealt` | int | Damage dealt |
| `damage_taken` | int | Damage taken |
| `healing_done` | int | Healing done |
| `spells_cast` | int | Spells cast |
| `kills` | int | Number of kills |
| `deaths` | int | Number of deaths |
| `final_health` | int | HP at match end |
| `final_max_health` | int | Max HP |
| `final_power` | int | Power at match end |
| `final_max_power` | int | Max power |
| `experience_gained` | int | XP earned |
| `level_before` | int | Level before match |
| `level_after` | int | Level after match |
| `leveled_up` | boolean | Did player level up? |
| `rating_before` | int | ELO before (future) |
| `rating_after` | int | ELO after (future) |
| `rating_change` | int | ELO change (future) |

---

## 🔧 Laravel Models

### **CombatMatch Model**
```php
// Relationships
$match->zone()         // Zone where match occurred
$match->winner()       // Winner player (1v1 only)
$match->players()      // All participants
$match->winners()      // Only winners
$match->losers()       // Only losers

// Methods
$match->calculateDuration()  // Get match duration
$match->isTeamMatch()        // Is team-based?
$match->isMatchmaking()      // From matchmaking?
```

### **CombatMatchPlayer Model**
```php
// Relationships
$player->combatMatch()   // The match
$player->player()        // The player
$player->playerHero()    // The hero used

// Methods
$player->getKdRatio()              // K/D ratio
$player->getDamageEfficiency()     // Damage dealt vs taken
$player->won()                     // Did player win?
$player->lost()                    // Did player lose?
$player->getSurvivalPercentage()   // HP% at end
```

### **Player Model Extensions**
```php
// New relationships
$player->combatMatchParticipations()  // All matches
$player->wonMatches()                 // Matches won (1v1)

// New methods
$player->getCombatStats()  // Complete statistics
```

**Example:**
```php
$stats = $player->getCombatStats();
// Returns:
[
    'total_matches' => 45,
    'wins' => 28,
    'losses' => 15,
    'draws' => 2,
    'total_damage_dealt' => 125000,
    'total_healing_done' => 45000,
    'total_kills' => 28,
    'total_deaths' => 15,
    'win_rate' => 62.2,  // Percentage
]
```

---

## 🎮 Backend Socket Service

### **Combat History Service** (`combatHistoryService.js`)

#### **Save Combat Match**
```javascript
import { saveCombatMatch } from './combatHistoryService.js';

saveCombatMatch({
  combatInstanceId: 'combat-123-xyz',
  combatType: 'pvp',
  matchType: 'matchmaking',
  queueType: '1v1',
  zoneId: 3,
  result: 'victory',
  winners: [2],
  losers: [1],
  startTime: 1698765432000,
  endTime: 1698765532000,
  stats: {},
  playerResults: {
    '1': {
      health: 0,
      maxHealth: 100,
      damageDealt: 450,
      experienceGained: 82,
      leveledUp: true,
      newLevel: 3
    },
    '2': {
      health: 45,
      maxHealth: 100,
      damageDealt: 580,
      experienceGained: 82,
      leveledUp: false,
      newLevel: 2
    }
  }
});
```

#### **Get Player History**
```javascript
import { getPlayerCombatHistory } from './combatHistoryService.js';

const history = getPlayerCombatHistory(playerId, 10);
// Returns last 10 matches with stats
```

#### **Get Player Stats**
```javascript
import { getPlayerCombatStats } from './combatHistoryService.js';

const stats = getPlayerCombatStats(playerId);
// Returns aggregate statistics
```

#### **Get Leaderboard**
```javascript
import { getLeaderboard } from './combatHistoryService.js';

const topWins = getLeaderboard('wins', 10);
const topDamage = getLeaderboard('damage', 10);
const topHealing = getLeaderboard('healing', 10);
const topKD = getLeaderboard('kd', 10);
```

---

## 🚀 Installation & Setup

### **Step 1: Run Migrations**
```bash
cd backend-php
php artisan migrate
```

This creates:
- ✅ `combat_matches` table
- ✅ `combat_match_players` table

### **Step 2: Verify Tables**
```bash
php artisan tinker
```
```php
>>> \App\Models\CombatMatch::count()
=> 0
>>> \App\Models\CombatMatchPlayer::count()
=> 0
```

### **Step 3: Restart Socket Server**
```bash
cd backend-socket
node server.js
```

The system will automatically save combat matches when they end!

---

## 📈 What Gets Tracked

### **Automatically Saved:**
- ✅ Combat instance ID
- ✅ Combat type (PvP, PvE, team)
- ✅ Match type (world, matchmaking)
- ✅ Queue type (1v1, 2v2, etc.)
- ✅ Zone location
- ✅ Winners and losers
- ✅ Match duration
- ✅ Player health/power at end
- ✅ Experience gained
- ✅ Level ups
- ✅ Start and end timestamps

### **Future Tracking (TODO):**
- ⏳ Damage dealt per player
- ⏳ Damage taken per player
- ⏳ Healing done per player
- ⏳ Spells cast per player
- ⏳ Kills/deaths per player
- ⏳ ELO rating system

---

## 🔍 Querying Combat History

### **PHP (Laravel)**

#### **Get All Matches for a Player:**
```php
$player = Player::find(1);
$matches = $player->combatMatchParticipations()
    ->with('combatMatch')
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

foreach ($matches as $participation) {
    echo $participation->combatMatch->combat_type;
    echo $participation->result; // 'won', 'lost', 'draw'
    echo $participation->damage_dealt;
}
```

#### **Get Only Wins:**
```php
$wins = $player->combatMatchParticipations()
    ->where('result', 'won')
    ->count();
```

#### **Get Recent 1v1 Matches:**
```php
$matches = CombatMatch::where('combat_type', 'pvp')
    ->where('total_players', 2)
    ->with(['players.player', 'zone'])
    ->orderBy('ended_at', 'desc')
    ->limit(10)
    ->get();
```

#### **Leaderboard Query:**
```php
$leaderboard = DB::table('combat_match_players')
    ->select('player_id', DB::raw('COUNT(*) as total_matches'),
             DB::raw('SUM(CASE WHEN result = "won" THEN 1 ELSE 0 END) as wins'))
    ->groupBy('player_id')
    ->orderBy('wins', 'desc')
    ->limit(10)
    ->get();
```

---

### **Node.js (Socket Server)**

#### **Get Player History:**
```javascript
import { getPlayerCombatHistory } from './services/combatHistoryService.js';

socket.on('player:history:get', (data, ack) => {
  const history = getPlayerCombatHistory(playerId, 10);
  ack({ ok: true, history });
});
```

#### **Get Player Stats:**
```javascript
import { getPlayerCombatStats } from './services/combatHistoryService.js';

socket.on('player:stats:get', (data, ack) => {
  const stats = getPlayerCombatStats(playerId);
  ack({ ok: true, stats });
});
```

#### **Get Leaderboard:**
```javascript
import { getLeaderboard } from './services/combatHistoryService.js';

socket.on('leaderboard:get', ({ stat }, ack) => {
  const leaderboard = getLeaderboard(stat, 10);
  ack({ ok: true, leaderboard });
});
```

---

## 📊 Example Data

### **Combat Match:**
```json
{
  "id": 1,
  "combat_instance_id": "combat-1698765432000-abc123",
  "combat_type": "pvp",
  "match_type": "matchmaking",
  "queue_type": "1v1",
  "zone_id": 3,
  "result": "victory",
  "winner_player_id": 2,
  "winner_team": [2],
  "loser_team": [1],
  "total_players": 2,
  "duration_seconds": 125,
  "total_damage_dealt": 1030,
  "total_healing_done": 0,
  "total_spells_cast": 35,
  "started_at": "2025-10-31 12:30:32",
  "ended_at": "2025-10-31 12:32:37"
}
```

### **Player Participation:**
```json
{
  "id": 1,
  "combat_match_id": 1,
  "player_id": 2,
  "player_hero_id": 5,
  "result": "won",
  "damage_dealt": 580,
  "damage_taken": 450,
  "healing_done": 0,
  "spells_cast": 18,
  "kills": 1,
  "deaths": 0,
  "final_health": 45,
  "final_max_health": 100,
  "experience_gained": 82,
  "level_before": 2,
  "level_after": 3,
  "leveled_up": true
}
```

---

## 🎯 Use Cases

### **1. Match History Screen**
Show player's recent matches with:
- Win/Loss/Draw result
- Opponents
- Damage dealt
- Duration
- Zone
- Date

### **2. Player Profile Stats**
Display:
- Total matches played
- Win rate
- Favorite match type
- Total damage/healing
- K/D ratio
- Current win streak

### **3. Leaderboards**
Rank players by:
- Most wins
- Highest win rate
- Most damage dealt
- Best K/D ratio
- Most matches played

### **4. Achievement System**
Track milestones:
- "First Blood" - First PvP win
- "Champion" - 10 PvP wins
- "Legend" - 50 PvP wins
- "Unstoppable" - 5 win streak
- "Damage Dealer" - 10,000 total damage

### **5. Analytics Dashboard**
For admins:
- Matches per day/week/month
- Popular queue types
- Average match duration
- Player retention
- Balance statistics

---

## ✨ Features

- ✅ **Automatic Saving** - All matches saved on end
- ✅ **Detailed Stats** - Per-player statistics
- ✅ **Team Support** - Works with team battles
- ✅ **FFA Support** - Placement tracking for FFA
- ✅ **Matchmaking Integration** - Distinguishes match types
- ✅ **Zone Tracking** - Knows where battles happened
- ✅ **Duration Tracking** - Match length in seconds
- ✅ **Level Up Tracking** - Records level progression
- ✅ **Query Optimization** - Indexed for fast queries
- ✅ **Laravel Models** - Full Eloquent support
- ✅ **Leaderboard Ready** - Built-in leaderboard queries

---

## 🚧 Future Enhancements

### **Phase 2:**
- [ ] Track damage/healing per spell cast
- [ ] Record spell cast history
- [ ] MVP (Most Valuable Player) calculation
- [ ] Replay system (action log)

### **Phase 3:**
- [ ] ELO rating system
- [ ] Ranked matchmaking tiers
- [ ] Season system
- [ ] Rewards for rankings

### **Phase 4:**
- [ ] Combat VOD/Replay viewer
- [ ] Heat maps of damage zones
- [ ] Advanced analytics dashboard
- [ ] Machine learning for balance

---

## 📝 Notes

- Matches are saved **after they end** in `endCombatInstance()`
- Database uses **SQLite** by default
- All queries are **optimized with indexes**
- Player stats are **cached** for performance
- Combat instances are kept in memory for **5 seconds** after ending
- Failed saves are **logged** but don't crash the server

---

## 🎊 Ready to Use!

Just run the migrations and start playing! Every PvP and PvE match will be automatically recorded with full statistics! 🏆

