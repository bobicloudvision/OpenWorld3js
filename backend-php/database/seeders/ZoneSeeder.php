<?php

namespace Database\Seeders;

use App\Models\Zone;
use App\Models\ZonePortal;
use Illuminate\Database\Seeder;

class ZoneSeeder extends Seeder
{
    public function run(): void
    {
        // Create or update zones using slug as unique identifier
        $zonesData = [
            [
                'slug' => 'starter-lobby',
                'name' => 'Starter Lobby',
                'description' => 'A peaceful lobby where players can meet and prepare for adventures.',
                'type' => 'neutral',
                'map_file' => 'world1.glb',
                'environment_file' => 'models/night.hdr',
                'spawn_position' => ['x' => 0, 'y' => 2, 'z' => 0],
                'min_level' => 1,
                'max_level' => null,
                'max_players' => 100,
                'is_combat_zone' => false,
                'is_safe_zone' => true,
                'is_active' => true,
                'settings' => [
                    'gravity' => -20,
                    'ambientLight' => 0.7,
                    'directionalLight' => 0.4
                ],
            ],
            [
                'slug' => 'training-grounds',
                'name' => 'Training Grounds',
                'description' => 'A combat zone for beginners to practice their skills.',
                'type' => 'pve',
                'map_file' => 'world1.glb',
                'environment_file' => 'models/night.hdr',
                'spawn_position' => ['x' => 50, 'y' => 2, 'z' => 50],
                'min_level' => 1,
                'max_level' => 10,
                'max_players' => 50,
                'is_combat_zone' => true,
                'is_safe_zone' => false,
                'is_active' => true,
                'settings' => [
                    'gravity' => -20,
                    'ambientLight' => 0.7,
                    'directionalLight' => 0.4
                ],
            ],
            [
                'slug' => 'dark-forest',
                'name' => 'Dark Forest',
                'description' => 'A dangerous forest filled with powerful enemies.',
                'type' => 'pve',
                'map_file' => 'world1.glb', // TODO: Create separate forest map
                'environment_file' => 'models/night.hdr',
                'spawn_position' => ['x' => -50, 'y' => 2, 'z' => -50],
                'min_level' => 5,
                'max_level' => 20,
                'max_players' => 30,
                'is_combat_zone' => true,
                'is_safe_zone' => false,
                'is_active' => true,
                'settings' => [
                    'gravity' => -20,
                    'ambientLight' => 0.3,
                    'directionalLight' => 0.2
                ],
            ],
            [
                'slug' => 'arena',
                'name' => 'Arena of Champions',
                'description' => 'PvP arena where players battle for glory.',
                'type' => 'pvp',
                'map_file' => 'world1.glb', // TODO: Create arena map
                'environment_file' => 'models/night.hdr',
                'spawn_position' => ['x' => 0, 'y' => 2, 'z' => 0],
                'min_level' => 10,
                'max_level' => null,
                'max_players' => 20,
                'is_combat_zone' => true,
                'is_safe_zone' => false,
                'is_active' => true,
                'settings' => [
                    'gravity' => -20,
                    'ambientLight' => 0.8,
                    'directionalLight' => 0.6
                ],
            ],
        ];

        // Store zone IDs for portal creation
        $zoneIds = [];
        foreach ($zonesData as $zoneData) {
            $slug = $zoneData['slug'];
            $zone = Zone::updateOrCreate(
                ['slug' => $slug],
                $zoneData
            );
            $zoneIds[$slug] = $zone->id;
        }

        // Create or update portals between zones
        $portalsData = [
            [
                'from_zone_slug' => 'starter-lobby',
                'to_zone_slug' => 'training-grounds',
                'portal_position' => ['x' => 10, 'y' => 0, 'z' => 0],
                'destination_position' => ['x' => 0, 'y' => 2, 'z' => 0],
                'portal_name' => 'Training Grounds Portal',
                'min_level_required' => 1,
                'is_active' => true,
            ],
            [
                'from_zone_slug' => 'starter-lobby',
                'to_zone_slug' => 'dark-forest',
                'portal_position' => ['x' => -10, 'y' => 0, 'z' => 0],
                'destination_position' => ['x' => 0, 'y' => 2, 'z' => 0],
                'portal_name' => 'Dark Forest Portal',
                'min_level_required' => 5,
                'is_active' => true,
            ],
            [
                'from_zone_slug' => 'starter-lobby',
                'to_zone_slug' => 'arena',
                'portal_position' => ['x' => 0, 'y' => 0, 'z' => 10],
                'destination_position' => ['x' => 0, 'y' => 2, 'z' => 0],
                'portal_name' => 'Arena Portal',
                'min_level_required' => 10,
                'is_active' => true,
            ],
        ];

        foreach ($portalsData as $portalData) {
            $fromZoneSlug = $portalData['from_zone_slug'];
            $toZoneSlug = $portalData['to_zone_slug'];
            
            ZonePortal::updateOrCreate(
                [
                    'from_zone_id' => $zoneIds[$fromZoneSlug],
                    'to_zone_id' => $zoneIds[$toZoneSlug],
                ],
                [
                    'portal_position' => $portalData['portal_position'],
                    'destination_position' => $portalData['destination_position'],
                    'portal_name' => $portalData['portal_name'],
                    'min_level_required' => $portalData['min_level_required'],
                    'is_active' => $portalData['is_active'],
                ]
            );
        }
    }
}

