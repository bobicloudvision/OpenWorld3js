<?php

namespace App\Http\Controllers;

use App\Models\Hero;

class HeroController extends Controller
{
    public function index()
    {
        return Hero::with('spells')->paginate(20);
    }

    public function show(Hero $hero)
    {
        return $hero->load('spells');
    }
}


