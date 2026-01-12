<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Concerns\FromArray;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class OptionsSheet implements FromArray, WithHeadings, WithTitle, ShouldAutoSize, WithStyles, WithEvents
{
    public function title(): string
    {
        return 'Options';
    }

    public function headings(): array
    {
        return [
            'Property Types', 'Yes/No', 'Food Types', 'Payment Methods', 'ID Proofs', 'Common Amenities'
        ];
    }

    public function array(): array
    {
        // Transposing data for columns is harder in array(), so we will build a row-based structure that fills columns roughly.
        // Actually, it's easier to just prepopulate and let the event handler clean up or just list them vertically if they are independent.
        // But FromArray expects rows.
        
        // Let's create the longest list size
        $maxRows = 20; 
        $data = [];

        $propOptions = ['Villa', 'Water Park'];
        $yesNo = ['Yes', 'No'];
        $foodOptions = ['Veg', 'Non-Veg', 'Jain'];
        $paymentOptions = ['UPI', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING'];
        $idOptions = ['AADHAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID'];
        $amenities = ['POOL', 'WIFI', 'AC', 'TV', 'PARKING', 'GARDEN', 'BBQ', 'SOUND_SYSTEM', 'KITCHEN', 'CARETAKER'];

        for ($i = 0; $i < $maxRows; $i++) {
            $data[] = [
                $propOptions[$i] ?? '',
                $yesNo[$i] ?? '',
                $foodOptions[$i] ?? '',
                $paymentOptions[$i] ?? '',
                $idOptions[$i] ?? '',
                $amenities[$i] ?? '',
            ];
        }

        return $data;
    }
    
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Protect Sheet (Makes it uneditable)
                $sheet->getProtection()->setPassword('ResortWala2024');
                $sheet->getProtection()->setSheet(true);
            },
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']], 'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF444444']]],
        ];
    }
}
