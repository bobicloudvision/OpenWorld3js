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

    /**
     * Get all player instances that own this hero.
     */
    public function playerHeroes()
    {
        return $this->hasMany(PlayerHero::class);
    }

    /**
     * Get all players that own this hero.
     */
    public function players()
    {
        return $this->hasManyThrough(
            Player::class,
            PlayerHero::class,
            'hero_id', // Foreign key on player_heroes
            'id', // Foreign key on players
            'id', // Local key on heroes
            'player_id' // Local key on player_heroes
        );
    }
}
