<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Forcing property_id to be nullable...\n";

try {
    DB::statement('SET FOREIGN_KEY_CHECKS=0');
    
    // Raw Modify
    DB::statement('ALTER TABLE video_render_jobs MODIFY property_id BIGINT UNSIGNED NULL');
    
    DB::statement('SET FOREIGN_KEY_CHECKS=1');
    
    echo "SUCCESS: video_render_jobs table updated.\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
