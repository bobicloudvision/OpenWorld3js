<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CombatMatch extends Model
{
    protected $fillable = [
        'combat_instance_id',
        'combat_type',
        'match_type',
        'queue_type',
        'zone_id',
        'result',
        'winner_player_id',
        'winner_team',
        'loser_team',
        'total_players',
        'duration_seconds',
        'total_damage_dealt',
        'total_healing_done',
        'total_spells_cast',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'winner_team' => 'array',
            'loser_team' => 'array',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    /**
     * Get the zone where this match took place
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * Get the winner player (for 1v1)
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'winner_player_id');
    }

    /**
     * Get all players who participated in this match
     */
    public function players(): HasMany
    {
        return $this->hasMany(CombatMatchPlayer::class);
    }

    /**
     * Get only the winning players
     */
    public function winners(): HasMany
    {
        return $this->hasMany(CombatMatchPlayer::class)->where('result', 'won');
    }

    /**
     * Get only the losing players
     */
    public function losers(): HasMany
    {
        return $this->hasMany(CombatMatchPlayer::class)->where('result', 'lost');
    }

    /**
     * Calculate match duration in seconds
     */
    public function calculateDuration(): ?int
    {
        if ($this->started_at && $this->ended_at) {
            return $this->ended_at->diffInSeconds($this->started_at);
        }
        return null;
    }

    /**
     * Check if match is team-based
     */
    public function isTeamMatch(): bool
    {
        return in_array($this->combat_type, ['team_pvp', 'team_pve']);
    }

    /**
     * Check if match was from matchmaking
     */
    public function isMatchmaking(): bool
    {
        return $this->match_type === 'matchmaking';
    }
}

