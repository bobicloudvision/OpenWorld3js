<?php

namespace App\Filament\Resources\Spells\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class SpellsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('icon')
                    ->label(''),
                TextColumn::make('key')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info'),
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('base_damage')
                    ->numeric()
                    ->sortable()
                    ->label('Damage (Base)')
                    ->description(fn ($record) => $record->damage_per_level > 0 ? "+{$record->damage_per_level}/lvl" : null),
                TextColumn::make('base_power_cost')
                    ->numeric()
                    ->sortable()
                    ->label('Power Cost'),
                TextColumn::make('base_cooldown')
                    ->numeric()
                    ->sortable()
                    ->label('Cooldown (ms)'),
                TextColumn::make('base_range')
                    ->numeric()
                    ->sortable()
                    ->label('Range'),
                TextColumn::make('effects_count')
                    ->counts('effects')
                    ->label('Effects')
                    ->sortable(),
                TextColumn::make('heroes_count')
                    ->counts('heroes')
                    ->label('Used by Heroes')
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
