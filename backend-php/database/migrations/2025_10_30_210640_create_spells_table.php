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
            $table->integer('damage');
            $table->unsignedInteger('power_cost');
            $table->unsignedInteger('cooldown'); // ms
            $table->string('color')->nullable();
            $table->text('description')->nullable();
            $table->float('range')->default(0);
            $table->float('affect_range')->default(0);
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
