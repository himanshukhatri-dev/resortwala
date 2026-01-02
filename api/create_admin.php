<?php
// create_admin.php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

try {
    // Ensure table exists (basic check)
    DB::connection()->getPdo();
    
    $admin = User::firstOrCreate(
        ['email' => 'admin@resortwala.com'],
        [
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    $admin->password = Hash::make('password');
    $admin->save();

    echo "Admin User Created/Updated Successfully. Email: admin@resortwala.com Pass: password\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
