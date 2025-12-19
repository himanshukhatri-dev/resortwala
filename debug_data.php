<?php
require __DIR__ . '/api/vendor/autoload.php';
$app = require_once __DIR__ . '/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- USERS TABLE SCHEMA ---\n";
// Raw SQL to get column details
$schema = \Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM users WHERE Field = 'vendor_type'");
print_r($schema);

echo "\n--- BOOKINGS FOR PROPERTY 7 ---\n";
$bookings = App\Models\Booking::where('PropertyId', 7)->get();
echo $bookings->toJson(JSON_PRETTY_PRINT);
