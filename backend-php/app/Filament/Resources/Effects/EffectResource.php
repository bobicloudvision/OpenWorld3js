<?php

namespace App\Filament\Resources\Effects;

use App\Filament\Resources\Effects\Pages\CreateEffect;
use App\Filament\Resources\Effects\Pages\EditEffect;
use App\Filament\Resources\Effects\Pages\ListEffects;
use App\Filament\Resources\Effects\Schemas\EffectForm;
use App\Filament\Resources\Effects\Tables\EffectsTable;
use App\Models\Effect;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class EffectResource extends Resource
{
    protected static ?string $model = Effect::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return EffectForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return EffectsTable::configure($table);
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
            'index' => ListEffects::route('/'),
            'create' => CreateEffect::route('/create'),
            'edit' => EditEffect::route('/{record}/edit'),
        ];
    }
}
