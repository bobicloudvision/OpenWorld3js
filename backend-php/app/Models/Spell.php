<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Spell extends Model
{
    protected $fillable = [
        'key',
        'name',
        'damage',
        'power_cost',
        'cooldown',
        'color',
        'description',
        'range',
        'affect_range',
        'icon',
    ];

    public function heroes(): BelongsToMany
    {
        return $this->belongsToMany(Hero::class, 'hero_spells')->withTimestamps();
    }

    public function effects(): BelongsToMany
    {
        return $this->belongsToMany(Effect::class, 'spell_effects')->withTimestamps();
    }
}
