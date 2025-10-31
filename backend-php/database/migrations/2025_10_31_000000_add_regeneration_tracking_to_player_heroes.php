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
        Schema::table('player_heroes', function (Blueprint $table) {
            $table->timestamp('last_regen_at')->nullable()->after('max_power');
            $table->timestamp('last_combat_at')->nullable()->after('last_regen_at');
            $table->boolean('is_resting')->default(false)->after('last_combat_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('player_heroes', function (Blueprint $table) {
            $table->dropColumn(['last_regen_at', 'last_combat_at', 'is_resting']);
        });
    }
};

