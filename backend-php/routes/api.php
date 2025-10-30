<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HeroController;
use App\Http\Controllers\SpellController;
use App\Http\Controllers\EffectController;

// Read-only public API endpoints
Route::get('heroes', [HeroController::class, 'index']);
Route::get('heroes/{hero}', [HeroController::class, 'show']);

Route::get('spells', [SpellController::class, 'index']);
Route::get('spells/{spell}', [SpellController::class, 'show']);

Route::get('effects', [EffectController::class, 'index']);
Route::get('effects/{effect}', [EffectController::class, 'show']);


