<?php
$path = '/var/www/html/stagingapi.resortwala.com/.env';
if (!file_exists($path)) {
    die("File not found: $path");
}
$content = file_get_contents($path);
$updates = [
    'FRONTEND_ADMIN_URL' => 'http://stagingadmin.resortwala.com',
    'FRONTEND_VENDOR_URL' => 'http://stagingvendor.resortwala.com',
    'FRONTEND_CUSTOMER_URL' => 'http://staging.resortwala.com',
];

foreach ($updates as $key => $val) {
    if (preg_match("/^{$key}=.*/m", $content)) {
        $content = preg_replace("/^{$key}=.*/m", "{$key}=\"{$val}\"", $content);
    } else {
        $content .= "\n{$key}=\"{$val}\"";
    }
}
file_put_contents($path, $content);
echo "Updated .env successfully\n";
