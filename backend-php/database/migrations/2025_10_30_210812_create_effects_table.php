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
        Schema::create('effects', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // e.g., freeze, knockback, poison, chain, lifesteal, slow
            $table->unsignedInteger('duration')->nullable(); // ms
            $table->float('force')->nullable(); // for knockback
            $table->integer('tick_damage')->nullable();
            $table->unsignedInteger('tick_rate')->nullable(); // ms
            $table->unsignedInteger('heal_percent')->nullable(); // for lifesteal
            $table->unsignedInteger('slow_percent')->nullable();
            $table->unsignedInteger('bounces')->nullable(); // for chain
            $table->float('chain_range')->nullable();
            $table->json('config')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('effects');
    }
};
