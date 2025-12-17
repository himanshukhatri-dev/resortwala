<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Current Server Time: " . now() . "\n";
echo "Listing All Bookings request...\n";

$bookings = App\Models\Booking::all();
foreach ($bookings as $b) {
    echo "ID: {$b->BookingId} | Status: {$b->Status} | Email: {$b->CustomerEmail} | Mobile: {$b->CustomerMobile}\n";
}
