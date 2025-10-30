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
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->helperText('Unique effect type identifier (e.g., freeze, poison, slow)'),
                TextInput::make('name')
                    ->required()
                    ->helperText('Display name for the effect'),
                Textarea::make('description')
                    ->helperText('Brief description of what this effect does'),
                TextInput::make('icon')
                    ->helperText('Emoji or icon for the effect'),
            ]);
    }
}
