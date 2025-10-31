<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CombatMatchPlayer extends Model
{
    protected $fillable = [
        'combat_match_id',
        'player_id',
        'player_hero_id',
        'result',
        'team_number',
        'final_placement',
        'damage_dealt',
        'damage_taken',
        'healing_done',
        'spells_cast',
        'kills',
        'deaths',
        'final_health',
        'final_max_health',
        'final_power',
        'final_max_power',
        'experience_gained',
        'level_before',
        'level_after',
        'leveled_up',
        'rating_before',
        'rating_after',
        'rating_change',
    ];

    protected function casts(): array
    {
        return [
            'leveled_up' => 'boolean',
        ];
    }

    /**
     * Get the combat match this player participated in
     */
    public function combatMatch(): BelongsTo
    {
        return $this->belongsTo(CombatMatch::class);
    }

    /**
     * Get the player
     */
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    /**
     * Get the hero used in this match
     */
    public function playerHero(): BelongsTo
    {
        return $this->belongsTo(PlayerHero::class);
    }

    /**
     * Calculate K/D ratio
     */
    public function getKdRatio(): float
    {
        if ($this->deaths === 0) {
            return (float) $this->kills;
        }
        return round($this->kills / $this->deaths, 2);
    }

    /**
     * Calculate damage efficiency (damage dealt vs taken)
     */
    public function getDamageEfficiency(): float
    {
        if ($this->damage_taken === 0) {
            return (float) $this->damage_dealt;
        }
        return round($this->damage_dealt / $this->damage_taken, 2);
    }

    /**
     * Check if player won this match
     */
    public function won(): bool
    {
        return $this->result === 'won';
    }

    /**
     * Check if player lost this match
     */
    public function lost(): bool
    {
        return $this->result === 'lost';
    }

    /**
     * Get survival percentage
     */
    public function getSurvivalPercentage(): float
    {
        if ($this->final_max_health === 0) {
            return 0.0;
        }
        return round(($this->final_health / $this->final_max_health) * 100, 1);
    }
}

