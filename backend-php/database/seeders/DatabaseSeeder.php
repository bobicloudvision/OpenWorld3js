<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Spell;
use App\Models\Effect;
use App\Models\Hero;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed default user
//        User::factory()->create([
//            'name' => 'Test User',
//            'email' => 'test@example.com',
//        ]);

        // Seed spells and effects mapped from frontend MAGIC_TYPES
        $magicTypes = [
            'fire' => [
                'name' => 'Fireball', 'damage' => 25, 'power_cost' => 20, 'cooldown' => 2000, 'color' => '#ff4444', 'description' => 'A powerful fire projectile', 'range' => 15, 'affect_range' => 2, 'icon' => '🔥',
            ],
            'ice' => [
                'name' => 'Ice Shard', 'damage' => 20, 'power_cost' => 15, 'cooldown' => 1500, 'color' => '#44aaff', 'description' => 'Freezing ice projectile', 'range' => 12, 'affect_range' => 1.5, 'icon' => '❄️',
            ],
            'freeze' => [
                'name' => 'Deep Freeze', 'damage' => 10, 'power_cost' => 25, 'cooldown' => 10000, 'color' => '#00ffff', 'description' => 'Freezes enemy in place', 'range' => 10, 'affect_range' => 3, 'icon' => '🧊',
                'statusEffect' => ['type' => 'freeze', 'duration' => 10000],
            ],
            'blizzard' => [
                'name' => 'Blizzard', 'damage' => 20, 'power_cost' => 50, 'cooldown' => 15000, 'color' => '#88ddff', 'description' => 'Massive freeze storm', 'range' => 25, 'affect_range' => 8, 'icon' => '❄️',
                'statusEffect' => ['type' => 'freeze', 'duration' => 8000],
            ],
            'lightning' => [
                'name' => 'Lightning Bolt', 'damage' => 30, 'power_cost' => 25, 'cooldown' => 3000, 'color' => '#ffff44', 'description' => 'Fast lightning attack', 'range' => 20, 'affect_range' => 2, 'icon' => '⚡',
            ],
            'bomb' => [
                'name' => 'Arcane Bomb', 'damage' => 35, 'power_cost' => 30, 'cooldown' => 4000, 'color' => '#ff00ff', 'description' => 'Explosive force that knocks back enemies', 'range' => 12, 'affect_range' => 6, 'icon' => '💣',
                'statusEffect' => ['type' => 'knockback', 'force' => 8],
            ],
            'poison' => [
                'name' => 'Poison Cloud', 'damage' => 15, 'power_cost' => 20, 'cooldown' => 3500, 'color' => '#88ff00', 'description' => 'Deals damage over time', 'range' => 10, 'affect_range' => 5, 'icon' => '☠️',
                'statusEffect' => ['type' => 'poison', 'duration' => 5000, 'tick_damage' => 5, 'tick_rate' => 1000],
            ],
            'chain' => [
                'name' => 'Chain Lightning', 'damage' => 20, 'power_cost' => 35, 'cooldown' => 5000, 'color' => '#4444ff', 'description' => 'Bounces between nearby enemies', 'range' => 15, 'affect_range' => 2, 'icon' => '⚡️',
                'statusEffect' => ['type' => 'chain', 'bounces' => 3, 'chain_range' => 8],
            ],
            'drain' => [
                'name' => 'Life Drain', 'damage' => 25, 'power_cost' => 20, 'cooldown' => 4000, 'color' => '#ff0088', 'description' => 'Steal life from enemies', 'range' => 12, 'affect_range' => 1, 'icon' => '🩸',
                'statusEffect' => ['type' => 'lifesteal', 'heal_percent' => 50],
            ],
            'slow' => [
                'name' => 'Time Warp', 'damage' => 5, 'power_cost' => 20, 'cooldown' => 5000, 'color' => '#8844ff', 'description' => 'Slows enemy movement', 'range' => 15, 'affect_range' => 4, 'icon' => '⏰',
                'statusEffect' => ['type' => 'slow', 'duration' => 4000, 'slow_percent' => 50],
            ],
            'heal' => [
                'name' => 'Heal', 'damage' => -30, 'power_cost' => 30, 'cooldown' => 4000, 'color' => '#44ff44', 'description' => 'Restore health', 'range' => 8, 'affect_range' => 0, 'icon' => '💚',
            ],
            'meteor' => [
                'name' => 'Meteor', 'damage' => 50, 'power_cost' => 40, 'cooldown' => 5000, 'color' => '#ff8800', 'description' => 'Devastating meteor strike', 'range' => 25, 'affect_range' => 7, 'icon' => '☄️',
            ],
            'shield' => [
                'name' => 'Magic Shield', 'damage' => 0, 'power_cost' => 25, 'cooldown' => 3000, 'color' => '#8888ff', 'description' => 'Protective barrier', 'range' => 5, 'affect_range' => 0, 'icon' => '🛡️',
            ],
        ];

        foreach ($magicTypes as $key => $spellData) {
            $effectId = null;
            if (isset($spellData['statusEffect'])) {
                $se = $spellData['statusEffect'];

                // Normalize keys from camelCase (frontend) to snake_case (DB) to avoid missing params
                $normalized = [
                    'type' => $se['type'] ?? null,
                    'duration' => $se['duration'] ?? ($se['Duration'] ?? null),
                    'force' => $se['force'] ?? ($se['Force'] ?? null),
                    'tick_damage' => $se['tick_damage'] ?? ($se['tickDamage'] ?? null),
                    'tick_rate' => $se['tick_rate'] ?? ($se['tickRate'] ?? null),
                    'heal_percent' => $se['heal_percent'] ?? ($se['healPercent'] ?? null),
                    'slow_percent' => $se['slow_percent'] ?? ($se['slowPercent'] ?? null),
                    'bounces' => $se['bounces'] ?? null,
                    'chain_range' => $se['chain_range'] ?? ($se['chainRange'] ?? null),
                ];

                $effect = Effect::firstOrCreate(
                    [
                        'type' => $normalized['type'],
                        'duration' => $normalized['type'] === 'knockback' ? null : ($normalized['duration'] ?? null),
                    ],
                    [
                        'force' => $normalized['force'],
                        'tick_damage' => $normalized['tick_damage'],
                        'tick_rate' => $normalized['tick_rate'],
                        'heal_percent' => $normalized['heal_percent'],
                        'slow_percent' => $normalized['slow_percent'],
                        'bounces' => $normalized['bounces'],
                        'chain_range' => $normalized['chain_range'],
                    ]
                );
                $effectId = $effect->id;
            }

            $spell = Spell::updateOrCreate(
                ['key' => $key],
                [
                    'name' => $spellData['name'],
                    'damage' => $spellData['damage'],
                    'power_cost' => $spellData['power_cost'],
                    'cooldown' => $spellData['cooldown'],
                    'color' => $spellData['color'] ?? null,
                    'description' => $spellData['description'] ?? null,
                    'range' => $spellData['range'] ?? 0,
                    'affect_range' => $spellData['affect_range'] ?? 0,
                    'icon' => $spellData['icon'] ?? null,
                ]
            );

            if ($effectId) {
                $spell->effects()->syncWithoutDetaching([$effectId]);
            }
        }

        // Seed heroes mirroring frontend INITIAL_ENEMIES and additional examples
        $piOver2Negative = -1.5707963267948966; // -Math.PI / 2 equivalent

        $heroes = [
            [
                'name' => 'Goblin Warrior',
                'health' => 60,
                'max_health' => 60,
                'power' => 50,
                'max_power' => 50,
                'attack' => 12,
                'defense' => 3,
                'model' => '/models/avatars/GanfaulMAure.glb',
                'model_scale' => 1,
                'model_rotation' => [0, $piOver2Negative, 0],
                'magic_types' => ['fire'],
            ],
            [
                'name' => 'Dark Mage',
                'health' => 40,
                'max_health' => 40,
                'power' => 80,
                'max_power' => 80,
                'attack' => 8,
                'defense' => 2,
                'model' => '/models/avatars/NightshadeJFriedrich.glb',
                'model_scale' => 1,
                'model_rotation' => [0, $piOver2Negative, 0],
                'magic_types' => ['ice', 'lightning'],
            ],
            [
                'name' => 'Orc Berserker',
                'health' => 120,
                'max_health' => 120,
                'power' => 30,
                'max_power' => 30,
                'attack' => 20,
                'defense' => 8,
                'model' => '/models/avatars/WarrokWKurniawan.glb',
                'model_scale' => 1,
                'model_rotation' => [0, $piOver2Negative, 0],
                'magic_types' => [],
            ],
            [
                'name' => 'Mutant',
                'health' => 50,
                'max_health' => 50,
                'power' => 30,
                'max_power' => 30,
                'attack' => 5,
                'defense' => 1,
                'model' => '/models/avatars/Mutant.glb',
                'model_scale' => 1,
                'model_rotation' => [0, $piOver2Negative, 0],
                'magic_types' => [],
            ],
        ];

        foreach ($heroes as $data) {
            $hero = Hero::updateOrCreate(
                ['name' => $data['name']],
                [
                    'health' => $data['health'],
                    'max_health' => $data['max_health'],
                    'power' => $data['power'],
                    'max_power' => $data['max_power'],
                    'attack' => $data['attack'],
                    'defense' => $data['defense'],
                    'model' => $data['model'],
                    'model_scale' => $data['model_scale'],
                    'model_rotation' => $data['model_rotation'],
                ]
            );

            if (!empty($data['magic_types'])) {
                $spellIds = Spell::whereIn('key', $data['magic_types'])->pluck('id')->all();
                if (!empty($spellIds)) {
                    $hero->spells()->syncWithoutDetaching($spellIds);
                }
            }
        }
    }
}
