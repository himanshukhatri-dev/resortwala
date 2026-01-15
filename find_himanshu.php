<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$customers = App\Models\Customer::where('name', 'like', '%Himanshu%')->get(['id', 'name', 'phone', 'email']);
echo json_encode($customers);
