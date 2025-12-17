<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Seeding Property 1...\n";

// Ensure User 1 exists for the property owner
$user = App\Models\User::firstOrCreate(
    ['email' => 'vendor@resortwala.com'],
    ['name' => 'Partner Vendor', 'password' => bcrypt('password'), 'role' => 'vendor']
);

$property = App\Models\PropertyMaster::updateOrCreate(
    ['PropertyId' => 1],
    [
        'Name' => 'Seaside Villa',
        'Location' => 'Goa',
        'Description' => 'Beautiful sea view villa',
        'CityLatitude' => '15.2993',
        'CityLongitude' => '74.1240',
        'Price' => 5000,
        'user_id' => $user->id,
        'created_at' => now(),
        'updated_at' => now()
    ]
);

echo "Property 1 Seeded: ID " . $property->PropertyId . "\n";
