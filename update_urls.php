<?php
$path = '/var/www/html/stagingapi.resortwala.com/.env';
if (!file_exists($path)) {
    die("File not found: $path");
}
$content = file_get_contents($path);
$updates = [
    'FRONTEND_ADMIN_URL' => 'http://72.61.242.42/admin',
    'FRONTEND_VENDOR_URL' => 'http://72.61.242.42/vendor',
    'FRONTEND_CUSTOMER_URL' => 'http://72.61.242.42',
    'APP_TIMEZONE' => 'Asia/Kolkata', // Trying to align timezone
    'DB_TIMEZONE' => '+05:30',
];

foreach ($updates as $key => $val) {
    if (preg_match("/^{$key}=.*/m", $content)) {
        $content = preg_replace("/^{$key}=.*/m", "{$key}={$val}", $content);
    } else {
        $content .= "\n{$key}={$val}";
    }
}
file_put_contents($path, $content);
echo "Updated .env successfully\n";
