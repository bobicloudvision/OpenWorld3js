<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Effect extends Model
{
    protected $fillable = [
        'type',
        'duration',
        'force',
        'tick_damage',
        'tick_rate',
        'heal_percent',
        'slow_percent',
        'bounces',
        'chain_range',
        'config',
    ];

    protected $casts = [
        'config' => 'array',
    ];

    public function spells(): BelongsToMany
    {
        return $this->belongsToMany(Spell::class, 'spell_effects')->withTimestamps();
    }
}
