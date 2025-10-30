<?php

namespace App\Filament\Resources\Effects\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class EffectsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable(),
                TextColumn::make('duration')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('force')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('tick_damage')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('tick_rate')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('heal_percent')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('slow_percent')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('bounces')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('chain_range')
                    ->numeric()
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
