<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PhonePeTokenManager
{
    private $clientId;
    private $clientSecret;
    private $grantType;
    private $baseUrl;
    private $cacheKey = 'phonepe_oauth_token';
    private $cacheExpiry = 3300; // 55 minutes (tokens usually valid for 1 hour)

    public function __construct()
    {
        $this->clientId = env('PHONEPE_CLIENT_ID');
        $this->clientSecret = env('PHONEPE_CLIENT_SECRET');
        $this->grantType = env('PHONEPE_GRANT_TYPE', 'client_credentials');
        $this->baseUrl = env('PHONEPE_BASE_URL', 'https://api-preprod.phonepe.com/apis/pg-sandbox');
    }

    /**
     * Get valid access token (from cache or generate new)
     */
    public function getAccessToken(): ?string
    {
        // Check cache first
        $cachedToken = Cache::get($this->cacheKey);
        if ($cachedToken) {
            Log::debug('PhonePe: Using cached OAuth token');
            return $cachedToken;
        }

        // Generate new token
        return $this->generateToken();
    }

    /**
     * Generate new OAuth access token
     */
    private function generateToken(int $attempt = 1): ?string
    {
        if (empty($this->clientId) || empty($this->clientSecret)) {
            Log::error('PhonePe OAuth: Missing credentials', [
                'client_id_present' => !empty($this->clientId),
                'client_secret_present' => !empty($this->clientSecret)
            ]);
            return null;
        }

        try {
            Log::info('PhonePe OAuth: Generating token', [
                'attempt' => $attempt,
                'client_id' => substr($this->clientId, 0, 10) . '***'
            ]);

            $response = Http::asForm()->post($this->baseUrl . '/oauth/token', [
                'grant_type' => $this->grantType,
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $accessToken = $data['access_token'] ?? null;
                $expiresIn = $data['expires_in'] ?? $this->cacheExpiry;

                if ($accessToken) {
                    // Cache token (with 5 min buffer before actual expiry)
                    $cacheTime = max($expiresIn - 300, 60);
                    Cache::put($this->cacheKey, $accessToken, $cacheTime);

                    Log::info('PhonePe OAuth: Token generated successfully', [
                        'expires_in' => $expiresIn,
                        'cached_for' => $cacheTime
                    ]);

                    return $accessToken;
                }
            }

            // Log failure
            Log::error('PhonePe OAuth: Token generation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'attempt' => $attempt
            ]);

            // Retry logic (max 2 attempts)
            if ($attempt < 2) {
                sleep(1); // Wait 1 second before retry
                return $this->generateToken($attempt + 1);
            }

            return null;

        } catch (\Exception $e) {
            Log::error('PhonePe OAuth: Exception during token generation', [
                'message' => $e->getMessage(),
                'attempt' => $attempt
            ]);

            // Retry on exception
            if ($attempt < 2) {
                sleep(1);
                return $this->generateToken($attempt + 1);
            }

            return null;
        }
    }

    /**
     * Clear cached token (useful for testing or forced refresh)
     */
    public function clearToken(): void
    {
        Cache::forget($this->cacheKey);
        Log::info('PhonePe OAuth: Token cache cleared');
    }

    /**
     * Check if token manager is properly configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->clientId) && 
               !empty($this->clientSecret) && 
               !empty($this->baseUrl);
    }
}
