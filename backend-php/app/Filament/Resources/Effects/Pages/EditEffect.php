<?php

namespace App\Filament\Resources\Effects\Pages;

use App\Filament\Resources\Effects\EffectResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditEffect extends EditRecord
{
    protected static string $resource = EffectResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
