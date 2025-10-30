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
        Schema::create('heroes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('health')->default(100);
            $table->unsignedInteger('max_health')->default(100);
            $table->unsignedInteger('power')->default(100);
            $table->unsignedInteger('max_power')->default(100);
            $table->unsignedInteger('attack')->default(10);
            $table->unsignedInteger('defense')->default(5);
            $table->string('model')->nullable();
            $table->float('model_scale')->default(1);
            $table->json('model_rotation')->nullable();
            $table->unsignedInteger('price')->nullable(); // Gold/coins cost to purchase this hero
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('heroes');
    }
};
