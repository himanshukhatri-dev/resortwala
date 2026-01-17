<?php
// debug_wm_standalone.php - Framework Agnostic
echo "Starting Standalone Watermark Debug...\n";

// Hardcoded Absolute Paths for Server
$baseDir = '/var/www/html/api.resortwala.com';
$imageRel = 'storage/app/public/properties/11/Z6PCPbiGMz7S2ZlbGwFS4Xo05gb2QLbvp7TTw9PH.jpeg';
$logoRel = 'public/resortwala-logo.png';

$realPath = $baseDir . '/' . $imageRel;
$logoPath = $baseDir . '/' . $logoRel;

echo "Image: $realPath\n";
echo "Logo: $logoPath\n";

if (!file_exists($realPath)) die("ERROR: Image File not found at $realPath\n");
if (!file_exists($logoPath)) die("ERROR: Logo File not found at $logoPath\n");

$tempOutput = sys_get_temp_dir() . '/debug_wm_standalone_' . uniqid() . '.jpg';

// Test 0: Check Version
echo "--- Test 0: Version ---\n";
echo shell_exec("ffmpeg -version 2>&1");

// Test 2: Watermark (Original 15%)
echo "\n--- Test 2: Watermark (Baseline 15%) ---\n";
// Filter: Scale Logo to 15% (Original known working)
// Reverting to simple syntax that supposedly worked before
$filter = "[1:v][0:v]scale2ref=w=rw*0.15:h=-1[wm][base];[base][wm]overlay=W-w-20:H-h-20";

$cmd = "ffmpeg -y -i " . escapeshellarg($realPath) . " -i " . escapeshellarg($logoPath) . " -filter_complex " . escapeshellarg($filter) . " -q:v 2 " . escapeshellarg($tempOutput) . " 2>&1";

echo "CMD: $cmd\n";
$output = shell_exec($cmd);
echo "FFmpeg Output (Partial):\n" . substr($output, -500) . "\n";

if (file_exists($tempOutput) && filesize($tempOutput) > 100) {
    echo "SUCCESS: Watermarked file created at $tempOutput (" . filesize($tempOutput) . " bytes)\n";
    
    // Copy Back
    if (copy($tempOutput, $realPath)) {
        echo "SUCCESS: Overwrite successful! The live image should now be updated.\n";
    } else {
        echo "ERROR: Failed to overwrite original (Permission denied?)\n";
    }
} else {
    echo "ERROR: FFmpeg failed to create output.\n";
}
