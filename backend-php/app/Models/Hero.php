<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Hero extends Model
{
    protected $fillable = [
        'name',
        'health',
        'max_health',
        'power',
        'max_power',
        'attack',
        'defense',
        'model',
        'model_scale',
        'model_rotation',
    ];

    protected $casts = [
        'model_rotation' => 'array',
    ];

    public function spells(): BelongsToMany
    {
        return $this->belongsToMany(Spell::class, 'hero_spells')->withTimestamps();
    }
}
