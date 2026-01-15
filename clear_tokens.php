<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$userId = 1;
$count = App\Models\UserDeviceToken::where('user_id', $userId)->delete();

echo "Deleted $count tokens for User ID $userId.\n";
