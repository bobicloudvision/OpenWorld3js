# Spell Storage: Database vs Hardcoded

## Decision: **Use Database Storage with Caching**

## Why Database?

### ✅ Already Have Infrastructure
- Complete database schema (`spells`, `spell_effects`, `hero_spells`)
- Filament admin panel for managing spells
- Level-based scaling support built-in
- Multiple effects per spell support

### ✅ Benefits

1. **No Code Changes for Balancing**
   - Update spell stats via admin panel
   - No need to redeploy code
   - Faster iteration on game balance

2. **Dynamic Content**
   - Add new spells without code changes
   - A/B test different spell configurations
   - Seasonal events with special spells

3. **Better Data Management**
   - Version history (via database)
   - Analytics (track spell usage)
   - Admin-friendly interface

4. **Hero-Specific Spells**
   - Already have `hero_spells` relationship
   - Different heroes can have different spell sets
   - Easy to assign/unassign spells

5. **Level Scaling**
   - Automatic scaling per hero level
   - Per-level effect scaling
   - No hardcoded scaling formulas

### ⚠️ Considerations

1. **Performance**
   - ✅ **Solved**: Load spells on startup into memory cache
   - ✅ **Solved**: No database queries during combat

2. **Initial Load Time**
   - ✅ **Negligible**: Spells load once on server start (~50-100ms)

3. **Cache Invalidation**
   - ✅ **Solution**: `reloadSpellDefinitions()` function
   - Can be called via admin webhook when spells change

## Implementation

### Architecture

```
┌─────────────────────────────────────────┐
│   Database (SQLite/PostgreSQL)          │
│   - spells table                         │
│   - spell_effects table                  │
│   - hero_spells table                    │
└───────────────┬─────────────────────────┘
                │
                │ On Server Startup
                ▼
┌─────────────────────────────────────────┐
│   Spell Service (spellService.js)        │
│   - loadSpellDefinitions()               │
│   - In-memory cache (Map)                │
│   - getSpellForCombat(spellKey, level)   │
└───────────────┬─────────────────────────┘
                │
                │ During Combat
                ▼
┌─────────────────────────────────────────┐
│   Combat Service                        │
│   - Uses cached spell definitions       │
│   - Fast lookups (O(1))                  │
│   - No database queries                  │
└─────────────────────────────────────────┘
```

### Spell Loading Flow

1. **Server Startup** (`server.js`)
   ```javascript
   import { loadSpellDefinitions } from './services/spellService.js';
   loadSpellDefinitions(); // Load once on startup
   ```

2. **Combat Handler** (`sockets/combat.js`)
   ```javascript
   import { getSpellForCombat } from './services/spellService.js';
   
   // Get scaled spell for hero's level
   const heroLevel = activeHero?.level || 1;
   const spell = getSpellForCombat(spellKey, heroLevel);
   ```

3. **Spell Service** (`services/spellService.js`)
   - Loads all spells from database on startup
   - Caches in memory (Map)
   - Provides `getSpellForCombat(key, level)` for scaled stats
   - Supports multiple effects per spell

### Cache Management

```javascript
// Load on startup
loadSpellDefinitions();

// Reload when spells are updated (via admin panel webhook)
socket.on('admin:spells-updated', () => {
  reloadSpellDefinitions();
});
```

## Database Schema Usage

### Spells Table
- `base_damage`, `base_power_cost`, `base_cooldown`, etc. - Base stats
- `damage_per_level`, `power_cost_per_level`, etc. - Scaling per level
- `key` - Unique identifier (e.g., 'fire', 'ice')

### Spell Effects Table
- Links spells to effects via pivot
- Stores effect parameters (duration, tick_damage, force, etc.)
- Supports level-based scaling for effects

### Example Query Result

```javascript
{
  key: 'fire',
  name: 'Fireball',
  damage: 27,        // 25 base + (1 level * 2 per_level)
  powerCost: 20,
  cooldown: 2000,
  range: 15,
  affectRange: 2,
  statusEffects: [
    {
      type: 'poison',
      duration: 5000,
      tickDamage: 5,
      tickRate: 1000
    }
  ]
}
```

## When to Use Hardcoded?

Hardcoding might be appropriate for:
- **Prototyping**: Quick iteration before schema is finalized
- **Core System Spells**: Spells that should never change (e.g., basic attack)
- **Fallback**: Backup definitions if database is unavailable

## Recommendation

**Use database storage** because:
1. You already have the infrastructure
2. Better for game balance iteration
3. Supports dynamic content
4. Performance is excellent with caching
5. Admin-friendly via Filament

## Next Steps

1. ✅ Spell service created and integrated
2. ✅ Server loads spells on startup
3. ✅ Combat service uses database spells
4. 🔄 Test with actual database data
5. 🔄 Add admin webhook to reload spells on update
6. 🔄 Monitor performance

## Migration from Hardcoded

If you have hardcoded spells in `gameStore.js`:
1. Import those spell definitions to database via seeder
2. Match the `key` values exactly
3. Test that combat behaves the same
4. Remove hardcoded definitions from frontend

## Performance Impact

- **Startup**: +50-100ms (one-time, acceptable)
- **Combat**: 0ms (uses cache, O(1) lookup)
- **Memory**: ~1-5MB for typical spell set (negligible)

## Conclusion

**Database storage with caching is the clear winner** for your use case. It provides flexibility, maintainability, and excellent performance while leveraging your existing infrastructure.

