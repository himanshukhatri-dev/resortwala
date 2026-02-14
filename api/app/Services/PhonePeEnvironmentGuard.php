<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class PhonePeEnvironmentGuard
{
    /**
     * Validate PhonePe environment configuration
     * Throws exception if sandbox is detected in production
     */
    public static function validate(): void
    {
        $appEnv = env('APP_ENV');
        $phonePeEnv = env('PHONEPE_ENV');
        $phonePeBaseUrl = env('PHONEPE_BASE_URL');

        // CRITICAL: Prevent sandbox usage in production
        if ($appEnv === 'production') {
            if (
                $phonePeEnv === 'sandbox' ||
                str_contains($phonePeBaseUrl ?? '', 'preprod') ||
                str_contains($phonePeBaseUrl ?? '', 'sandbox')
            ) {

                Log::critical('PhonePe Environment Guard: SANDBOX DETECTED IN PRODUCTION', [
                    'app_env' => $appEnv,
                    'phonepe_env' => $phonePeEnv,
                    'phonepe_url' => $phonePeBaseUrl
                ]);

                throw new \RuntimeException(
                    'FATAL: PhonePe sandbox configuration detected in production environment. ' .
                    'Deployment blocked for security. Update PHONEPE_ENV and PHONEPE_BASE_URL to production values.'
                );
            }
        }

        // Validate required configuration
        $requiredVars = [
            'PHONEPE_MERCHANT_ID',
            'PHONEPE_CLIENT_ID',
            'PHONEPE_CLIENT_SECRET',
            'PHONEPE_BASE_URL'
        ];

        $missing = [];
        foreach ($requiredVars as $var) {
            if (empty(env($var))) {
                $missing[] = $var;
            }
        }

        if (!empty($missing)) {
            Log::error('PhonePe Environment Guard: Missing configuration', [
                'missing_vars' => $missing
            ]);

            throw new \RuntimeException(
                'PhonePe configuration incomplete. Missing: ' . implode(', ', $missing)
            );
        }

        Log::info('PhonePe Environment Guard: Validation passed', [
            'app_env' => $appEnv,
            'phonepe_env' => $phonePeEnv
        ]);
    }

    /**
     * Get masked configuration for debugging
     */
    public static function getConfigStatus(): array
    {
        return [
            'app_env' => env('APP_ENV'),
            'phonepe_env' => env('PHONEPE_ENV'),
            'base_url' => env('PHONEPE_BASE_URL'),
            'merchant_id' => self::mask(env('PHONEPE_MERCHANT_ID')),
            'client_id' => self::mask(env('PHONEPE_CLIENT_ID')),
            'client_secret_configured' => !empty(env('PHONEPE_CLIENT_SECRET')),
        ];
    }

    /**
     * Mask sensitive data for logging
     */
    private static function mask(?string $value): string
    {
        if (empty($value)) {
            return 'NOT_SET';
        }

        $length = strlen($value);
        if ($length <= 4) {
            return str_repeat('*', $length);
        }

        return substr($value, 0, 4) . str_repeat('*', $length - 4);
    }
}
