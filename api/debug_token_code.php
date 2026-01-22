<?php
$file = '/var/www/html/api.resortwala.com/vendor/phonepe/phonepe-pg-php-sdk/src/phonepe/sdk/pg/common/tokenHandler/TokenService.php';
$lines = file($file);
// Read lines 50 to 90
$output = array_slice($lines, 50, 40);
foreach ($output as $i => $line) {
    echo ($i + 50 + 1) . ": " . $line;
}
