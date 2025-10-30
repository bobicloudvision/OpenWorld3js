<?php

namespace App\Filament\Resources\Heroes\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class HeroesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable(),
                TextColumn::make('health')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('max_health')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('power')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('max_power')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('attack')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('defense')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('model')
                    ->searchable(),
                TextColumn::make('model_scale')
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
