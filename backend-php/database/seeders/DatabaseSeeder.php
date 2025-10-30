<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Spell;
use App\Models\Effect;
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
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

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
                $effect = Effect::firstOrCreate(
                    ['type' => $se['type'], 'duration' => $se['type'] === 'knockback' ? null : ($se['duration'] ?? null)],
                    [
                        'force' => $se['force'] ?? null,
                        'tick_damage' => $se['tick_damage'] ?? null,
                        'tick_rate' => $se['tick_rate'] ?? null,
                        'heal_percent' => $se['heal_percent'] ?? null,
                        'slow_percent' => $se['slow_percent'] ?? null,
                        'bounces' => $se['bounces'] ?? null,
                        'chain_range' => $se['chain_range'] ?? null,
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
    }
}
