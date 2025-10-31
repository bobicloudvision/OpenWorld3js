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

        $this->call(ZoneSeeder::class);


        // First, seed all effect types (reusable definitions)
        $effectTypes = [
            ['type' => 'freeze', 'name' => 'Freeze', 'description' => 'Immobilizes target', 'icon' => '🧊'],
            ['type' => 'knockback', 'name' => 'Knockback', 'description' => 'Pushes target away', 'icon' => '💥'],
            ['type' => 'poison', 'name' => 'Poison', 'description' => 'Damage over time', 'icon' => '☠️'],
            ['type' => 'chain', 'name' => 'Chain', 'description' => 'Bounces to nearby targets', 'icon' => '⚡'],
            ['type' => 'lifesteal', 'name' => 'Lifesteal', 'description' => 'Heal from damage dealt', 'icon' => '🩸'],
            ['type' => 'slow', 'name' => 'Slow', 'description' => 'Reduces movement speed', 'icon' => '⏰'],
        ];

        foreach ($effectTypes as $effectData) {
            Effect::firstOrCreate(
                ['type' => $effectData['type']],
                $effectData
            );
        }

        // Seed spells with base stats and scaling
        $magicTypes = [
            'fire' => [
                'name' => 'Fireball',
                'base_damage' => 25,
                'damage_per_level' => 2,
                'base_power_cost' => 20,
                'base_cooldown' => 2000,
                'base_range' => 15,
                'base_affect_range' => 2,
                'color' => '#ff4444',
                'description' => 'A powerful fire projectile',
                'icon' => '🔥',
            ],
            'ice' => [
                'name' => 'Ice Shard',
                'base_damage' => 20,
                'damage_per_level' => 1.5,
                'base_power_cost' => 15,
                'base_cooldown' => 1500,
                'base_range' => 12,
                'base_affect_range' => 1.5,
                'color' => '#44aaff',
                'description' => 'Freezing ice projectile',
                'icon' => '❄️',
            ],
            'freeze' => [
                'name' => 'Deep Freeze',
                'base_damage' => 10,
                'damage_per_level' => 1,
                'base_power_cost' => 25,
                'base_cooldown' => 10000,
                'base_range' => 10,
                'base_affect_range' => 3,
                'color' => '#00ffff',
                'description' => 'Freezes enemy in place',
                'icon' => '🧊',
                'effects' => [
                    ['type' => 'freeze', 'base_duration' => 10000, 'duration_per_level' => 200],
                ],
            ],
            'blizzard' => [
                'name' => 'Blizzard',
                'base_damage' => 20,
                'damage_per_level' => 2,
                'base_power_cost' => 50,
                'base_cooldown' => 15000,
                'base_range' => 25,
                'base_affect_range' => 8,
                'color' => '#88ddff',
                'description' => 'Massive freeze storm',
                'icon' => '❄️',
                'effects' => [
                    ['type' => 'freeze', 'base_duration' => 8000, 'duration_per_level' => 100],
                ],
            ],
            'lightning' => [
                'name' => 'Lightning Bolt',
                'base_damage' => 30,
                'damage_per_level' => 2.5,
                'base_power_cost' => 25,
                'base_cooldown' => 3000,
                'base_range' => 20,
                'base_affect_range' => 2,
                'color' => '#ffff44',
                'description' => 'Fast lightning attack',
                'icon' => '⚡',
            ],
            'bomb' => [
                'name' => 'Arcane Bomb',
                'base_damage' => 35,
                'damage_per_level' => 3,
                'base_power_cost' => 30,
                'base_cooldown' => 4000,
                'base_range' => 12,
                'base_affect_range' => 6,
                'color' => '#ff00ff',
                'description' => 'Explosive force that knocks back enemies',
                'icon' => '💣',
                'effects' => [
                    ['type' => 'knockback', 'base_force' => 8, 'force_per_level' => 0.2],
                ],
            ],
            'poison' => [
                'name' => 'Poison Cloud',
                'base_damage' => 15,
                'damage_per_level' => 1,
                'base_power_cost' => 20,
                'base_cooldown' => 3500,
                'base_range' => 10,
                'base_affect_range' => 5,
                'color' => '#88ff00',
                'description' => 'Deals damage over time',
                'icon' => '☠️',
                'effects' => [
                    ['type' => 'poison', 'base_duration' => 5000, 'base_tick_damage' => 5, 'base_tick_rate' => 1000, 'tick_damage_per_level' => 0.5],
                ],
            ],
            'chain' => [
                'name' => 'Chain Lightning',
                'base_damage' => 20,
                'damage_per_level' => 2,
                'base_power_cost' => 35,
                'base_cooldown' => 5000,
                'base_range' => 15,
                'base_affect_range' => 2,
                'color' => '#4444ff',
                'description' => 'Bounces between nearby enemies',
                'icon' => '⚡️',
                'effects' => [
                    ['type' => 'chain', 'base_bounces' => 3, 'base_chain_range' => 8, 'chain_range_per_level' => 0.1],
                ],
            ],
            'drain' => [
                'name' => 'Life Drain',
                'base_damage' => 25,
                'damage_per_level' => 2,
                'base_power_cost' => 20,
                'base_cooldown' => 4000,
                'base_range' => 12,
                'base_affect_range' => 1,
                'color' => '#ff0088',
                'description' => 'Steal life from enemies',
                'icon' => '🩸',
                'effects' => [
                    ['type' => 'lifesteal', 'base_heal_percent' => 50],
                ],
            ],
            'slow' => [
                'name' => 'Time Warp',
                'base_damage' => 5,
                'damage_per_level' => 0.5,
                'base_power_cost' => 20,
                'base_cooldown' => 5000,
                'base_range' => 15,
                'base_affect_range' => 4,
                'color' => '#8844ff',
                'description' => 'Slows enemy movement',
                'icon' => '⏰',
                'effects' => [
                    ['type' => 'slow', 'base_duration' => 4000, 'base_slow_percent' => 50, 'duration_per_level' => 100],
                ],
            ],
            'heal' => [
                'name' => 'Heal',
                'base_damage' => -30,
                'damage_per_level' => -2,
                'base_power_cost' => 30,
                'base_cooldown' => 4000,
                'base_range' => 8,
                'base_affect_range' => 0,
                'color' => '#44ff44',
                'description' => 'Restore health',
                'icon' => '💚',
            ],
            'meteor' => [
                'name' => 'Meteor',
                'base_damage' => 50,
                'damage_per_level' => 4,
                'base_power_cost' => 40,
                'base_cooldown' => 5000,
                'base_range' => 25,
                'base_affect_range' => 7,
                'color' => '#ff8800',
                'description' => 'Devastating meteor strike',
                'icon' => '☄️',
            ],
            'shield' => [
                'name' => 'Magic Shield',
                'base_damage' => 0,
                'base_power_cost' => 25,
                'base_cooldown' => 3000,
                'base_range' => 5,
                'base_affect_range' => 0,
                'color' => '#8888ff',
                'description' => 'Protective barrier',
                'icon' => '🛡️',
            ],
        ];

        foreach ($magicTypes as $key => $spellData) {
            // Create/update spell with base stats
            $spell = Spell::updateOrCreate(
                ['key' => $key],
                [
                    'name' => $spellData['name'],
                    'base_damage' => $spellData['base_damage'],
                    'base_power_cost' => $spellData['base_power_cost'],
                    'base_cooldown' => $spellData['base_cooldown'],
                    'base_range' => $spellData['base_range'] ?? 0,
                    'base_affect_range' => $spellData['base_affect_range'] ?? 0,
                    'damage_per_level' => $spellData['damage_per_level'] ?? 0,
                    'power_cost_per_level' => $spellData['power_cost_per_level'] ?? 0,
                    'cooldown_per_level' => $spellData['cooldown_per_level'] ?? 0,
                    'range_per_level' => $spellData['range_per_level'] ?? 0,
                    'affect_range_per_level' => $spellData['affect_range_per_level'] ?? 0,
                    'color' => $spellData['color'] ?? null,
                    'description' => $spellData['description'] ?? null,
                    'icon' => $spellData['icon'] ?? null,
                ]
            );

            // Attach effects with their pivot data
            if (isset($spellData['effects'])) {
                foreach ($spellData['effects'] as $effectData) {
                    $effect = Effect::where('type', $effectData['type'])->first();
                    if ($effect) {
                        $pivotData = [
                            'base_duration' => $effectData['base_duration'] ?? null,
                            'base_tick_damage' => $effectData['base_tick_damage'] ?? null,
                            'base_tick_rate' => $effectData['base_tick_rate'] ?? null,
                            'base_force' => $effectData['base_force'] ?? null,
                            'base_heal_percent' => $effectData['base_heal_percent'] ?? null,
                            'base_slow_percent' => $effectData['base_slow_percent'] ?? null,
                            'base_bounces' => $effectData['base_bounces'] ?? null,
                            'base_chain_range' => $effectData['base_chain_range'] ?? null,
                            'duration_per_level' => $effectData['duration_per_level'] ?? 0,
                            'tick_damage_per_level' => $effectData['tick_damage_per_level'] ?? 0,
                            'force_per_level' => $effectData['force_per_level'] ?? 0,
                            'heal_percent_per_level' => $effectData['heal_percent_per_level'] ?? 0,
                            'slow_percent_per_level' => $effectData['slow_percent_per_level'] ?? 0,
                            'bounces_per_level' => $effectData['bounces_per_level'] ?? 0,
                            'chain_range_per_level' => $effectData['chain_range_per_level'] ?? 0,
                            'effect_order' => $effectData['effect_order'] ?? 0,
                        ];

                        $spell->effects()->syncWithoutDetaching([$effect->id => $pivotData]);
                    }
                }
            }
        }

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
                'model_rotation' => null,
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
                'model_rotation' =>null,
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
                'model_rotation' => null,
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
                'model_rotation' => null,
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
