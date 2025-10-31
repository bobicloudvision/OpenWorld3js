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
        Schema::create('combat_match_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('combat_match_id')->constrained('combat_matches')->onDelete('cascade');
            $table->foreignId('player_id')->constrained('players')->onDelete('cascade');
            $table->foreignId('player_hero_id')->nullable()->constrained('player_heroes')->onDelete('set null');
            
            // Player's role in match
            $table->enum('result', ['won', 'lost', 'draw'])->default('lost');
            $table->integer('team_number')->nullable(); // For team battles
            $table->integer('final_placement')->nullable(); // For FFA: 1st, 2nd, 3rd, etc.
            
            // Combat statistics
            $table->integer('damage_dealt')->default(0);
            $table->integer('damage_taken')->default(0);
            $table->integer('healing_done')->default(0);
            $table->integer('spells_cast')->default(0);
            $table->integer('kills')->default(0);
            $table->integer('deaths')->default(0);
            
            // Health/Power at end
            $table->integer('final_health')->default(0);
            $table->integer('final_max_health')->default(100);
            $table->integer('final_power')->default(0);
            $table->integer('final_max_power')->default(100);
            
            // Rewards
            $table->integer('experience_gained')->default(0);
            $table->integer('level_before')->default(1);
            $table->integer('level_after')->default(1);
            $table->boolean('leveled_up')->default(false);
            
            // Rating/Ranking (for future ELO system)
            $table->integer('rating_before')->nullable();
            $table->integer('rating_after')->nullable();
            $table->integer('rating_change')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('player_id');
            $table->index('combat_match_id');
            $table->index('result');
            $table->unique(['combat_match_id', 'player_id']); // Each player appears once per match
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('combat_match_players');
    }
};

