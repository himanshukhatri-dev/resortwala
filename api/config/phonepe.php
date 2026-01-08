<?php

return [
    'merchant_id' => env('PHONEPE_MERCHANT_ID'),
    'salt_key' => env('PHONEPE_SALT_KEY'),
    'salt_index' => env('PHONEPE_SALT_INDEX'),
    'env' => env('PHONEPE_ENV', 'UAT'), // UAT or PROD
];
