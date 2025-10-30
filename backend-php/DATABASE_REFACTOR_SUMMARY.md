# Database Architecture Refactor - Summary

## Overview
Refactored the spell and effect system to support:
- **Multiple effects per spell** (like WoW)
- **Effect parameters stored in pivot table** (not in effects table)
- **Level-based scaling** for spells and effects
- **Reusable effect definitions**

## What Changed

### 1. Effects Table (`effects`)
**Before:** Stored all effect parameters (duration, tick_damage, force, etc.)
**After:** Only stores effect type metadata

```sql
-- New structure
id, type (unique), name, description, icon, timestamps
```

**Why:** Same effect type (e.g., "poison") can now have different configurations per spell.

### 2. Spell Effects Pivot (`spell_effects`)
**Before:** Just linked spell_id and effect_id
**After:** Contains all effect parameters + scaling

```sql
-- New columns added
base_duration, base_tick_damage, base_tick_rate, base_force,
base_heal_percent, base_slow_percent, base_bounces, base_chain_range,
duration_per_level, tick_damage_per_level, force_per_level,
heal_percent_per_level, slow_percent_per_level, bounces_per_level,
chain_range_per_level, effect_order
```

**Why:** Each spell can have unique effect parameters (e.g., "Light Poison" vs "Heavy Poison").

### 3. Spells Table (`spells`)
**Before:** `damage`, `power_cost`, `cooldown`, `range`, `affect_range`
**After:** Base stats + scaling columns

```sql
-- Renamed to base_*
base_damage, base_power_cost, base_cooldown, base_range, base_affect_range

-- New scaling columns
damage_per_level, power_cost_per_level, cooldown_per_level,
range_per_level, affect_range_per_level
```

**Why:** Spells scale with hero level automatically.

## How It Works

### Example: Fireball at Different Levels
```php
// Spell: Fireball
base_damage: 25
damage_per_level: 2

// Hero Level 1: 25 + (1 * 2) = 27 damage
// Hero Level 10: 25 + (10 * 2) = 45 damage
// Hero Level 50: 25 + (50 * 2) = 125 damage
```

### Example: Multiple Effects on One Spell
```php
// Spell: "Corrupted Fireball"
// Effect 1: Direct damage (25 base, +2 per level)
// Effect 2: Poison (5 tick damage, +0.5 per level, 5000ms duration)
// Effect 3: Slow (50% slow, 3000ms duration, +100ms per level)
```

### Example: Same Effect Type, Different Configs
```php
// Spell: "Light Freeze"
// Uses effect_type: "freeze"
// base_duration: 3000ms, duration_per_level: 50ms

// Spell: "Deep Freeze"  
// Uses effect_type: "freeze"
// base_duration: 10000ms, duration_per_level: 200ms
```

## Model Changes

### Spell Model
- Updated `fillable` with new column names
- Added `withPivot()` to effects relationship for all pivot columns

### Effect Model
- Simplified `fillable` (only type, name, description, icon)
- Added `withPivot()` to spells relationship

## Seeder Changes

The seeder now:
1. Creates effect type definitions first (freeze, poison, slow, etc.)
2. Creates spells with base stats and scaling
3. Attaches effects to spells with pivot data

## Filament Admin Changes

### Effects Resource
- Simplified form (type, name, description, icon only)
- Table shows effect usage count

### Spells Resource
- Form grouped into sections:
  - Basic Information
  - Base Stats (Level 1)
  - Scaling Per Level (collapsed by default)
- Table shows base damage with scaling indicators
- Shows effect and hero usage counts

## Migration Steps

To apply these changes:

```bash
# 1. Fresh migrations (WARNING: deletes all data)
php artisan migrate:fresh

# 2. Seed the database
php artisan db:seed

# 3. (Optional) Create admin user
php artisan make:filament-user
```

## Benefits

✅ **Flexible:** Same effect type, different configs per spell
✅ **Scalable:** Automatic stat scaling with hero level
✅ **DRY:** Effect types are reusable definitions
✅ **WoW-like:** Supports complex multi-effect spells
✅ **Future-proof:** Easy to add spell ranks, talents, modifiers

## Next Steps (Optional)

Consider adding:
- `hero_talents` table for skill tree modifiers
- Spell rank system (multiple versions of same spell)
- `player_spell_unlocks` for per-player progression
- Item/equipment that modifies spell stats
- Buff/debuff stacking rules

## API Usage Example

```php
// Get spell with effects at specific hero level
$spell = Spell::with('effects')->find(1);
$heroLevel = 10;

// Calculate actual damage
$actualDamage = $spell->base_damage + ($heroLevel * $spell->damage_per_level);

// Calculate effect parameters
foreach ($spell->effects as $effect) {
    $duration = $effect->pivot->base_duration + 
                ($heroLevel * $effect->pivot->duration_per_level);
    $tickDamage = $effect->pivot->base_tick_damage + 
                  ($heroLevel * $effect->pivot->tick_damage_per_level);
}
```

---

**Date:** October 30, 2025
**Status:** ✅ Complete - All migrations, models, seeders, and Filament resources updated

