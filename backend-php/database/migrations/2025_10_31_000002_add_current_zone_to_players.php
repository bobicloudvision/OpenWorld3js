<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->foreignId('current_zone_id')->nullable()->constrained('zones')->onDelete('set null');
            $table->json('zone_position')->nullable(); // Last known position in zone
            $table->timestamp('zone_entered_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropForeign(['current_zone_id']);
            $table->dropColumn(['current_zone_id', 'zone_position', 'zone_entered_at']);
        });
    }
};

