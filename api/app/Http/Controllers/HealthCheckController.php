<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class HealthCheckController extends Controller
{
    /**
     * Check SSL configuration and connectivity to PhonePe API
     */
    public function sslCheck()
    {
        $cafile = ini_get('openssl.cafile');
        $capath = ini_get('openssl.capath');
        $curlCainfo = ini_get('curl.cainfo');

        // Check if CA bundle is configured
        if (empty($cafile) && empty($capath) && empty($curlCainfo)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No CA certificate bundle configured',
                'openssl.cafile' => $cafile ?: 'not set',
                'openssl.capath' => $capath ?: 'not set',
                'curl.cainfo' => $curlCainfo ?: 'not set'
            ], 500);
        }

        // Verify CA bundle file exists
        if ($cafile && !file_exists($cafile)) {
            return response()->json([
                'status' => 'error',
                'message' => 'CA bundle file not found',
                'openssl.cafile' => $cafile,
                'file_exists' => false
            ], 500);
        }

        // Test actual SSL connection to PhonePe API
        $ch = curl_init('https://api-preprod.phonepe.com');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request

        $result = curl_exec($ch);
        $error = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $sslVerifyResult = curl_getinfo($ch, CURLINFO_SSL_VERIFYRESULT);
        curl_close($ch);

        if ($error) {
            Log::error("SSL Health Check Failed", [
                'error' => $error,
                'http_code' => $httpCode,
                'ssl_verify_result' => $sslVerifyResult
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'SSL connection to PhonePe failed',
                'error' => $error,
                'http_code' => $httpCode,
                'ssl_verify_result' => $sslVerifyResult,
                'openssl.cafile' => $cafile
            ], 500);
        }

        return response()->json([
            'status' => 'ok',
            'message' => 'SSL configuration is correct and PhonePe API is reachable',
            'http_code' => $httpCode,
            'ssl_verify_result' => $sslVerifyResult,
            'ssl_verification' => 'enabled',
            'configuration' => [
                'openssl.cafile' => $cafile,
                'openssl.capath' => $capath ?: 'not set',
                'curl.cainfo' => $curlCainfo ?: 'not set'
            ]
        ]);
    }

    /**
     * General API health check
     */
    public function index()
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'environment' => config('app.env')
        ]);
    }
}
