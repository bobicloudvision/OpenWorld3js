<?php

namespace App\Filament\Resources\Spells\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SpellForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Basic Information')
                    ->schema([
                        TextInput::make('key')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->helperText('Unique identifier for this spell'),
                        TextInput::make('name')
                            ->required()
                            ->helperText('Display name'),
                        TextInput::make('icon')
                            ->helperText('Emoji or icon'),
                        Textarea::make('description')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Section::make('Base Stats (Level 1)')
                    ->schema([
                        TextInput::make('base_damage')
                            ->required()
                            ->numeric()
                            ->helperText('Base damage at level 1'),
                        TextInput::make('base_power_cost')
                            ->required()
                            ->numeric()
                            ->helperText('Mana/power cost'),
                        TextInput::make('base_cooldown')
                            ->required()
                            ->numeric()
                            ->helperText('Cooldown in milliseconds'),
                        TextInput::make('base_range')
                            ->required()
                            ->numeric()
                            ->default(0)
                            ->helperText('Casting range'),
                        TextInput::make('base_affect_range')
                            ->required()
                            ->numeric()
                            ->default(0)
                            ->helperText('Area of effect radius'),
                        TextInput::make('color')
                            ->helperText('Hex color (e.g., #ff4444)'),
                    ])
                    ->columns(3),

                Section::make('Scaling Per Level')
                    ->schema([
                        TextInput::make('damage_per_level')
                            ->numeric()
                            ->default(0)
                            ->helperText('Damage increase per hero level'),
                        TextInput::make('power_cost_per_level')
                            ->numeric()
                            ->default(0)
                            ->helperText('Power cost change per level'),
                        TextInput::make('cooldown_per_level')
                            ->numeric()
                            ->default(0)
                            ->helperText('Cooldown change per level (negative = faster)'),
                        TextInput::make('range_per_level')
                            ->numeric()
                            ->default(0)
                            ->helperText('Range increase per level'),
                        TextInput::make('affect_range_per_level')
                            ->numeric()
                            ->default(0)
                            ->helperText('AoE radius increase per level'),
                    ])
                    ->columns(3)
                    ->collapsed(),
            ]);
    }
}
