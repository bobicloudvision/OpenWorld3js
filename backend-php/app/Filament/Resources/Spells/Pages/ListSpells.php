<?php

namespace App\Filament\Resources\Spells\Pages;

use App\Filament\Resources\Spells\SpellResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListSpells extends ListRecords
{
    protected static string $resource = SpellResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
