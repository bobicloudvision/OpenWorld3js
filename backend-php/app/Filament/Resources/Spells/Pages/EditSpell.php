<?php

namespace App\Filament\Resources\Spells\Pages;

use App\Filament\Resources\Spells\SpellResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditSpell extends EditRecord
{
    protected static string $resource = SpellResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
