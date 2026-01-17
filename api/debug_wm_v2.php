<?php
// Target Image reported by user
$input = '/var/www/html/api.resortwala.com/storage/app/public/properties/11/lHafFPHTmZh2qhP58Z0sULh401hfHgCxFiu9M0G3.jpeg';
$logo = '/var/www/html/api.resortwala.com/public/resortwala-logo.png';
$outputVal = '/var/www/html/api.resortwala.com/storage/app/public/debug_wm_out.jpg';

$filter = "[1:v][0:v]scale2ref=w=rw*0.40:h=-1[wm][base];[base][wm]overlay=W-w-(W*0.03):H-h-(W*0.03)";
$safeFilter = escapeshellarg($filter);
$safeInput = escapeshellarg($input);
$safeLogo = escapeshellarg($logo);
$safeOutput = escapeshellarg($outputVal);

$cmd = "ffmpeg -y -i {$safeInput} -i {$safeLogo} -filter_complex {$safeFilter} -q:v 2 {$safeOutput} 2>&1";

echo "--------------\n";
echo "Command: $cmd\n";
echo "--------------\n";

$out = shell_exec($cmd);
echo "Output:\n$out\n";
echo "--------------\n";

if (file_exists($outputVal)) {
    echo "Success! Output size: " . filesize($outputVal) . " bytes\n";
} else {
    echo "Failed! Output file not found.\n";
}
?>
