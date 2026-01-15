<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$exists = Schema::hasTable('notifications');
echo "Table 'notifications' " . ($exists ? "EXISTS" : "DOES NOT EXIST") . "\n";
