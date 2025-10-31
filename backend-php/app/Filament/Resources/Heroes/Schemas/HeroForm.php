<?php

namespace App\Filament\Resources\Heroes\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Schemas\Schema;

class HeroForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('health')
                    ->required()
                    ->numeric()
                    ->default(100),
                TextInput::make('max_health')
                    ->required()
                    ->numeric()
                    ->default(100),
                TextInput::make('power')
                    ->required()
                    ->numeric()
                    ->default(100),
                TextInput::make('max_power')
                    ->required()
                    ->numeric()
                    ->default(100),
                TextInput::make('attack')
                    ->required()
                    ->numeric()
                    ->default(10),
                TextInput::make('defense')
                    ->required()
                    ->numeric()
                    ->default(5),
                TextInput::make('model'),
                TextInput::make('model_scale')
                    ->required()
                    ->numeric()
                    ->default(1),
                Textarea::make('model_rotation')
                    ->columnSpanFull(),
                Select::make('spells')
                    ->label('Spells')
                    ->relationship('spells', 'name')
                    ->multiple()
                    ->preload()
                    ->searchable()
                    ->columnSpanFull(),
            ]);
    }
}
