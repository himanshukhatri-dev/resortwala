<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('coupons')->insertOrIgnore([
            [
                'code' => 'WELCOME10',
                'discount_type' => 'percentage',
                'value' => 10.00,
                'expiry_date' => Carbon::now()->addMonths(6),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'FLAT500',
                'discount_type' => 'fixed',
                'value' => 500.00,
                'expiry_date' => Carbon::now()->addMonths(6),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'SUMMER25',
                'discount_type' => 'percentage',
                'value' => 25.00,
                'expiry_date' => Carbon::now()->addMonths(1),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
