<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('type')->default('neutral'); // neutral, pvp, pve, raid, dungeon
            $table->string('map_file'); // e.g., 'world1.glb', 'dungeon1.glb'
            $table->string('environment_file')->default('models/night.hdr');
            $table->json('spawn_position')->default('{"x": 0, "y": 2, "z": 0}');
            $table->integer('min_level')->default(1);
            $table->integer('max_level')->nullable();
            $table->integer('max_players')->default(100);
            $table->boolean('is_combat_zone')->default(true);
            $table->boolean('is_safe_zone')->default(false); // like a lobby
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable(); // fog, lighting, gravity, etc.
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};

