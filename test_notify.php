<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\NotificationEngine;
use App\Models\User;

$user = User::first();
$engine = new NotificationEngine();
$engine->dispatch('booking.confirmed_customer', $user, [
    'customer_name' => 'Test', 
    'property_name' => 'Resort', 
    'id' => '123', 
    'CheckInDate' => '2026-01-20', 
    'CheckOutDate' => '2026-01-22', 
    'Guests' => 2, 
    'TotalAmount' => 5000
]);
echo "Dispatched";
