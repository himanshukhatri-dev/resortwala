<?php

namespace App\Http\Controllers;

use App\Services\PhonePeEnvironmentGuard;
use App\Services\PhonePeTokenManager;
use Illuminate\Http\Request;

class PhonePeHealthCheckController extends Controller
{
    private $tokenManager;

    public function __construct(PhonePeTokenManager $tokenManager)
    {
        $this->tokenManager = $tokenManager;
    }

    /**
     * Health check endpoint for PhonePe integration
     * GET /api/payment/phonepe/health
     */
    public function check(Request $request)
    {
        $status = [
            'service' => 'PhonePe Payment Gateway',
            'timestamp' => now()->toIso8601String(),
        ];

        try {
            // 1. Environment validation
            PhonePeEnvironmentGuard::validate();
            $status['environment'] = 'valid';
            $status['config'] = PhonePeEnvironmentGuard::getConfigStatus();

            // 2. Token manager check
            if (!$this->tokenManager->isConfigured()) {
                $status['token_manager'] = 'not_configured';
                $status['healthy'] = false;
                return response()->json($status, 500);
            }

            $status['token_manager'] = 'configured';

            // 3. Test token generation (optional, can be slow)
            if ($request->query('test_token') === 'true') {
                $token = $this->tokenManager->getAccessToken();
                $status['token_generation'] = $token ? 'success' : 'failed';
                $status['token_present'] = !empty($token);
            }

            $status['healthy'] = true;
            return response()->json($status, 200);

        } catch (\Exception $e) {
            $status['healthy'] = false;
            $status['error'] = $e->getMessage();
            return response()->json($status, 500);
        }
    }
}
