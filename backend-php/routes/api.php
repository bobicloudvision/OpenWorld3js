<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HeroController;
use App\Http\Controllers\SpellController;
use App\Http\Controllers\EffectController;
use App\Http\Controllers\Auth\PlayerAuthController;

// Read-only public API endpoints
Route::get('heroes', [HeroController::class, 'index']);
Route::get('heroes/{hero}', [HeroController::class, 'show']);

Route::get('spells', [SpellController::class, 'index']);
Route::get('spells/{spell}', [SpellController::class, 'show']);

Route::get('effects', [EffectController::class, 'index']);
Route::get('effects/{effect}', [EffectController::class, 'show']);


// Player auth (token-based via Sanctum)
Route::prefix('player')->group(function () {
    Route::post('register', [PlayerAuthController::class, 'register']);
    Route::post('login', [PlayerAuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [PlayerAuthController::class, 'logout']);
        Route::get('me', [PlayerAuthController::class, 'me']);
    });
});

