<?php

namespace App\Filament\Resources\CombatMatches\Pages;

use App\Filament\Resources\CombatMatches\CombatMatchResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCombatMatches extends ListRecords
{
    protected static string $resource = CombatMatchResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
