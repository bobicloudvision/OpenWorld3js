<?php

namespace App\Http\Controllers;

use App\Models\Effect;

class EffectController extends Controller
{
    public function index()
    {
        return Effect::paginate(50);
    }

    public function show(Effect $effect)
    {
        return $effect;
    }
}


