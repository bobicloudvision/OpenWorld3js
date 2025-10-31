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
        Schema::create('player_heroes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id');//->constrained()->cascadeOnDelete();
            $table->foreignId('hero_id');//->constrained()->cascadeOnDelete();

            // Instance-specific stats (can differ from base hero)
            $table->unsignedInteger('level')->default(1);
            $table->unsignedInteger('experience')->default(0);
            $table->unsignedInteger('health')->nullable(); // Current health (null = use hero default)
            $table->unsignedInteger('max_health')->nullable(); // Can be boosted with items/upgrades
            $table->unsignedInteger('power')->nullable();
            $table->unsignedInteger('max_power')->nullable();
            $table->unsignedInteger('attack')->nullable(); // Boosted stats
            $table->unsignedInteger('defense')->nullable();

            // Customization
            $table->string('nickname')->nullable(); // Player can rename their hero instance
            $table->json('equipment')->nullable(); // Equipped items
            $table->json('talents')->nullable(); // Skill tree selections

            $table->timestamp('acquired_at')->useCurrent();
            $table->unique(['player_id', 'hero_id']); // Player can't have duplicate heroes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_heroes');
    }
};
