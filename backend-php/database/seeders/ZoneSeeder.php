<?php

namespace Database\Seeders;

use App\Models\Zone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZoneSeeder extends Seeder
{
    public function run(): void
    {
        $zones = [
            [
                'name' => 'Starter Lobby',
                'slug' => 'starter-lobby',
                'description' => 'A peaceful lobby where players can meet and prepare for adventures.',
                'type' => 'neutral',
                'map_file' => 'world1.glb',
                'environment_file' => 'models/night.hdr',
                'spawn_position' => json_encode(['x' => 0, 'y' => 2, 'z' => 0]),
                'min_level' => 1,
                'max_level' => null,
                'max_players' => 100,
                'is_combat_zone' => false,
                'is_safe_zone' => true,
                'is_active' => true,
                'settings' => json_encode([
                    'gravity' => -20,
                    'ambientLight' => 0.7,
                    'directionalLight' => 0.4
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Training Grounds',
                'slug' => 'training-grounds',
                'description' => 'A combat zone for beginners to practice their skills.',
                'type' => 'pve',
                'map_file' => 'world1.glb',
                'environment_file' => 'models/night.hdr',
                'spawn_position' => json_encode(['x' => 50, 'y' => 2, 'z' => 50]),
                'min_level' => 1,
                'max_level' => 10,
                'max_players' => 50,
                'is_combat_zone' => true,
                'is_safe_zone' => false,
                'is_active' => true,
                'settings' => json_encode([
                    'gravity' => -20,
                    'ambientLight' => 0.7,
                    'directionalLight' => 0.4
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Dark Forest',
                'slug' => 'dark-forest',
                'description' => 'A dangerous forest filled with powerful enemies.',
                'type' => 'pve',
                'map_file' => 'world1.glb', // TODO: Create separate forest map
                'environment_file' => 'models/night.hdr',
                'spawn_position' => json_encode(['x' => -50, 'y' => 2, 'z' => -50]),
                'min_level' => 5,
                'max_level' => 20,
                'max_players' => 30,
                'is_combat_zone' => true,
                'is_safe_zone' => false,
                'is_active' => true,
                'settings' => json_encode([
                    'gravity' => -20,
                    'ambientLight' => 0.3,
                    'directionalLight' => 0.2
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Arena of Champions',
                'slug' => 'arena',
                'description' => 'PvP arena where players battle for glory.',
                'type' => 'pvp',
                'map_file' => 'world1.glb', // TODO: Create arena map
                'environment_file' => 'models/night.hdr',
                'spawn_position' => json_encode(['x' => 0, 'y' => 2, 'z' => 0]),
                'min_level' => 10,
                'max_level' => null,
                'max_players' => 20,
                'is_combat_zone' => true,
                'is_safe_zone' => false,
                'is_active' => true,
                'settings' => json_encode([
                    'gravity' => -20,
                    'ambientLight' => 0.8,
                    'directionalLight' => 0.6
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('zones')->insert($zones);

        // Create portals between zones
        $portals = [
            [
                'from_zone_id' => 1, // Starter Lobby
                'to_zone_id' => 2,   // Training Grounds
                'portal_position' => json_encode(['x' => 10, 'y' => 0, 'z' => 0]),
                'destination_position' => json_encode(['x' => 0, 'y' => 2, 'z' => 0]),
                'portal_name' => 'Training Grounds Portal',
                'min_level_required' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'from_zone_id' => 1, // Starter Lobby
                'to_zone_id' => 3,   // Dark Forest
                'portal_position' => json_encode(['x' => -10, 'y' => 0, 'z' => 0]),
                'destination_position' => json_encode(['x' => 0, 'y' => 2, 'z' => 0]),
                'portal_name' => 'Dark Forest Portal',
                'min_level_required' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'from_zone_id' => 1, // Starter Lobby
                'to_zone_id' => 4,   // Arena
                'portal_position' => json_encode(['x' => 0, 'y' => 0, 'z' => 10]),
                'destination_position' => json_encode(['x' => 0, 'y' => 2, 'z' => 0]),
                'portal_name' => 'Arena Portal',
                'min_level_required' => 10,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('zone_portals')->insert($portals);
    }
}

