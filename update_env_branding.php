<?php
$path = '/var/www/html/stagingapi.resortwala.com/.env';
if (!file_exists($path)) {
    die("File not found: $path");
}
$content = file_get_contents($path);
$updates = [
    'APP_NAME' => 'ResortWala',
    'MAIL_FROM_NAME' => 'ResortWala',
    'FRONTEND_ADMIN_URL' => 'http://72.61.242.42/admin',
    'FRONTEND_VENDOR_URL' => 'http://72.61.242.42/vendor',
    'FRONTEND_CUSTOMER_URL' => 'http://72.61.242.42',
    'APP_TIMEZONE' => 'Asia/Kolkata',
    'DB_TIMEZONE' => '+05:30',
];

foreach ($updates as $key => $val) {
    // Check if key exists
    if (preg_match("/^{$key}=.*/m", $content)) {
        // Replace existing
        $content = preg_replace("/^{$key}=.*/m", "{$key}=\"{$val}\"", $content);
    } else {
        // Append new
        $content .= "\n{$key}=\"{$val}\"";
    }
}
file_put_contents($path, $content);
echo "Updated .env successfully\n";
