# Player-Hero System Documentation

## Overview
The player-hero system allows **users** to have multiple **game profiles (players)**, and each player can own multiple **hero instances** with unique stats, customizations, and progression.

## Entity Hierarchy

```
User (Account)
  └─ Player (Game Profile/Save Slot)
      ├─ Player Stats (level, XP, currency)
      ├─ Active Hero (currently selected)
      └─ PlayerHero Instances (Owned Heroes)
          ├─ Hero Instance #1 (Goblin Warrior Lv.15)
          ├─ Hero Instance #2 (Dark Mage Lv.8)
          └─ Hero Instance #3 (Orc Berserker Lv.22)
              ├─ Instance Stats (level, XP, HP, etc.)
              ├─ Customization (nickname, equipment, talents)
              └─ References Base Hero Definition
```

## Database Tables

### `users`
Authentication accounts (Laravel default)
- One user can have multiple game profiles

### `players`
Game profiles/save slots for a user
- `user_id` - Owner
- `name` - Profile name (e.g., "Main Character", "Alt Account")
- `level` - Overall player level
- `experience` - Overall XP
- `currency` - Gold/coins
- `active_hero_id` - Currently selected hero instance

### `heroes`
Base hero definitions (templates)
- `name` - Hero class name (e.g., "Goblin Warrior")
- `health`, `max_health`, `power`, `max_power`, `attack`, `defense` - Base stats
- `model`, `model_scale`, `model_rotation` - 3D model info
- Defines what spells the hero class can use

### `player_heroes`
Player-owned hero instances (pivot with extra data)
- `player_id` - Which player owns this
- `hero_id` - Which hero class this is
- `level` - This instance's level (separate from player level)
- `experience` - This instance's XP
- `health`, `max_health`, `power`, `max_power`, `attack`, `defense` - Custom stats (nullable, falls back to hero defaults)
- `nickname` - Custom name (e.g., rename "Goblin Warrior" to "Speedy Gonzales")
- `equipment` - JSON: Equipped items
- `talents` - JSON: Skill tree selections
- `acquired_at` - When player obtained this hero

## Model Relationships

### User Model
```php
// Get all game profiles
$user->players 

// Example
$user = User::find(1);
$mainProfile = $user->players()->where('name', 'Main')->first();
```

### Player Model
```php
// Get the account owner
$player->user

// Get all owned hero instances (with custom stats)
$player->playerHeroes

// Get currently active hero instance
$player->activeHero

// Get base hero definitions (convenience method)
$player->heroes

// Example
$player = Player::find(1);
$activeHero = $player->activeHero; // PlayerHero instance
$heroStats = $activeHero->getEffectiveStats(); // Gets stats with fallbacks
```

### Hero Model
```php
// Get spells this hero class can use
$hero->spells

// Get all player instances that own this hero
$hero->playerHeroes

// Get all players that own this hero
$hero->players

// Example
$goblinWarrior = Hero::where('name', 'Goblin Warrior')->first();
$ownerCount = $goblinWarrior->playerHeroes()->count(); // How many players own this hero
```

### PlayerHero Model
```php
// Get the player owner
$playerHero->player

// Get the base hero definition
$playerHero->hero

// Get effective stats (custom or default)
$playerHero->getEffectiveStats()

// Get display name (nickname or hero name)
$playerHero->display_name

// Example
$instance = PlayerHero::find(1);
$stats = $instance->getEffectiveStats(); // Falls back to hero defaults
$name = $instance->display_name; // "Speedy Gonzales" or "Goblin Warrior"
```

## Usage Examples

### Create a New Player Profile
```php
$user = User::find(1);
$player = $user->players()->create([
    'name' => 'Main Character',
    'level' => 1,
    'experience' => 0,
    'currency' => 100,
]);
```

### Give Player a Hero
```php
$goblinHero = Hero::where('name', 'Goblin Warrior')->first();

$playerHero = $player->playerHeroes()->create([
    'hero_id' => $goblinHero->id,
    'level' => 1,
    'experience' => 0,
    'nickname' => 'Speedy', // Optional custom name
]);

// Set as active hero
$player->update(['active_hero_id' => $playerHero->id]);
```

