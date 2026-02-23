<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Booking;
use App\Services\NotificationService;

$booking = Booking::with('property')->first();
$notif = app(NotificationService::class);

// Reflect to access protected prepareBookingData
$method = new ReflectionMethod($notif, 'prepareBookingData');
$method->setAccessible(true);
$data = $method->invoke($notif, $booking);

echo "Data Keys: " . implode(', ', array_keys($data)) . "\n";
echo "Property Name: " . ($data['property_name'] ?? 'MISSING') . "\n";
echo "Customer Name: " . ($data['customer_name'] ?? 'MISSING') . "\n";
