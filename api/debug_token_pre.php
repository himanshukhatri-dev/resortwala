<?php
$file = '/var/www/html/api.resortwala.com/vendor/phonepe/phonepe-pg-php-sdk/src/phonepe/sdk/pg/common/tokenHandler/TokenService.php';
$lines = file($file);
$slice = array_slice($lines, 20, 40); // Lines 21-60
echo base64_encode(implode("", $slice));
