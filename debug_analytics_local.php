<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "Total Events: " . \DB::table('user_events')->count() . "\n";
echo "Events with User ID: " . \DB::table('user_events')->whereNotNull('user_id')->count() . "\n";
echo "Unique User IDs: " . \DB::table('user_events')->whereNotNull('user_id')->distinct()->count('user_id') . "\n";

$lastEvent = \DB::table('user_events')->orderBy('id', 'desc')->first();
echo "\nLast Event:\n";
print_r($lastEvent);
