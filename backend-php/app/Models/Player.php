<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Sanctum\HasApiTokens;

class Player extends Authenticatable
{
    use HasApiTokens;
    protected $fillable = [
        'name',
        'email',
        'password',
        'level',
        'experience',
        'currency',
        'active_hero_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * Get all heroes owned by this player (with their instance data).
     */
    public function playerHeroes(): HasMany
    {
        return $this->hasMany(PlayerHero::class);
    }

    /**
     * Get the currently active hero instance.
     */
    public function activeHero(): BelongsTo
    {
        return $this->belongsTo(PlayerHero::class, 'active_hero_id');
    }

    /**
     * Get all base heroes this player owns (through player_heroes pivot).
     * This is a convenience method to access the Hero models directly.
     */
    public function heroes()
    {
        return $this->hasManyThrough(
            Hero::class,
            PlayerHero::class,
            'player_id', // Foreign key on player_heroes
            'id', // Foreign key on heroes
            'id', // Local key on players
            'hero_id' // Local key on player_heroes
        );
    }
}
