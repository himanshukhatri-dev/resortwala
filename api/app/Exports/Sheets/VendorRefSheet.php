<?php

namespace App\Exports\Sheets;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class VendorRefSheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    public function title(): string
    {
        return 'Reference - Vendors';
    }

    public function headings(): array
    {
        return [
            'Vendor ID', 'Contact Name', 'Organization (Business Name)', 'City', 'Phone', 'Email'
        ];
    }

    public function collection()
    {
        // Fetch all users with role 'vendor'
        return User::where('role', 'vendor')
            ->select('id', 'name', 'business_name', 'city', 'phone', 'email')
            ->get();
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Bold header
            1 => ['font' => ['bold' => true, 'size' => 12]],
        ];
    }
}
