<?php

namespace App\Filament\Resources\Effects\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class EffectForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('type')
                    ->required(),
                TextInput::make('duration')
                    ->numeric(),
                TextInput::make('force')
                    ->numeric(),
                TextInput::make('tick_damage')
                    ->numeric(),
                TextInput::make('tick_rate')
                    ->numeric(),
                TextInput::make('heal_percent')
                    ->numeric(),
                TextInput::make('slow_percent')
                    ->numeric(),
                TextInput::make('bounces')
                    ->numeric(),
                TextInput::make('chain_range')
                    ->numeric(),
                Textarea::make('config')
                    ->columnSpanFull(),
            ]);
    }
}
