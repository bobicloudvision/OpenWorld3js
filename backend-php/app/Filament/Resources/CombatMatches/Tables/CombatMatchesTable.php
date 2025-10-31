<?php

namespace App\Filament\Resources\CombatMatches\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CombatMatchesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('combat_instance_id')
                    ->searchable(),
                TextColumn::make('combat_type')
                    ->searchable(),
                TextColumn::make('match_type')
                    ->searchable(),
                TextColumn::make('queue_type')
                    ->searchable(),
                TextColumn::make('zone.name')
                    ->searchable(),
                TextColumn::make('result')
                    ->searchable(),
                TextColumn::make('winner_player_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_players')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('duration_seconds')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_damage_dealt')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_healing_done')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_spells_cast')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('started_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('ended_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
