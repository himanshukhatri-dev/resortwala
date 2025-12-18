<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Booking;
use App\Models\PropertyMaster;
use Carbon\Carbon;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Default to Property 20 if passed via command line argument could be complex, 
        // so we'll just target the first property or specific ID 20 for this specific "move to server" request.
        $propertyId = 20;

        // Clean up existing for this property to avoid duplicates on re-seed
        Booking::where('PropertyId', $propertyId)->delete();
        
        $bookings = [];

        // 1. Past Booking (Completed) - "Rahul Sharma"
        $bookings[] = [
            'PropertyId' => $propertyId,
            'CustomerName' => 'Rahul Sharma',
            'CustomerMobile' => '9876543210',
            'CheckInDate' => Carbon::now()->subDays(5)->format('Y-m-d'),
            'CheckOutDate' => Carbon::now()->subDays(2)->format('Y-m-d'),
            'Guests' => 2,
            'Status' => 'checked_out',
            'TotalAmount' => 5000,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // 2. Future Confirmed - "Priya Patel"
        $bookings[] = [
            'PropertyId' => $propertyId,
            'CustomerName' => 'Priya Patel',
            'CustomerMobile' => '9988776655',
            'CheckInDate' => Carbon::now()->addDays(2)->format('Y-m-d'),
            'CheckOutDate' => Carbon::now()->addDays(5)->format('Y-m-d'),
            'Guests' => 4,
            'Status' => 'confirmed',
            'TotalAmount' => 12000,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // 3. Pending Request - "Amit Singh"
        $bookings[] = [
            'PropertyId' => $propertyId,
            'CustomerName' => 'Amit Singh',
            'CustomerMobile' => '9123456789',
            'CheckInDate' => Carbon::now()->addDays(10)->format('Y-m-d'),
            'CheckOutDate' => Carbon::now()->addDays(12)->format('Y-m-d'),
            'Guests' => 2,
            'Status' => 'pending',
            'TotalAmount' => 4500,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // 4. Owner Lock - "Owner Lock"
        $bookings[] = [
            'PropertyId' => $propertyId,
            'CustomerName' => 'Owner Lock',
            'CustomerMobile' => '0000000000',
            'CheckInDate' => Carbon::now()->addDays(20)->format('Y-m-d'),
            'CheckOutDate' => Carbon::now()->addDays(22)->format('Y-m-d'),
            'Guests' => 0,
            'Status' => 'locked',
            'TotalAmount' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // 5. From reproduce_boundary.js (Feb 2026)
        $bookings[] = [
            'PropertyId' => $propertyId,
            'CustomerName' => 'Owner Lock (Boundary Test)',
            'CustomerMobile' => '0000000000',
            'CheckInDate' => '2026-02-10',
            'CheckOutDate' => '2026-02-15',
            'Guests' => 0,
            'Status' => 'locked',
            'TotalAmount' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // 6. From reproduce_lock.js (Jan 2026)
        $bookings[] = [
            'PropertyId' => $propertyId,
            'CustomerName' => 'Owner Lock (Lock Test)',
            'CustomerMobile' => '0000000000',
            'CheckInDate' => '2026-01-20',
            'CheckOutDate' => '2026-01-22',
            'Guests' => 0,
            'Status' => 'locked',
            'TotalAmount' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        Booking::insert($bookings);
    }
}
