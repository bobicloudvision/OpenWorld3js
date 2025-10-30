<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Spell extends Model
{
    protected $fillable = [
        'key',
        'name',
        'base_damage',
        'base_power_cost',
        'base_cooldown',
        'base_range',
        'base_affect_range',
        'damage_per_level',
        'power_cost_per_level',
        'cooldown_per_level',
        'range_per_level',
        'affect_range_per_level',
        'color',
        'description',
        'icon',
    ];

    public function heroes(): BelongsToMany
    {
        return $this->belongsToMany(Hero::class, 'hero_spells')->withTimestamps();
    }

    public function effects(): BelongsToMany
    {
        return $this->belongsToMany(Effect::class, 'spell_effects')
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
