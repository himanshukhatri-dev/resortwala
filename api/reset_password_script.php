<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $vendorData = \App\Models\PropertyMaster::select('vendor_id', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
        ->groupBy('vendor_id')
        ->orderByDesc('total')
        ->first();

    if (!$vendorData) {
        die("No properties found.");
    }

    $user = \App\Models\User::find($vendorData->vendor_id);
    if (!$user) {
        die("Vendor user not found for ID: " . $vendorData->vendor_id);
    }

    $user->password = \Illuminate\Support\Facades\Hash::make('password');
    $user->save();

    echo "EMAIL: " . $user->email . "\n";
    echo "PASSWORD: password\n";
    echo "NAME: " . $user->name . "\n";
    echo "PROPERTY_COUNT: " . $vendorData->total . "\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
