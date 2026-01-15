<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = \DB::table('user_device_tokens')->count();
$tokens = \DB::table('user_device_tokens')->get();

echo "Token Count: " . $count . "\n";
foreach($tokens as $t) {
    echo "User: {$t->user_id} | Token: " . substr($t->fcm_token, 0, 20) . "...\n";
}
