<?php

namespace App\Filament\Resources\Zones\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ZoneForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('slug')
                    ->required(),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('type')
                    ->required()
                    ->default('neutral'),
                TextInput::make('map_file')
                    ->required(),
                TextInput::make('environment_file')
                    ->required()
                    ->default('models/night.hdr'),
                Textarea::make('spawn_position')
                    ->required()
                    ->default('{"x": 0, "y": 2, "z": 0}')
                    ->columnSpanFull(),
                TextInput::make('min_level')
                    ->required()
                    ->numeric()
                    ->default(1),
                TextInput::make('max_level')
                    ->numeric(),
                TextInput::make('max_players')
                    ->required()
                    ->numeric()
                    ->default(100),
                Toggle::make('is_combat_zone')
                    ->required(),
                Toggle::make('is_safe_zone')
                    ->required(),
                Toggle::make('is_active')
                    ->required(),
                Textarea::make('settings')
                    ->columnSpanFull(),
            ]);
    }
}
