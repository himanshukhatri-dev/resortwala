<?php
// reset_db_force.php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Disabling foreign key checks...\n";
Schema::disableForeignKeyConstraints();

echo "Dropping all tables...\n";
$tables = DB::select('SHOW TABLES');
foreach ($tables as $table) {
    $tableName = array_values((array)$table)[0];
    Schema::drop($tableName);
    echo "Dropped: $tableName\n";
}

echo "Enabling foreign key checks...\n";
Schema::enableForeignKeyConstraints();

echo "Database reset complete.\n";
