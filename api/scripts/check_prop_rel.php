<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Booking;

$bookings = Booking::limit(10)->get();
echo "ID | PropID | Prop Name\n";
echo "-----------------------\n";
foreach ($bookings as $b) {
    $prop = $b->property;
    $name = $prop ? $prop->Name : 'NULL';
    echo "{$b->BookingId} | {$b->PropertyId} | $name\n";
}