### Level Up a Hero Instance
```php
$playerHero = PlayerHero::find(1);
$playerHero->update([
    'level' => $playerHero->level + 1,
    'experience' => 0,
    'max_health' => $playerHero->max_health + 10, // Boost stats
    'attack' => $playerHero->attack + 2,
]);
```

### Get All Heroes with Their Stats for a Player
```php
$player = Player::with(['playerHeroes.hero.spells'])->find(1);

foreach ($player->playerHeroes as $instance) {
    $stats = $instance->getEffectiveStats();
    echo "{$instance->display_name} (Lv.{$stats['level']}): ";
    echo "{$stats['health']}/{$stats['max_health']} HP, ";
    echo "{$stats['attack']} ATK\n";
    
    // Get spells this hero can cast
    foreach ($instance->hero->spells as $spell) {
        echo "  - {$spell->name}\n";
    }
}
```

### Switch Active Hero
```php
$player = Player::find(1);
$newActiveHero = $player->playerHeroes()->where('hero_id', 2)->first();

$player->update(['active_hero_id' => $newActiveHero->id]);
```

### Calculate Stats for Combat
```php
$playerHero = PlayerHero::with('hero.spells')->find(1);
$heroLevel = $playerHero->level;

// Get base stats (falls back to hero defaults if not customized)
$stats = $playerHero->getEffectiveStats();

// Calculate spell damage with scaling
foreach ($playerHero->hero->spells as $spell) {
    $damage = $spell->base_damage + ($heroLevel * $spell->damage_per_level);
    $powerCost = $spell->base_power_cost + ($heroLevel * $spell->power_cost_per_level);
    
    echo "{$spell->name}: {$damage} damage, {$powerCost} power\n";
    
    // Calculate effect parameters
    foreach ($spell->effects as $effect) {
        $duration = $effect->pivot->base_duration + 
                    ($heroLevel * $effect->pivot->duration_per_level);
        $tickDamage = $effect->pivot->base_tick_damage + 
                      ($heroLevel * $effect->pivot->tick_damage_per_level);
        
        echo "  Effect: {$effect->name} ({$duration}ms, {$tickDamage} tick dmg)\n";
    }
}
```

## Key Design Decisions

### Why Nullable Stats in PlayerHero?
- **Flexibility**: Players start with hero defaults, but can be boosted with items/upgrades
- **Storage Efficiency**: Don't duplicate data if stats match hero defaults
- **Easy Updates**: If base hero is rebalanced, existing instances inherit changes (unless customized)

### Why Both Player Level and Hero Level?
- **Player Level**: Account-wide progression (unlocks, currency bonuses)
- **Hero Level**: Individual hero mastery (stats, spell power)
- **Example**: Player Lv.50 with Goblin Warrior Lv.30 and Dark Mage Lv.10

### Why PlayerHero Instead of Simple Pivot?
- **Rich Data**: Each hero instance has unique level, XP, equipment, talents
- **Gacha/Collection Games**: Player can own the same hero multiple times with different builds
- **Unique Constraint**: One hero type per player (can be removed if you want duplicates)

## Frontend Integration

### Fetch Player Data
```javascript
// GET /api/players/{id}
{
  "id": 1,
  "name": "Main Character",
  "level": 15,
  "experience": 2500,
  "currency": 10000,
  "active_hero": {
    "id": 5,
    "hero": {
      "name": "Goblin Warrior",
      "model": "/models/avatars/GanfaulMAure.glb"
    },
    "level": 12,
    "nickname": "Speedy",
    "health": 180,
    "max_health": 200,
    "attack": 25
  },
  "heroes": [
    { "id": 5, "hero": {...}, "level": 12, "nickname": "Speedy" },
    { "id": 8, "hero": {...}, "level": 8, "nickname": null }
  ]
}
```

### Switch Hero
```javascript
// POST /api/players/{playerId}/switch-hero
{
  "player_hero_id": 8
}
```

## Migration Order
1. `users` (Laravel default)
2. `players` - References users
3. `heroes` - Base definitions
4. `player_heroes` - References players & heroes
5. `players` foreign key `active_hero_id` - References player_heroes (created after player_heroes exists)

**Note**: The `active_hero_id` foreign key in players migration will need to be added in a separate migration or made nullable initially.

---

**Date:** October 30, 2025
**Status:** ✅ Complete - Models and migrations updated

