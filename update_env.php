<?php
$path = '/var/www/html/stagingapi.resortwala.com/.env';
if (!file_exists($path)) {
    die("File not found: $path");
}
$content = file_get_contents($path);
$updates = [
    'MAIL_MAILER' => 'smtp',
    'MAIL_HOST' => 'smtpout.secureserver.net',
    'MAIL_PORT' => '465',
    'MAIL_USERNAME' => 'support@resortwala.com',
    'MAIL_PASSWORD' => 'Shehnaaz1959',
    'MAIL_ENCRYPTION' => 'ssl',
    'MAIL_FROM_ADDRESS' => 'support@resortwala.com',
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
