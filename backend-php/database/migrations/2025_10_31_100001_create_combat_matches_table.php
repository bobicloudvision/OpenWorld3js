<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('combat_matches', function (Blueprint $table) {
            $table->id();
            $table->string('combat_instance_id')->unique(); // Socket combat instance ID
            $table->enum('combat_type', ['pvp', 'pve', 'team_pvp', 'team_pve'])->default('pvp');
            $table->enum('match_type', ['world', 'matchmaking', 'duel'])->default('world'); // How match was created
            $table->string('queue_type')->nullable(); // 1v1, 2v2, 3v3, ffa, brawl
            $table->foreignId('zone_id')->nullable()->constrained('zones')->onDelete('set null');
            
            // Match outcome
            $table->enum('result', ['victory', 'defeat', 'draw'])->default('victory');
            $table->integer('winner_player_id')->nullable(); // NULL for draw or team victories
            $table->json('winner_team')->nullable(); // Array of winner player IDs
            $table->json('loser_team')->nullable(); // Array of loser player IDs
            
            // Match statistics
            $table->integer('total_players')->default(2);
            $table->integer('duration_seconds')->nullable(); // How long the battle lasted
            $table->integer('total_damage_dealt')->default(0);
            $table->integer('total_healing_done')->default(0);
            $table->integer('total_spells_cast')->default(0);
            
            // Timestamps
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('combat_type');
            $table->index('match_type');
            $table->index('zone_id');
            $table->index('winner_player_id');
            $table->index('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('combat_matches');
    }
};

