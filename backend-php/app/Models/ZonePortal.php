<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZonePortal extends Model
{
    protected $fillable = [
        'from_zone_id',
        'to_zone_id',
        'portal_position',
        'destination_position',
        'portal_name',
        'min_level_required',
        'is_active',
    ];

    protected $casts = [
        'portal_position' => 'array',
        'destination_position' => 'array',
        'is_active' => 'boolean',
    ];

    public function fromZone(): BelongsTo
    {
        return $this->belongsTo(Zone::class, 'from_zone_id');
    }

    public function toZone(): BelongsTo
    {
        return $this->belongsTo(Zone::class, 'to_zone_id');
    }

    public function canPlayerUse(Player $player): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $playerLevel = $player->activeHero?->level ?? 1;
        
        return $playerLevel >= $this->min_level_required;
    }
}

