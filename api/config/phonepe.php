<?php

return [
    'merchant_id' => env('PHONEPE_MERCHANT_ID', 'PGTESTPAYUAT86'),
    'client_id' => env('PHONEPE_CLIENT_ID'),
    'client_secret' => env('PHONEPE_CLIENT_SECRET'),
    'salt_key' => env('PHONEPE_SALT_KEY', '96434309-7796-489d-8924-ab56988a6076'),
    'salt_index' => env('PHONEPE_SALT_INDEX', '1'),
    'env' => env('PHONEPE_ENV', 'PROD'), // UAT or PROD
];
