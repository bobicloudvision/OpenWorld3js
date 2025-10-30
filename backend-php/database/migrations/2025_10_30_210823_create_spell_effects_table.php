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
        Schema::create('spell_effects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spell_id')->constrained('spells')->cascadeOnDelete();
            $table->foreignId('effect_id')->constrained('effects')->cascadeOnDelete();
            
            // Base effect parameters (at level 1)
            $table->unsignedInteger('base_duration')->nullable(); // ms
            $table->integer('base_tick_damage')->nullable();
            $table->unsignedInteger('base_tick_rate')->nullable(); // ms
            $table->float('base_force')->nullable(); // for knockback
            $table->unsignedInteger('base_heal_percent')->nullable(); // for lifesteal
            $table->unsignedInteger('base_slow_percent')->nullable();
            $table->unsignedInteger('base_bounces')->nullable(); // for chain
            $table->float('base_chain_range')->nullable();
            
            // Scaling per hero level
            $table->float('duration_per_level')->default(0); // ms per level
            $table->float('tick_damage_per_level')->default(0);
            $table->float('force_per_level')->default(0);
            $table->float('heal_percent_per_level')->default(0);
            $table->float('slow_percent_per_level')->default(0);
            $table->float('bounces_per_level')->default(0);
            $table->float('chain_range_per_level')->default(0);
            
            // Effect application order (lower = first)
            $table->unsignedInteger('effect_order')->default(0);
            
            $table->unique(['spell_id', 'effect_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spell_effects');
    }
};
