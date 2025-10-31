<?php

namespace App\Filament\Resources\CombatMatches\Pages;

use App\Filament\Resources\CombatMatches\CombatMatchResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCombatMatch extends EditRecord
{
    protected static string $resource = CombatMatchResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
