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
        Schema::create('spells', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., fire, ice, lightning
            $table->string('name');
            
            // Base stats (at level 1)
            $table->integer('base_damage');
            $table->unsignedInteger('base_power_cost');
            $table->unsignedInteger('base_cooldown'); // ms
            $table->float('base_range')->default(0);
            $table->float('base_affect_range')->default(0);
            
            // Scaling per hero level
            $table->float('damage_per_level')->default(0);
            $table->float('power_cost_per_level')->default(0);
            $table->float('cooldown_per_level')->default(0); // can be negative to reduce cooldown
            $table->float('range_per_level')->default(0);
            $table->float('affect_range_per_level')->default(0);
            
            // Visual and metadata
            $table->string('color')->nullable();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spells');
    }
};
