<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:8081',
        'http://localhost:3005',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        // Local ResortWala Domains
        'http://local.resortwala.com:5173',
        'http://local.resortwala.com:5174',
        'http://local.resortwala.com:5175',
        'http://local.resortwala.com:5176',
        'http://local.resortwala.com:8085',
        // Staging Domains
        'http://staging.resortwala.com',
        'http://stagingvendor.resortwala.com',
        'http://stagingadmin.resortwala.com',
        'http://stagingapi.resortwala.com',
        'http://72.61.242.42', // Staging IP
        // Beta & Production Domains
        'http://beta.resortwala.com',
        'http://resortwala.com',
        'http://www.resortwala.com',
        // HTTPS Variants
        'https://staging.resortwala.com',
        'https://stagingvendor.resortwala.com',
        'https://stagingadmin.resortwala.com',
        'https://stagingapi.resortwala.com',
        'https://beta.resortwala.com',
        'https://resortwala.com',
        'https://www.resortwala.com',
        'https://admin.resortwala.com',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
