<?php

namespace App\Filament\Resources\Spells\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class SpellForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('key')
                    ->required(),
                TextInput::make('name')
                    ->required(),
                TextInput::make('damage')
                    ->required()
                    ->numeric(),
                TextInput::make('power_cost')
                    ->required()
                    ->numeric(),
                TextInput::make('cooldown')
                    ->required()
                    ->numeric(),
                TextInput::make('color'),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('range')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('affect_range')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('icon'),
            ]);
    }
}
