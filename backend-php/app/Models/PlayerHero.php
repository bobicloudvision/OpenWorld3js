<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerHero extends Model
{
    protected $fillable = [
        'player_id',
        'hero_id',
        'level',
        'experience',
        'health',
        'max_health',
        'power',
        'max_power',
        'attack',
        'defense',
        'nickname',
        'equipment',
        'talents',
        'acquired_at',
    ];

    protected $casts = [
        'equipment' => 'array',
        'talents' => 'array',
        'acquired_at' => 'datetime',
    ];

    /**
     * Get the player that owns this hero instance.
     */
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    /**
     * Get the base hero definition.
     */
    public function hero(): BelongsTo
    {
        return $this->belongsTo(Hero::class);
    }

    /**
     * Get the effective stats (falls back to hero defaults if not customized).
     */
    public function getEffectiveStats(): array
    {
        $hero = $this->hero;
        
        return [
            'health' => $this->health ?? $hero->health,
            'max_health' => $this->max_health ?? $hero->max_health,
            'power' => $this->power ?? $hero->power,
            'max_power' => $this->max_power ?? $hero->max_power,
            'attack' => $this->attack ?? $hero->attack,
            'defense' => $this->defense ?? $hero->defense,
            'level' => $this->level,
            'experience' => $this->experience,
        ];
    }

    /**
     * Get display name (nickname or hero name).
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->nickname ?? $this->hero->name;
    }
}
