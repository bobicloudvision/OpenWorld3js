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
        'current_zone_id',
        'zone_position',
        'zone_entered_at',
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
            'zone_position' => 'array',
            'zone_entered_at' => 'datetime',
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

    /**
     * Get the zone the player is currently in.
     */
    public function currentZone(): BelongsTo
    {
        return $this->belongsTo(Zone::class, 'current_zone_id');
    }

    /**
     * Get all combat matches this player participated in
     */
    public function combatMatchParticipations(): HasMany
    {
        return $this->hasMany(CombatMatchPlayer::class);
    }

    /**
     * Get matches where this player won (1v1 only)
     */
    public function wonMatches(): HasMany
    {
        return $this->hasMany(CombatMatch::class, 'winner_player_id');
    }

    /**
     * Get combat match stats
     */
    public function getCombatStats(): array
    {
        $participations = $this->combatMatchParticipations;
        
        return [
            'total_matches' => $participations->count(),
            'wins' => $participations->where('result', 'won')->count(),
            'losses' => $participations->where('result', 'lost')->count(),
            'draws' => $participations->where('result', 'draw')->count(),
            'total_damage_dealt' => $participations->sum('damage_dealt'),
            'total_healing_done' => $participations->sum('healing_done'),
            'total_kills' => $participations->sum('kills'),
            'total_deaths' => $participations->sum('deaths'),
            'win_rate' => $participations->count() > 0 
                ? round(($participations->where('result', 'won')->count() / $participations->count()) * 100, 1) 
                : 0,
        ];
    }
}
