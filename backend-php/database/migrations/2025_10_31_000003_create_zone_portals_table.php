<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zone_portals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_zone_id')->constrained('zones')->onDelete('cascade');
            $table->foreignId('to_zone_id')->constrained('zones')->onDelete('cascade');
            $table->json('portal_position'); // Position in from_zone
            $table->json('destination_position'); // Spawn position in to_zone
            $table->string('portal_name')->nullable();
            $table->integer('min_level_required')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zone_portals');
    }
};

