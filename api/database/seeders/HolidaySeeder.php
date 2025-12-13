<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Holiday;

class HolidaySeeder extends Seeder
{
    public function run(): void
    {
        $holidays = [
            [
                'name' => 'Christmas',
                'from_date' => '2025-12-25',
                'to_date' => '2025-12-25',
                'base_price' => null, // Global holiday, no specific price override unless specified
                'extra_person_price' => null
            ],
            [
                'name' => 'New Year Eve',
                'from_date' => '2025-12-31',
                'to_date' => '2025-12-31',
                'base_price' => null,
                'extra_person_price' => null
            ],
            [
                'name' => 'New Year',
                'from_date' => '2026-01-01',
                'to_date' => '2026-01-01',
                'base_price' => null,
                'extra_person_price' => null
            ],
            [
                'name' => 'Republic Day',
                'from_date' => '2026-01-26',
                'to_date' => '2026-01-26',
                'base_price' => null,
                'extra_person_price' => null
            ],
            [
                'name' => 'Holi',
                'from_date' => '2026-03-08',
                'to_date' => '2026-03-08',
                'base_price' => null,
                'extra_person_price' => null
            ],
        ];

        foreach ($holidays as $holiday) {
            Holiday::create($holiday);
        }
    }
}
