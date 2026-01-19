<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\NotificationEngine;

$engine = new NotificationEngine();
$engine->dispatch('otp.sms', ['mobile' => '9999999999'], [
    'otp' => '1234'
]);
echo "Dispatched SMS";
