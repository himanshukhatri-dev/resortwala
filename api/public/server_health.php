<?php
// api/public/server_health.php
// Place this file in your public folder and visit /server_health.php

echo "<h1>Staging Server Diagnostics</h1>";
echo "<hr>";

// 1. Check PHP
echo "<h3>1. PHP Environment</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
echo "<b>Current Script Path: " . __DIR__ . "</b><br>"; // Added this
echo "<b>Parent Directory Real Path: " . realpath(__DIR__ . '/../') . "</b><br>"; // Added this

// 2. Check Critical Files
echo "<h3>2. File System Checks</h3>";
echo "Scanning parent dir: <pre>" . print_r(scandir(__DIR__ . '/../'), true) . "</pre>"; // Added this

$paths = [
    '../vendor/autoload.php' => 'Composer Dependencies (vendor folder)',
    '../.env' => 'Environment File (.env)',
    '../bootstrap/app.php' => 'Laravel Bootstrap'
];

$allFilesFound = true;
foreach ($paths as $path => $name) {
    if (file_exists(__DIR__ . '/' . $path)) {
        echo "<div style='color:green'>[PASS] $name found.</div>";
    } else {
        echo "<div style='color:red; font-weight:bold'>[FAIL] $name MISSING!</div>";
        $allFilesFound = false;
    }
}

// 3. Check Permissions
echo "<h3>3. Permissions Check</h3>";
$storagePath = __DIR__ . '/../storage';
$logsPath = __DIR__ . '/../storage/logs';

if (is_writable($storagePath)) {
    echo "<div style='color:green'>[PASS] storage/ is writable.</div>";
} else {
    echo "<div style='color:red; font-weight:bold'>[FAIL] storage/ is NOT writable (Permission Denied).</div>";
}

if (is_writable($logsPath)) {
    echo "<div style='color:green'>[PASS] storage/logs/ is writable.</div>";
} else {
    echo "<div style='color:red; font-weight:bold'>[FAIL] storage/logs/ is NOT writable.</div>";
}

// 4. Try Bootstrapping (Only if files exist)
echo "<h3>4. Application Boot</h3>";
if ($allFilesFound) {
    try {
        require __DIR__ . '/../vendor/autoload.php';
        $app = require_once __DIR__ . '/../bootstrap/app.php';
        $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
        echo "<div style='color:green'>[PASS] Laravel successfully bootstrapped! (The issue might be in Route/DB connection)</div>";
    } catch (\Throwable $e) {
        echo "<div style='color:red; font-weight:bold'>[FAIL] Laravel Crashed during boot:</div>";
        echo "<pre style='background:#eee; padding:10px; border:1px solid #999;'>" . $e->getMessage() . "</pre>";
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
} else {
    echo "Skipping boot check due to missing files.";
}
?>
