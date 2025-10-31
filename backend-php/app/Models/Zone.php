<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zone extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'type',
        'map_file',
        'environment_file',
        'spawn_position',
        'min_level',
        'max_level',
        'max_players',
        'is_combat_zone',
        'is_safe_zone',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'spawn_position' => 'array',
        'settings' => 'array',
        'is_combat_zone' => 'boolean',
        'is_safe_zone' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function players(): HasMany
    {
        return $this->hasMany(Player::class, 'current_zone_id');
    }

    public function portalsFrom(): HasMany
    {
        return $this->hasMany(ZonePortal::class, 'from_zone_id');
    }

    public function portalsTo(): HasMany
    {
        return $this->hasMany(ZonePortal::class, 'to_zone_id');
    }

    public function canPlayerEnter(Player $player): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Check level requirements
        $playerLevel = $player->activeHero?->level ?? 1;
        
        if ($playerLevel < $this->min_level) {
            return false;
        }

        if ($this->max_level && $playerLevel > $this->max_level) {
            return false;
        }

        return true;
    }
}

