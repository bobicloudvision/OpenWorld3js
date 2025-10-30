<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Effect extends Model
{
    protected $fillable = [
        'type',
        'name',
        'description',
        'icon',
    ];

    public function spells(): BelongsToMany
    {
        return $this->belongsToMany(Spell::class, 'spell_effects')
            ->withPivot([
                'base_duration',
                'base_tick_damage',
                'base_tick_rate',
                'base_force',
                'base_heal_percent',
                'base_slow_percent',
                'base_bounces',
                'base_chain_range',
                'duration_per_level',
                'tick_damage_per_level',
                'force_per_level',
                'heal_percent_per_level',
                'slow_percent_per_level',
                'bounces_per_level',
                'chain_range_per_level',
                'effect_order',
            ])
            ->withTimestamps();
    }
}
