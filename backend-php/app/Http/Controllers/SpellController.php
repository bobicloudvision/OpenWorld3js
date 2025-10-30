<?php

namespace App\Http\Controllers;

use App\Models\Effect;
use App\Models\Spell;

class SpellController extends Controller
{
    public function index()
    {
        return Spell::with('effects')->paginate(50);
    }

    public function show(Spell $spell)
    {
        return $spell->load('effects');
    }
}


