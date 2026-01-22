<?php
$file = '/var/www/html/api.resortwala.com/vendor/phonepe/phonepe-pg-php-sdk/src/phonepe/sdk/pg/common/tokenHandler/TokenService.php';
if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    echo "File not found";
}
