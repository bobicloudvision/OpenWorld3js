<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlayerResource;
use App\Models\Player;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PlayerAuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('players', 'email')],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $player = Player::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        $token = $player->createToken('player-api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'player' => new PlayerResource($player),
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $player = Player::where('email', $validated['email'])->first();

        if (! $player || ! Hash::check($validated['password'], $player->password)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        $token = $player->createToken('player-api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'player' => new PlayerResource($player),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return new PlayerResource($request->user());
    }
}


