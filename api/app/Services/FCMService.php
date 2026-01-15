<?php

namespace App\Services;

use App\Models\UserDeviceToken;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class FCMService
{
    protected $serverKey;
    protected $serviceAccountPath;
    protected $projectId;

    public function __construct()
    {
        $this->serverKey = config('services.fcm.server_key');
        $this->serviceAccountPath = storage_path('app/firebase_service_account.json');
        
        // Try to get project ID from config or parsing JSON if needed
        $this->projectId = config('services.firebase.project_id', 'resortwala'); 
    }

    /**
     * Send notification to specific users
     */
    public function sendToUsers(array $userIds, $title, $body, $data = [], $priority = 'high')
    {
        $tokens = UserDeviceToken::whereIn('user_id', $userIds)
            ->pluck('device_token')
            ->toArray();

        if (empty($tokens)) {
            return ['success' => 0, 'failure' => 0];
        }

        return $this->sendToTokens($tokens, $title, $body, $data, $priority);
    }

    /**
     * Send to Topic
     */
    public function sendToTopic($topic, $title, $body, $data = [], $priority = 'high')
    {
        // V1 API Structure
        $accessToken = $this->getAccessToken();
        
        if ($accessToken) {
            // V1 API Payload
            $payload = [
                'message' => [
                    'topic' => $topic,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ]
                ]
            ];

            if (!empty($data)) {
                $payload['message']['data'] = array_map('strval', $data);
            }
            
            // Add Android specific config for priority
            if ($priority === 'high') {
                $payload['message']['android'] = [
                    'priority' => 'high'
                ];
            }

            return $this->executeV1Push($this->projectId, $accessToken, $payload);
        } else {
            // Fallback to Legacy if available
            return $this->sendLegacyToTopic($topic, $title, $body, $data, $priority);
        }
    }

    /**
     * Send to Tokens (Batching handled manually for V1 loop or Legacy batch)
     */
    public function sendToTokens(array $tokens, $title, $body, $data = [], $priority = 'high')
    {
        $accessToken = $this->getAccessToken();

        if ($accessToken) {
            // FCM V1 does not support multicast (batch send) natively like Legacy.
            // We must loop. For performance, we should parallelize or queue, 
            // but for now we loop sequentially.
            
            $success = 0;
            $failure = 0;

            foreach ($tokens as $token) {
                $payload = [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                    ]
                ];

                if (!empty($data)) {
                    $payload['message']['data'] = array_map('strval', $data);
                }
                
                
                if ($priority === 'high') {
                    $payload['message']['android'] = [
                        'priority' => 'high'
                    ];
                }

                $res = $this->executeV1Push($this->projectId, $accessToken, $payload);
                if ($res['success']) $success++;
                else $failure++;
            }

            return ['success' => $success, 'failure' => $failure];
        } else {
            return $this->sendLegacyToTokens($tokens, $title, $body, $data, $priority);
        }
    }

    private function executeV1Push($projectId, $accessToken, $payload)
    {
        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            if ($response->successful()) {
                return ['success' => 1, 'failure' => 0];
            } else {
                Log::error("FCM V1 Error", ['body' => $response->body()]);
                return ['success' => 0, 'failure' => 1, 'error' => $response->body()];
            }
        } catch (\Exception $e) {
            Log::error("FCM V1 Exception: " . $e->getMessage());
            return ['success' => 0, 'failure' => 1, 'error' => $e->getMessage()];
        }
    }

    private function getAccessToken()
    {
        if (!file_exists($this->serviceAccountPath)) {
            return null;
        }

        // Cache token for 55 minutes (tokens last 1 hour)
        return Cache::remember('fcm_access_token', 55 * 60, function () {
            $credentials = json_decode(file_get_contents($this->serviceAccountPath), true);
            if (!$credentials) return null;

            $now = time();
            $header = ['alg' => 'RS256', 'typ' => 'JWT'];
            $claims = [
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now
            ];

            $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($header)));
            $base64UrlClaims = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($claims)));
            
            $signatureInput = $base64UrlHeader . "." . $base64UrlClaims;
            
            $signature = '';
            $privateKey = $credentials['private_key'];
            openssl_sign($signatureInput, $signature, $privateKey, 'SHA256');
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
            
            $jwt = $signatureInput . "." . $base64UrlSignature;

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt
            ]);

            return $response->json()['access_token'] ?? null;
        });
    }

    // --- Legacy Fallback Implementations ---

    private function sendLegacyToTopic($topic, $title, $body, $data, $priority)
    {
        if (!$this->serverKey) return ['success' => 0, 'failure' => 0];
        
        $payload = [
            'to' => '/topics/' . $topic,
            'notification' => ['title' => $title, 'body' => $body, 'sound' => 'default'],
            'data' => array_merge($data, ['click_action' => 'FLUTTER_NOTIFICATION_CLICK']),
            'priority' => $priority
        ];
        return $this->executeLegacy($payload);
    }

    private function sendLegacyToTokens($tokens, $title, $body, $data, $priority)
    {
        if (!$this->serverKey) return ['success' => 0, 'failure' => 0];

        $chunks = array_chunk($tokens, 1000);
        $totalSuccess = 0;
        $totalFailure = 0;

        foreach ($chunks as $chunk) {
            $payload = [
                'registration_ids' => $chunk,
                'notification' => ['title' => $title, 'body' => $body, 'sound' => 'default'],
                'data' => array_merge($data, ['click_action' => 'FLUTTER_NOTIFICATION_CLICK']),
                'priority' => $priority
            ];
            $res = $this->executeLegacy($payload);
            $totalSuccess += $res['success'] ?? 0;
            $totalFailure += $res['failure'] ?? 0;
        }
        return ['success' => $totalSuccess, 'failure' => $totalFailure];
    }

    private function executeLegacy($payload)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', $payload);

            if ($response->successful()) {
                return $response->json(); // Legacy returns success count
            }
        } catch (\Exception $e) {
            Log::error("FCM Legacy Error: " . $e->getMessage());
        }
        return ['success' => 0, 'failure' => 1];
    }
}
