<?php
// debug_watermark.php
// Setup Laravel
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "Starting Watermark Debug...\n";

// Target File (from User's Screenshot/Issue)
// properties/11/Z6PCPbiGMz7S2ZlbGwFS4Xo05gb2QLbvp7TTw9PH.jpeg
$path = 'properties/11/Z6PCPbiGMz7S2ZlbGwFS4Xo05gb2QLbvp7TTw9PH.jpeg';
$realPath = storage_path('app/public/' . $path);
$logoPath = public_path('resortwala-logo.png');

echo "Image Path: $realPath\n";
echo "Logo Path: $logoPath\n";

if (!file_exists($realPath)) die("ERROR: Image not found!\n");
if (!file_exists($logoPath)) die("ERROR: Logo not found!\n");

$tempOutput = sys_get_temp_dir() . '/debug_wm_' . uniqid() . '.jpg';
$safeInput = escapeshellarg($realPath);
$safeLogo = escapeshellarg($logoPath);
// Test 0: Check Version
echo "--- Test 0: Version ---\n";
echo shell_exec("ffmpeg -version 2>&1");

// Test 1: Simple Copy (No Filter)
echo "\n--- Test 1: Simple Copy ---\n";
$cmd1 = "ffmpeg -y -i \"{$realPath}\" -vframes 1 \"{$tempOutput}_simple.jpg\" 2>&1";
echo "CMD: $cmd1\n";
$out1 = shell_exec($cmd1);
echo "OUT: $out1\n";

if (!file_exists("{$tempOutput}_simple.jpg")) {
    die("CRITICAL: Simple copy failed. FFmpeg or Permissions issue.\n");
}

// Test 2: Watermark
echo "\n--- Test 2: Watermark ---\n";
$filter = "[1:v][0:v]scale2ref=w=rw*0.85:h=-1[wm][base];[base][wm]overlay=W-w-(W*0.03):H-h-(W*0.03)";
$cmd2 = "ffmpeg -y -i \"{$realPath}\" -i \"{$logoPath}\" -filter_complex \"{$filter}\" -q:v 2 \"{$tempOutput}\" 2>&1";

echo "CMD: $cmd2\n";
$output = shell_exec($cmd2);
echo "FFmpeg Output: \n$output\n";

if (file_exists($tempOutput) && filesize($tempOutput) > 100) {
    echo "SUCCESS: Watermarked file created at $tempOutput (" . filesize($tempOutput) . " bytes)\n";
    
    // Copy Back
    if (copy($tempOutput, $realPath)) {
        echo "SUCCESS: Overwrite successful!\n";
    } else {
        echo "ERROR: Failed to overwrite original (Permission denied?)\n";
    }
} else {
    echo "ERROR: FFmpeg failed to create output.\n";
}
