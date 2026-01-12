<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use App\Exports\Sheets\TemplateSheet;
use App\Exports\Sheets\OptionsSheet;
use App\Exports\Sheets\VendorRefSheet;

class PropertyTemplateExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new TemplateSheet(),
            new OptionsSheet(),
            new VendorRefSheet(),
        ];
    }
}
