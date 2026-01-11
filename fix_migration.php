<?php
// Fix Migration State
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;

echo "--- STARTING FIX ---\n";

// 1. Delete the migration entry if it exists
$deleted = DB::table('migrations')->where('migration', '2025_12_23_192000_create_otps_table')->delete();
echo "Deleted {$deleted} migration entries.\n";

// 2. Drop table if exists (just in case it's partial)
Schema::dropIfExists('otps');
echo "Dropped 'otps' table (if existed).\n";

// 3. Run Migrations
echo "Running Migrations...\n";
Artisan::call('migrate', ['--force' => true]);
echo Artisan::output();

echo "--- COMPLETED ---\n";
