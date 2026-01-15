<?php

namespace App\Services;

use App\Models\UserDeviceToken;
use App\Models\NotificationLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class FCMService
{
    protected $serverKey;

    public function __construct()
    {
        // Using Legacy Header Auth as per 'Server Key' requirement
        $this->serverKey = config('services.fcm.server_key'); 
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
            Log::warning("FCM: No tokens found for users", $userIds);
            return ['success' => 0, 'failure' => 0];
        }

        return $this->sendToTokens($tokens, $title, $body, $data, $priority);
    }

    /**
     * Send to All Users (Topic or batch tokens)
     * For simplicity, we'll use a topic 'all_users' that the app should subscribe to,
     * OR batch send to all tokens if < 1000.
     * Let's use 'all_users' topic as it's scalable.
     */
    public function sendToTopic($topic, $title, $body, $data = [], $priority = 'high')
    {
        $url = 'https://fcm.googleapis.com/fcm/send';
        
        $payload = [
            'to' => '/topics/' . $topic,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default'
            ],
            'data' => array_merge($data, ['click_action' => 'FLUTTER_NOTIFICATION_CLICK']), // or custom for WebView
            'priority' => $priority
        ];

        return $this->executePush($url, $payload);
    }

    /**
     * Send raw push to tokens (supports validation)
     */
    public function sendToTokens(array $tokens, $title, $body, $data = [], $priority = 'high')
    {
        $url = 'https://fcm.googleapis.com/fcm/send';
        
        // FCM legacy supports up to 1000 tokens in 'registration_ids'
        $chunks = array_chunk($tokens, 1000);
        $totalSuccess = 0;
        $totalFailure = 0;

        foreach ($chunks as $chunk) {
            $payload = [
                'registration_ids' => $chunk,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'sound' => 'default'
                ],
                'data' => array_merge($data, ['click_action' => 'FLUTTER_NOTIFICATION_CLICK']),
                'priority' => $priority
            ];

            $result = $this->executePush($url, $payload);
            $totalSuccess += $result['success'] ?? 0;
            $totalFailure += $result['failure'] ?? 0;
        }

        return ['success' => $totalSuccess, 'failure' => $totalFailure];
    }

    private function executePush($url, $payload)
    {
        if (!$this->serverKey) {
            Log::error("FCM Server Key not configured.");
            return ['success' => 0, 'failure' => 1];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            if ($response->successful()) {
                return $response->json();
            } else {
                Log::error("FCM Push Failed", ['status' => $response->status(), 'body' => $response->body()]);
                return ['success' => 0, 'failure' => 1];
            }
        } catch (\Exception $e) {
            Log::error("FCM Exception: " . $e->getMessage());
            return ['success' => 0, 'failure' => 1];
        }
    }
}
