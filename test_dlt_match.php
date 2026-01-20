<?php

require __DIR__ . '/vendor/autoload.php';

echo "--- DLT Match Simulation ---\n";

// Simulated DB Content
$templateContent = "Dear User, {{otp}} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";
$dltContent = "Dear User, {#var#} is your OTP for login at ResortWala. Valid for 10 mins. Do not share. - ResortWala";

echo "Template: $templateContent\n";
echo "DLT Reg : $dltContent\n";

// Current Logic
$search = substr($templateContent, 0, 15);
echo "Current Search Prefix (15): '$search'\n";

if (strpos($dltContent, $search) === 0) {
    echo "  [MATCH] (Current Logic)\n";
} else {
    echo "  [FAIL] (Current Logic)\n";
}

// Proposed Fix Logic
// Replace {{...}} with {#var#}
$normalized = preg_replace('/\{\{[^}]+\}\}/', '{#var#}', $templateContent);
echo "Normalized Template: '$normalized'\n";

$searchNew = substr($normalized, 0, 15);
echo "New Search Prefix (15): '$searchNew'\n";

if (strpos($dltContent, $searchNew) === 0) {
    echo "  [MATCH] (Proposed Logic)\n";
} else {
    echo "  [FAIL] (Proposed Logic)\n";
}

// Check with full string match attempt (more robust)
if ($normalized === $dltContent) {
    echo "  [EXACT MATCH] Normalized == DLT\n";
}
