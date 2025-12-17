<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Seeding Bookings...\n";
App\Models\Booking::truncate();

App\Models\Booking::create([
    'PropertyId' => 1,
    'CustomerName' => 'Vendor Test',
    'CustomerMobile' => '9999999999',
    'CustomerEmail' => 'vendor@resortwala.com',
    'CheckInDate' => now()->addDays(5),
    'CheckOutDate' => now()->addDays(7),
    'Guests' => 2,
    'TotalAmount' => 12000,
    'Status' => 'Confirmed'
]);

App\Models\Booking::create([
    'PropertyId' => 1,
    'CustomerName' => 'Jane Smith (Pending)',
    'CustomerMobile' => '9998887776',
    'CheckInDate' => now()->addDays(10),
    'CheckOutDate' => now()->addDays(12),
    'Guests' => 4,
    'TotalAmount' => 3000,
    'Status' => 'pending'
]);

App\Models\Booking::create([
    'PropertyId' => 1,
    'CustomerName' => 'Owner Block',
    'CustomerMobile' => '0000000000',
    'CheckInDate' => now()->addDays(15),
    'CheckOutDate' => now()->addDays(17),
    'Guests' => 0,
    'TotalAmount' => 0,
    'Status' => 'locked'
]);

echo "Seeding Complete. Checking Data...\n";
$bookings = App\Models\Booking::where('PropertyId', 1)->get();
echo "Count: " . $bookings->count() . "\n";

foreach ($bookings as $b) {
    echo "ID: " . $b->BookingId . " | Status: '" . $b->Status . "' | PropertyId: " . $b->PropertyId . "\n";
}

echo "Checking Status Filter...\n";
$filtered = App\Models\Booking::where('PropertyId', 1)
    ->whereIn('Status', ['confirmed', 'locked', 'pending'])
    ->get();
echo "Filtered Count: " . $filtered->count() . "\n";
