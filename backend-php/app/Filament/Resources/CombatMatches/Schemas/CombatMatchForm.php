<?php

namespace App\Filament\Resources\CombatMatches\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class CombatMatchForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('combat_instance_id')
                    ->required(),
                TextInput::make('combat_type')
                    ->required()
                    ->default('pvp'),
                TextInput::make('match_type')
                    ->required()
                    ->default('world'),
                TextInput::make('queue_type'),
                Select::make('zone_id')
                    ->relationship('zone', 'name'),
                TextInput::make('result')
                    ->required()
                    ->default('victory'),
                TextInput::make('winner_player_id')
                    ->numeric(),
                Textarea::make('winner_team')
                    ->columnSpanFull(),
                Textarea::make('loser_team')
                    ->columnSpanFull(),
                TextInput::make('total_players')
                    ->required()
                    ->numeric()
                    ->default(2),
                TextInput::make('duration_seconds')
                    ->numeric(),
                TextInput::make('total_damage_dealt')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('total_healing_done')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('total_spells_cast')
                    ->required()
                    ->numeric()
                    ->default(0),
                DateTimePicker::make('started_at')
                    ->required(),
                DateTimePicker::make('ended_at'),
            ]);
    }
}
