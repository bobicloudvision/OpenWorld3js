<?php

namespace App\Filament\Resources\CombatMatches;

use App\Filament\Resources\CombatMatches\Pages\CreateCombatMatch;
use App\Filament\Resources\CombatMatches\Pages\EditCombatMatch;
use App\Filament\Resources\CombatMatches\Pages\ListCombatMatches;
use App\Filament\Resources\CombatMatches\Schemas\CombatMatchForm;
use App\Filament\Resources\CombatMatches\Tables\CombatMatchesTable;
use App\Models\CombatMatch;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CombatMatchResource extends Resource
{
    protected static ?string $model = CombatMatch::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'id';

    public static function form(Schema $schema): Schema
    {
        return CombatMatchForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CombatMatchesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCombatMatches::route('/'),
            'create' => CreateCombatMatch::route('/create'),
            'edit' => EditCombatMatch::route('/{record}/edit'),
        ];
    }
}
