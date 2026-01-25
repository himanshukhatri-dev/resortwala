<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\PropertyMaster;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class PropertyPricingTest extends TestCase
{
    /**
     * Test that display_price matches today's day-specific pricing.
     */
    public function test_display_price_matches_day_specific_admin_pricing()
    {
        $property = new PropertyMaster();
        $property->Price = 1000;

        $today = Carbon::now();
        $dayName = strtolower($today->format('l')); // sunday, monday, etc.

        $adminPricing = [
            $dayName => [
                'villa' => [
                    'final' => 850,
                    'current' => 1000
                ]
            ]
        ];

        $property->admin_pricing = $adminPricing;

        $this->assertEquals(850, $property->display_price);
    }

    /**
     * Test that display_price falls back to mon_thu price correctly.
     */
    public function test_display_price_fallback_logic()
    {
        Carbon::setTestNow(Carbon::parse('Monday')); // Set to Monday

        $property = new PropertyMaster();
        $property->Price = 1000;
        $property->price_mon_thu = 600;

        $this->assertEquals(600, $property->display_price);

        Carbon::setTestNow(); // Reset
    }
}
