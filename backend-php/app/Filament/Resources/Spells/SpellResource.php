<?php

namespace App\Filament\Resources\Spells;

use App\Filament\Resources\Spells\Pages\CreateSpell;
use App\Filament\Resources\Spells\Pages\EditSpell;
use App\Filament\Resources\Spells\Pages\ListSpells;
use App\Filament\Resources\Spells\Schemas\SpellForm;
use App\Filament\Resources\Spells\Tables\SpellsTable;
use App\Models\Spell;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class SpellResource extends Resource
{
    protected static ?string $model = Spell::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return SpellForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return SpellsTable::configure($table);
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
            'index' => ListSpells::route('/'),
            'create' => CreateSpell::route('/create'),
            'edit' => EditSpell::route('/{record}/edit'),
        ];
    }
}
